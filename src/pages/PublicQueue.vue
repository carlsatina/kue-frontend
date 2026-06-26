<template>
  <div class="public-queue" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <!-- Pull to refresh indicator -->
    <div class="pull-indicator" :class="{ active: isPulling || refreshing }">
      <span v-if="!refreshing">↓ Pull to refresh</span>
      <span v-else>Refreshing…</span>
    </div>

    <!-- Hero header -->
    <div class="pq-hero">
      <div class="pq-hero-inner">
        <div class="pq-hero-top">
          <div>
            <div class="pq-eyebrow">Live Queue</div>
            <h1 class="pq-title">{{ data.session?.name || 'Queue' }}</h1>
          </div>
          <div class="pq-live-group">
            <div class="pq-live-pill">
              <span class="pq-live-dot" aria-hidden="true"></span>
              Live
            </div>
            <button
              class="pq-refresh-btn"
              type="button"
              :class="{ spinning: refreshing }"
              :disabled="refreshing"
              aria-label="Refresh"
              @click="manualRefresh"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            </button>
          </div>
        </div>
        <div class="pq-hero-actions">
          <button class="pq-action-btn" @click="openRankings">
            Rankings
            <span v-if="totalPlayers" class="pq-action-count">{{ totalPlayers }}</span>
          </button>
          <button class="pq-action-btn" @click="openBracket">Bracket</button>
        </div>
        <div class="pq-stats">
          <div class="pq-stat">
            <span class="pq-stat-label">Courts</span>
            <strong class="pq-stat-value">{{ data.courts?.length || 0 }}</strong>
          </div>
          <div class="pq-stat-divider"></div>
          <div class="pq-stat">
            <span class="pq-stat-label">In Queue</span>
            <strong class="pq-stat-value">{{ queueMatches.length }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Now Playing -->
    <div class="pq-section">
      <div class="pq-section-head">
        <div class="pq-section-title">Now Playing</div>
        <span class="pq-section-count">{{ data.courts?.length || 0 }} courts</span>
      </div>
      <div v-if="!data.courts?.length" class="pq-empty">No courts active yet.</div>
      <div v-else class="courts-grid">
        <div
          v-for="court in data.courts"
          :key="court.court.id"
          class="court-card"
          :class="{ playing: court.currentMatch }"
        >
          <div class="court-card-head">
            <strong class="court-name">{{ court.court.name }}</strong>
            <span class="court-status-badge" :class="courtStatusClass(court)">
              {{ statusLabel(court.status) }}
            </span>
          </div>

          <CourtFloor
            :name="court.court.name"
            :state="courtState(court)"
            :team-a="teamLabel(court.currentMatch, 1)"
            :team-b="teamLabel(court.currentMatch, 2)"
            :empty-text="court.status === 'maintenance' ? 'Under maintenance' : 'Waiting for next match'"
          />

          <div v-if="court.currentMatch" class="court-foot">
            <span class="court-elapsed">
              <svg class="court-elapsed-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9.5V13l2.5 2M9 2.5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              {{ elapsedTime(court.currentMatch?.startedAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Matches -->
    <div class="pq-section">
      <div class="pq-section-head">
        <div class="pq-section-title">Upcoming Matches</div>
        <span class="pq-section-count">{{ queueMatches.length }} queued</span>
      </div>
      <div v-if="queueMatches.length === 0" class="pq-empty">No matches queued.</div>
      <div v-else class="queue-list">
        <div v-for="(match, idx) in queueMatches" :key="match.id" class="queue-item">
          <div class="queue-item-meta">
            <span class="queue-position">#{{ idx + 1 }}</span>
            <span class="queue-type">{{ match.typeLabel }}</span>
            <span class="queue-time">{{ formatTime(match.requestedAt) }}</span>
          </div>
          <div class="queue-matchup">
            <span class="queue-team">{{ match.teamA.join(' + ') }}</span>
            <span class="queue-vs-pill">vs</span>
            <span class="queue-team">{{ match.teamB.join(' + ') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Rankings modal -->
  <div v-if="showRankingsModal" class="modal-backdrop">
    <div class="modal-card rank-modal rank-board">
      <div class="rank-modal-head">
        <div>
          <p class="rank-modal-session">{{ data.session?.name || "Session" }}</p>
          <h3 class="rank-modal-title">{{ rankTitle }}</h3>
          <p class="rank-modal-count">{{ totalCount }} {{ summaryLabel }}</p>
        </div>
        <button class="button ghost button-compact" @click="closeRankings">Close</button>
      </div>

      <div v-if="showPairToggle || showTeamToggle" class="rank-tab-bar">
        <button class="rank-tab" :class="{ active: rankMode === 'players' }" type="button" @click="rankMode = 'players'">Players</button>
        <button v-if="showPairToggle" class="rank-tab" :class="{ active: rankMode === 'pairs' }" type="button" @click="rankMode = 'pairs'">Pairs</button>
        <button v-if="showTeamToggle" class="rank-tab" :class="{ active: rankMode === 'teams' }" type="button" @click="rankMode = 'teams'">Teams</button>
      </div>

      <div v-if="pairRankLoading && isPairView" class="rank-loading">Loading pairs…</div>
      <div v-else-if="teamRankLoading && isTeamView" class="rank-loading">Loading teams…</div>
      <div v-else-if="rankedRows.length === 0" class="rank-loading">No stats yet.</div>
      <template v-else>
        <div class="rank-podium">
          <div
            v-for="(row, idx) in podiumRows"
            :key="row.id"
            class="rank-podium-card"
            :class="`podium-${rankClass(row.rank)}`"
            :style="{ animationDelay: `${idx * 80}ms` }"
          >
            <div class="podium-top-row">
              <div class="rank-medal"><span class="rank-number">{{ row.rank }}</span></div>
              <span class="podium-icon">{{ rankCornerIcon(row.rank) }}</span>
              <div class="rank-name podium-name">{{ row.name }}</div>
            </div>
            <div class="rank-mini-stats">
              <span>GP {{ row.gamesPlayed }}</span>
              <span>W {{ row.wins }}</span>
              <span>L {{ row.losses }}</span>
              <span v-if="isTeamView">Pts {{ row.points }}</span>
              <span v-else>{{ winPct(row.winPct) }}</span>
            </div>
          </div>
        </div>
        <div class="rank-list rank-modal-body">
          <div
            v-for="(row, idx) in restRows"
            :key="row.id"
            class="rank-row"
            :style="{ animationDelay: `${(idx + 3) * 40}ms` }"
          >
            <div class="rank-row-left">
              <div class="rank-row-badge" :class="rankClass(row.rank)"><span class="rank-number">{{ row.rank }}</span></div>
              <div class="rank-row-name">{{ row.name }}</div>
            </div>
            <div class="rank-row-icon">{{ rankCornerIcon(row.rank) }}</div>
            <div class="rank-row-stats">
              <span class="rank-pill">GP {{ row.gamesPlayed }}</span>
              <span class="rank-pill win">W {{ row.wins }}</span>
              <span class="rank-pill loss">L {{ row.losses }}</span>
              <span v-if="isTeamView" class="rank-pill pct">Pts {{ row.points }}</span>
              <span v-else class="rank-pill pct">{{ winPct(row.winPct) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Bracket modal -->
  <div v-if="showBracketModal" class="modal-backdrop bracket-backdrop">
    <div class="modal-card bracket-modal">
      <div class="bracket-modal-head">
        <div class="bracket-modal-head-text">
          <p class="rank-modal-session">{{ data.session?.name || "Session" }}</p>
          <h3 class="bracket-modal-title">Bracket</h3>
        </div>
        <button class="button ghost button-compact" @click="closeBracket">Close</button>
      </div>
      <div v-if="bracketLoading" class="rank-loading">Loading bracket…</div>
      <div v-else-if="bracketError" class="notice">{{ bracketError }}</div>
      <div v-else class="bracket-modal-body">
        <div v-if="!bracketData || bracketData.error" class="rank-loading">
          {{ bracketData?.error || "Bracket unavailable." }}
        </div>
        <div v-else class="bracket-surface">
          <div v-if="bracketData.type === 'single'" class="tournament-bracket">
            <TournamentBracket v-bind="bracketVisuals" :rounds="bracketData.rounds" />
          </div>
          <div v-else-if="bracketData.type === 'double'" class="tournament-bracket-stack">
            <div class="tournament-bracket-block">
              <div class="bracket-block-label">Winners Bracket</div>
              <div class="tournament-bracket">
                <TournamentBracket v-bind="bracketVisuals" :rounds="bracketData.winners" />
              </div>
            </div>
            <div v-if="bracketData.losers?.length" class="tournament-bracket-block">
              <div class="bracket-block-label">Losers Bracket</div>
              <div class="tournament-bracket">
                <TournamentBracket v-bind="bracketVisuals" :rounds="bracketData.losers" />
              </div>
            </div>
            <div v-if="bracketData.finals?.length" class="tournament-bracket-block">
              <div class="bracket-block-label">Grand Final</div>
              <div class="tournament-bracket">
                <TournamentBracket v-bind="bracketVisuals" :rounds="bracketData.finals" />
              </div>
            </div>
          </div>
          <div v-else class="round-robin-view">
            <div v-if="roundRobinStandings.length" class="rr-standings-block">
              <div class="bracket-block-label">Standings</div>
              <div class="standings-table">
                <div class="standings-row head">
                  <span>#</span><span>Team</span><span>W</span><span>L</span><span>GP</span><span>PTS</span>
                </div>
                <div v-for="team in roundRobinStandings" :key="team.id" class="standings-row">
                  <span class="standings-rank">{{ team.rank }}</span>
                  <span class="standings-name">{{ team.name }}</span>
                  <span>{{ team.wins }}</span>
                  <span>{{ team.losses }}</span>
                  <span>{{ team.gamesPlayed }}</span>
                  <span class="standings-points">{{ team.pointsFor }}</span>
                </div>
              </div>
            </div>
            <div v-for="round in bracketData.rounds" :key="round.name" class="round-robin-round">
              <div class="bracket-block-label">{{ round.name }}</div>
              <div class="rr-round-matches">
                <div v-for="match in round.matchs" :key="match.id" class="match-card simple">
                  <div class="match-line">
                    <span class="match-name">{{ match.team1?.name || "-" }}</span>
                    <span v-if="roundRobinScore(match, 1) != null" class="match-score-pill">{{ roundRobinScore(match, 1) }}</span>
                  </div>
                  <div class="match-line">
                    <span class="match-name">{{ match.team2?.name || "-" }}</span>
                    <span v-if="roundRobinScore(match, 2) != null" class="match-score-pill">{{ roundRobinScore(match, 2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { TournamentBracket } from "vue3-tournament";
import { applySeedOrder, extractSeedOrder } from "../utils/seedOrder.js";
import "vue3-tournament/style.css";
import { api } from "../api.js";
import { useRoute } from "vue-router";
import CourtFloor from "../components/CourtFloor.vue";

const route = useRoute();
const data = ref({});
const rankedPlayers = ref([]);
const totalPlayers = ref(0);
const rankMode = ref("players");
const pairRankMatches = ref([]);
const pairRankLoading = ref(false);
const teamStats = ref([]);
const teamRankLoading = ref(false);
const startY = ref(0);
const isPulling = ref(false);
const refreshing = ref(false);
const nowTick = ref(Date.now());
let timerId = null;
let refreshTimerId = null;
const REFRESH_INTERVAL_MS = 10000; // re-fetch live data every 10s
const showRankingsModal = ref(false);
const showBracketModal = ref(false);
const bracketLoading = ref(false);
const bracketError = ref("");
const bracketSession = ref(null);
const bracketPlayers = ref([]);
const bracketMatches = ref([]);
const bracketOverrides = ref([]);
const bracketType = ref("single");
const bracketVisuals = {
  format: "default",
  textColor: "#1e293b",
  titleColor: "#64748b",
  teamBackgroundColor: "transparent",
  highlightTeamBackgroundColor: "rgba(21, 101, 192, 0.08)",
  scoreBackgroundColor: "#1565c0",
  winnerScoreBackgroundColor: "#00897b"
};

const bracketMatchFormat = computed(() => bracketSession.value?.gameType || "doubles");

const bracketJoinedPlayers = computed(() => {
  return bracketPlayers.value
    .filter((sp) => sp.status !== "done")
    .sort((a, b) => new Date(a.checkedInAt) - new Date(b.checkedInAt))
    .map((sp) => ({
      id: sp.player.id,
      name: sp.player.nickname || sp.player.fullName
    }));
});

const bracketSeedOrderIds = computed(() =>
  extractSeedOrder(bracketOverrides.value, bracketMatchFormat.value)
);

const bracketSeededPlayers = computed(() =>
  applySeedOrder(bracketJoinedPlayers.value, bracketSeedOrderIds.value)
);

const bracketEntrants = computed(() => {
  if (bracketMatchFormat.value === "doubles") {
    return buildTeamEntrants(bracketJoinedPlayers.value, []);
  }
  return bracketSeededPlayers.value;
});

const bracketEntrantKeys = computed(() => {
  const keys = bracketEntrants.value
    .map((entrant) => (typeof entrant === "string" ? entrant : entrant?.id))
    .filter(Boolean);
  return new Set(keys);
});

const bracketOverrideMap = computed(() => {
  const map = {};
  bracketOverrides.value.forEach((override) => {
    if (override.bracketType !== bracketType.value) return;
    if (override.matchFormat !== bracketMatchFormat.value) return;
    map[override.matchId] = {
      winnerId: override.winnerId,
      score: override.scoreJson
    };
  });
  return map;
});

const bracketMatchResults = computed(() => buildMatchResults(bracketMatches.value));
const roundRobinStandings = computed(() => {
  if (bracketType.value !== "round_robin") return [];
  if (!bracketData.value?.rounds) return [];
  return buildRoundRobinStandings(bracketData.value.rounds, bracketEntrants.value);
});

const bracketData = computed(() => {
  if (!bracketSession.value) return null;
  if (bracketEntrants.value.length < 2) {
    const label = bracketMatchFormat.value === "doubles" ? "teams" : "players";
    return { error: `At least 2 ${label} are required.` };
  }
  if (bracketType.value === "single") {
    return {
      type: "single",
      rounds: applyMatchResults(buildSingleElimination(bracketEntrants.value), true)
    };
  }
  if (bracketType.value === "double") {
    const data = buildDoubleElimination(bracketEntrants.value);
    return {
      ...data,
      winners: applyMatchResults(data.winners, true),
      losers: applyMatchResults(data.losers),
      finals: applyMatchResults(data.finals)
    };
  }
  return {
    type: "round_robin",
    rounds: applyMatchResults(buildRoundRobin(bracketEntrants.value))
  };
});

const queueMatches = computed(() => {
  const entries = (data.value.queue || []).slice();
  const matches = [];
  for (let i = 0; i < entries.length; i += 2) {
    const a = entries[i];
    const b = entries[i + 1];
    if (!a || !b) break;
    matches.push({
      id: `${a.id}-${b.id}`,
      typeLabel: a.type === "doubles" ? "Doubles Match" : "Singles Match",
      teamA: a.players.map((p) => p.player.nickname || p.player.fullName),
      teamB: b.players.map((p) => p.player.nickname || p.player.fullName),
      requestedAt: a.createdAt
    });
  }
  return matches;
});

const showPairToggle = computed(() => data.value?.session?.gameType === "doubles");
const showTeamToggle = computed(() => data.value?.session?.mode === "tournament");
const isPairView = computed(() => rankMode.value === "pairs" && showPairToggle.value);
const isTeamView = computed(() => rankMode.value === "teams" && showTeamToggle.value);
const rankedRows = computed(() => {
  if (isTeamView.value) return teamStats.value;
  if (isPairView.value) return buildPairRankings(pairRankMatches.value);
  return buildPlayerRows(rankedPlayers.value);
});
const podiumRows = computed(() => rankedRows.value.slice(0, 3));
const restRows = computed(() => rankedRows.value.slice(3));
const totalCount = computed(() => {
  if (isTeamView.value) return rankedRows.value.length;
  if (isPairView.value) return rankedRows.value.length;
  return totalPlayers.value;
});
const summaryLabel = computed(() => {
  if (isTeamView.value) return "teams";
  if (isPairView.value) return "pairs";
  return "players";
});
const rankTitle = computed(() => {
  if (isTeamView.value) return "Top Teams";
  if (isPairView.value) return "Top Pairs";
  return "Top Players";
});

function teamLabel(match, teamNumber) {
  if (!match?.participants) return "";
  return match.participants
    .filter((p) => p.teamNumber === teamNumber)
    .map((p) => p.player.nickname || p.player.fullName)
    .join(" + ");
}

function formatTime(timestamp) {
  if (!timestamp) return "—";
  const dt = new Date(timestamp);
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function elapsedTime(startedAt) {
  if (!startedAt) return "—";
  const diffMs = Math.max(0, nowTick.value - new Date(startedAt).getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${String(remMinutes).padStart(2, "0")}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function statusLabel(status) {
  if (status === "in_match") return "Occupied";
  if (status === "maintenance") return "Maintenance";
  if (status === "available") return "Available";
  return status || "—";
}

function courtStatusClass(court) {
  if (court.status === "maintenance") return "warning";
  if (court.currentMatch || court.status === "in_match" || court.status === "occupied") return "live";
  return "";
}

function courtState(court) {
  if (court.currentMatch) return "live";
  if (court.status === "maintenance") return "maintenance";
  return "idle";
}

function winPct(value) {
  const pct = Math.round((value || 0) * 100);
  return `${pct}%`;
}

function rankClass(rank) {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "neutral";
}

function rankCornerIcon(rank) {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "⭐";
}

function buildPlayerRows(players) {
  return (players || []).map((player) => ({
    id: player.playerId,
    name: player.player?.nickname || player.player?.fullName || "Player",
    gamesPlayed: player.gamesPlayed || 0,
    wins: player.wins || 0,
    losses: player.losses || 0,
    winPct: player.winPct || 0,
    rank: player.rank || 0
  }));
}

function buildPairRankings(history) {
  const stats = new Map();
  const nameMap = new Map();
  (history || []).forEach((match) => {
    (match.participants || []).forEach((p) => {
      const name = p.player?.nickname || p.player?.fullName;
      if (p.playerId && name) nameMap.set(p.playerId, name);
    });
  });

  (history || []).forEach((match) => {
    if (match.status !== "ended") return;
    if (match.matchType !== "doubles") return;
    const participants = match.participants || [];
    const team1Ids = participants.filter((p) => p.teamNumber === 1).map((p) => p.playerId).filter(Boolean);
    const team2Ids = participants.filter((p) => p.teamNumber === 2).map((p) => p.playerId).filter(Boolean);
    if (team1Ids.length < 2 || team2Ids.length < 2) return;

    const team1 = getTeamEntry(stats, team1Ids, nameMap);
    const team2 = getTeamEntry(stats, team2Ids, nameMap);

    team1.gamesPlayed += 1;
    team2.gamesPlayed += 1;

    if (match.winnerTeam === 1) {
      team1.wins += 1;
      team2.losses += 1;
    } else if (match.winnerTeam === 2) {
      team2.wins += 1;
      team1.losses += 1;
    }
  });

  const rows = [...stats.values()].map((team) => ({
    ...team,
    winPct: team.gamesPlayed ? team.wins / team.gamesPlayed : 0
  }));

  rows.sort((a, b) => {
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    return a.name.localeCompare(b.name);
  });

  return rows.map((team, idx) => ({ ...team, rank: idx + 1 }));
}

function buildRoundRobinStandings(rounds, entrantList) {
  const map = new Map();
  const nameMap = new Map();
  (entrantList || []).forEach((entrant) => {
    if (!entrant) return;
    if (typeof entrant === "string") {
      nameMap.set(entrant, entrant);
      map.set(entrant, initStanding(entrant, entrant));
      return;
    }
    const id = entrant.id;
    if (!id) return;
    const name = entrant.name || "Team";
    nameMap.set(id, name);
    map.set(id, initStanding(id, name));
  });

  rounds.forEach((round) => {
    round.matchs.forEach((match) => {
      const team1 = match.team1;
      const team2 = match.team2;
      if (!team1?.id || !team2?.id) return;
      if (!map.has(team1.id)) {
        map.set(team1.id, initStanding(team1.id, team1.name || nameMap.get(team1.id) || "Team"));
      }
      if (!map.has(team2.id)) {
        map.set(team2.id, initStanding(team2.id, team2.name || nameMap.get(team2.id) || "Team"));
      }
      const score1 = roundRobinScore(match, 1);
      const score2 = roundRobinScore(match, 2);
      const hasScore = score1 != null || score2 != null;
      const hasWinner = Boolean(match.winner);
      if (!hasScore && !hasWinner) return;

      const team1Stats = map.get(team1.id);
      const team2Stats = map.get(team2.id);
      team1Stats.gamesPlayed += 1;
      team2Stats.gamesPlayed += 1;

      if (score1 != null && score2 != null) {
        team1Stats.pointsFor += score1;
        team1Stats.pointsAgainst += score2;
        team2Stats.pointsFor += score2;
        team2Stats.pointsAgainst += score1;
      }

      if (match.winner === team1.id) {
        team1Stats.wins += 1;
        team2Stats.losses += 1;
        return;
      }
      if (match.winner === team2.id) {
        team2Stats.wins += 1;
        team1Stats.losses += 1;
        return;
      }
      if (score1 != null && score2 != null) {
        if (score1 > score2) {
          team1Stats.wins += 1;
          team2Stats.losses += 1;
        } else if (score2 > score1) {
          team2Stats.wins += 1;
          team1Stats.losses += 1;
        }
      }
    });
  });

  const rows = [...map.values()].map((team) => ({
    ...team,
    winPct: team.gamesPlayed ? team.wins / team.gamesPlayed : 0
  }));

  rows.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    return a.name.localeCompare(b.name);
  });

  return rows.map((team, idx) => ({ ...team, rank: idx + 1 }));
}

function initStanding(id, name) {
  return {
    id,
    name,
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    winPct: 0,
    rank: 0
  };
}

function getTeamEntry(stats, memberIds, nameMap) {
  const key = teamKey(memberIds);
  if (stats.has(key)) return stats.get(key);
  const names = memberIds
    .map((id) => nameMap.get(id) || "Player")
    .sort((a, b) => a.localeCompare(b));
  const entry = {
    id: key,
    name: names.join(" + "),
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winPct: 0,
    rank: 0
  };
  stats.set(key, entry);
  return entry;
}

function setPageTitle(name) {
  const title = name ? `Live Queue • ${name}` : "Live Queue";
  document.title = title;
  const og = document.querySelector('meta[property="og:title"]');
  if (og) og.setAttribute("content", title);
  const twitter = document.querySelector('meta[name="twitter:title"]');
  if (twitter) twitter.setAttribute("content", title);
}

async function load({ silent = false } = {}) {
  const reqOptions = silent ? { showLoading: false } : undefined;
  try {
    const result = await api.publicQueue(route.params.token, reqOptions);
    data.value = result;
    setPageTitle(result?.session?.name);
    const defaultType = result?.session?.defaultBracketType;
    if (defaultType) {
      bracketType.value = defaultType;
    }
  } catch {
    // Keep the last good data on a failed background refresh; only clear on the
    // initial (non-silent) load so a transient blip doesn't blank the screen.
    if (!silent) {
      data.value = {};
      setPageTitle("");
    }
  }

  try {
    const rankingData = await api.publicQueueRankings(route.params.token, reqOptions);
    rankedPlayers.value = rankingData.players || [];
    totalPlayers.value = rankingData.totalPlayers || 0;
  } catch {
    if (!silent) {
      rankedPlayers.value = [];
      totalPlayers.value = 0;
    }
  }
}

async function manualRefresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await load();
  } finally {
    refreshing.value = false;
  }
}

function openRankings() {
  showRankingsModal.value = true;
  if (showPairToggle.value) {
    loadPairRankMatches();
  }
  if (showTeamToggle.value) {
    loadTeamStats();
  }
}

function closeRankings() {
  showRankingsModal.value = false;
}

async function loadPairRankMatches() {
  if (!showPairToggle.value) return;
  pairRankLoading.value = true;
  try {
    const result = await api.publicQueueBracket(route.params.token);
    pairRankMatches.value = result.matches || [];
  } catch {
    pairRankMatches.value = [];
  } finally {
    pairRankLoading.value = false;
  }
}

async function loadTeamStats() {
  if (!showTeamToggle.value) return;
  teamRankLoading.value = true;
  try {
    const result = await api.publicQueueTeamStats(route.params.token);
    teamStats.value = result.teams || [];
  } catch {
    teamStats.value = [];
  } finally {
    teamRankLoading.value = false;
  }
}

async function openBracket() {
  showBracketModal.value = true;
  bracketLoading.value = true;
  bracketError.value = "";
  try {
    const result = await api.publicQueueBracket(route.params.token);
    bracketSession.value = result.session || null;
    bracketPlayers.value = result.players || [];
    bracketMatches.value = result.matches || [];
    bracketOverrides.value = result.overrides || [];
    const defaultType = result.session?.defaultBracketType || data.value?.session?.defaultBracketType;
    if (defaultType) {
      bracketType.value = defaultType;
    }
  } catch (err) {
    bracketSession.value = null;
    bracketPlayers.value = [];
    bracketMatches.value = [];
    bracketOverrides.value = [];
    bracketError.value = err.message || "Unable to load bracket";
  } finally {
    bracketLoading.value = false;
  }
}

function closeBracket() {
  showBracketModal.value = false;
}

function buildSingleElimination(players) {
  const size = nextPow2(players.length);
  const padded = [...players];
  while (padded.length < size) padded.push("BYE");

  const rounds = [];
  let roundIndex = 1;
  let matchIndex = 1;

  let currentMatches = [];
  for (let i = 0; i < padded.length; i += 2) {
    const matchId = `r${roundIndex}m${matchIndex++}`;
    currentMatches.push(createMatch(matchId, padded[i], padded[i + 1]));
  }
  rounds.push({ name: `Round ${roundIndex}`, matchs: currentMatches });

  let matchCount = currentMatches.length;
  while (matchCount > 1) {
    roundIndex += 1;
    const nextMatches = [];
    const nextCount = Math.ceil(matchCount / 2);
    for (let i = 0; i < nextCount; i += 1) {
      const matchId = `r${roundIndex}m${matchIndex++}`;
      nextMatches.push(
        createMatch(matchId, `Winner of Match ${i * 2 + 1}`, `Winner of Match ${i * 2 + 2}`)
      );
    }
    rounds.push({ name: `Round ${roundIndex}`, matchs: nextMatches });
    matchCount = nextMatches.length;
  }

  return rounds;
}

function buildDoubleElimination(players) {
  const winners = buildSingleElimination(players);
  const losers = [];
  let loserRoundIndex = 1;
  let loserMatchId = 1;

  for (let wRound = 1; wRound < winners.length; wRound += 1) {
    const winnersMatches = winners[wRound - 1].matchs.length;
    const losersMatchCount = Math.max(1, Math.floor(winnersMatches / 2));

    const l1Matches = [];
    for (let m = 1; m <= losersMatchCount; m += 1) {
      const matchId = `l${loserRoundIndex}m${loserMatchId++}`;
      l1Matches.push(
        createMatch(matchId, `Loser of W${wRound} M${m * 2 - 1}`, `Loser of W${wRound} M${m * 2}`)
      );
    }
    losers.push({ name: `Losers R${loserRoundIndex}`, matchs: l1Matches });
    loserRoundIndex += 1;

    const l2Matches = [];
    for (let m = 1; m <= losersMatchCount; m += 1) {
      const matchId = `l${loserRoundIndex}m${loserMatchId++}`;
      l2Matches.push(
        createMatch(matchId, `Winner of L${loserRoundIndex - 1} M${m}`, `Loser of W${wRound + 1} M${m}`)
      );
    }
    losers.push({ name: `Losers R${loserRoundIndex}`, matchs: l2Matches });
    loserRoundIndex += 1;
  }

  return {
    type: "double",
    winners,
    losers,
    finals: losers.length
      ? [
          {
            name: "Grand Final",
            matchs: [
              createMatch(
                "grand-final",
                `Winner of W${winners.length} M1`,
                `Winner of L${loserRoundIndex - 1} M1`
              )
            ]
          }
        ]
      : []
  };
}

function buildRoundRobin(players) {
  const list = [...players];
  const isOdd = list.length % 2 === 1;
  if (isOdd) list.push("BYE");
  const rounds = [];
  const totalRounds = list.length - 1;
  const half = list.length / 2;

  const rotation = [...list];
  for (let round = 0; round < totalRounds; round += 1) {
    const matches = [];
    for (let i = 0; i < half; i += 1) {
      const a = rotation[i];
      const b = rotation[rotation.length - 1 - i];
      if (a !== "BYE" && b !== "BYE") {
        matches.push(createMatch(`rr${round + 1}m${i + 1}`, a, b));
      }
    }
    rounds.push({ name: `Round ${round + 1}`, matchs: matches });

    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop());
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  return rounds;
}

function createMatch(id, teamA, teamB) {
  return {
    id,
    team1: createTeam(teamA, `${id}-a`),
    team2: createTeam(teamB, `${id}-b`)
  };
}

function createTeam(team, fallbackId) {
  if (!team) return undefined;
  if (typeof team === "string") {
    return {
      id: fallbackId,
      name: team,
      disabled: team === "BYE"
    };
  }
  return {
    id: team.id,
    name: team.name,
    disabled: team.disabled || false
  };
}

function buildTeamEntrants(players, customTeams) {
  const teams = [];
  const normalizedCustom = customTeams.map((team) => ({
    ...team,
    source: team.source || "manual"
  }));
  const assigned = new Set(normalizedCustom.flatMap((team) => team.memberIds || []));
  if (normalizedCustom.length) {
    teams.push(...normalizedCustom);
  }
  const remaining = players.filter((player) => !assigned.has(player.id));
  for (let i = 0; i < remaining.length; i += 2) {
    const first = remaining[i];
    const second = remaining[i + 1];
    if (!first) break;
    if (second) {
      const memberIds = [first.id, second.id];
      teams.push(buildTeam(memberIds, `${first.name} + ${second.name}`, { source: "auto" }));
    } else {
      const memberIds = [first.id];
      teams.push(
        buildTeam(memberIds, `${first.name} + BYE`, {
          disabled: true,
          source: "auto",
          teamKeyOverride: teamKey([first.id, `bye-${first.id}`])
        })
      );
    }
  }
  return teams;
}

function buildTeam(memberIds, name, options = {}) {
  return {
    id: options.teamKeyOverride || teamKey(memberIds),
    name,
    memberIds,
    disabled: Boolean(options.disabled),
    source: options.source
  };
}

function nextPow2(value) {
  let size = 1;
  while (size < value) size *= 2;
  return size;
}

function applyMatchResults(rounds, propagateWinners = false) {
  const results = bracketMatchResults.value;
  const validKeys = bracketEntrantKeys.value;
  const overrides = bracketOverrideMap.value;
  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
    const round = rounds[roundIndex];
    round.matchs.forEach((match) => {
      if (results && results.size && validKeys.size) {
        applyResultToMatch(match, results, validKeys);
      }
      applyManualOverride(match, overrides);
    });
    if (!propagateWinners || roundIndex === rounds.length - 1) continue;
    const nextRound = rounds[roundIndex + 1];
    if (!nextRound?.matchs?.length) continue;
    for (let i = 0; i < nextRound.matchs.length; i += 1) {
      const sourceA = round.matchs[i * 2];
      const sourceB = round.matchs[i * 2 + 1];
      const winnerA = winnerTeam(sourceA);
      const winnerB = winnerTeam(sourceB);
      if (winnerA) nextRound.matchs[i].team1 = { ...winnerA, score: undefined };
      if (winnerB) nextRound.matchs[i].team2 = { ...winnerB, score: undefined };
    }
  }
  return rounds;
}

function roundRobinScore(match, side) {
  if (side !== 1 && side !== 2) return null;
  if (match?.team1?.score != null || match?.team2?.score != null) {
    return side === 1 ? match?.team1?.score ?? null : match?.team2?.score ?? null;
  }
  const teamAKey = resolveMatchKey(match?.team1, bracketEntrantKeys.value);
  const teamBKey = resolveMatchKey(match?.team2, bracketEntrantKeys.value);
  if (!teamAKey || !teamBKey) return null;
  const result = bracketMatchResults.value.get(`${teamAKey}|${teamBKey}`);
  if (!result?.score) return null;
  return side === 1 ? result.score.team1 ?? null : result.score.team2 ?? null;
}

function applyResultToMatch(match, results, validKeys) {
  const team1Key = teamKeyFromMatch(match?.team1, validKeys);
  const team2Key = teamKeyFromMatch(match?.team2, validKeys);
  if (!team1Key || !team2Key) return;
  const result = results.get(`${team1Key}|${team2Key}`);
  if (!result) return;
  if (result.score) {
    if (result.score.team1 != null) match.team1.score = result.score.team1;
    if (result.score.team2 != null) match.team2.score = result.score.team2;
  }
  if (result.winnerTeam === 1) {
    match.winner = match.team1.id;
  } else if (result.winnerTeam === 2) {
    match.winner = match.team2.id;
  }
}

function applyManualOverride(match, overrides) {
  if (!match?.id) return;
  const override = overrides[match.id];
  if (!override) return;
  if (override.score) {
    if (override.score.team1 != null && match.team1) match.team1.score = override.score.team1;
    if (override.score.team2 != null && match.team2) match.team2.score = override.score.team2;
  }
  if ("winnerId" in override) {
    match.winner = override.winnerId || undefined;
  }
}

function winnerTeam(match) {
  if (!match?.winner) return null;
  if (match.team1?.id === match.winner) return match.team1;
  if (match.team2?.id === match.winner) return match.team2;
  return null;
}

function teamKeyFromMatch(team, validKeys) {
  if (!team?.id || !validKeys.has(team.id)) return null;
  return team.id;
}

function resolveMatchKey(team, validKeys) {
  if (!team?.id) return null;
  if (!validKeys || !validKeys.size) return team.id;
  if (validKeys.has(team.id)) return team.id;
  if (Array.isArray(team.memberIds) && team.memberIds.length) {
    return team.memberIds.slice().sort().join("+");
  }
  return team.id;
}

function buildMatchResults(history) {
  const results = new Map();
  (history || []).forEach((match) => {
    if (match.status !== "ended") return;
    const team1Ids = match.participants
      .filter((p) => p.teamNumber === 1)
      .map((p) => p.playerId || p.player?.id)
      .filter(Boolean);
    const team2Ids = match.participants
      .filter((p) => p.teamNumber === 2)
      .map((p) => p.playerId || p.player?.id)
      .filter(Boolean);
    if (!team1Ids.length || !team2Ids.length) return;
    const key1 = teamKey(team1Ids);
    const key2 = teamKey(team2Ids);
    const score = extractScore(match.scoreJson);
    const winnerTeam = match.winnerTeam ?? null;
    results.set(`${key1}|${key2}`, { score, winnerTeam });
    results.set(`${key2}|${key1}`, {
      score: score ? { team1: score.team2, team2: score.team1 } : null,
      winnerTeam: winnerTeam === 1 ? 2 : winnerTeam === 2 ? 1 : null
    });
  });
  return results;
}

function teamKey(ids) {
  return ids.slice().sort().join("+");
}

watch(rankMode, (next) => {
  if (next === "pairs" && showPairToggle.value) {
    loadPairRankMatches();
  }
  if (next === "teams" && showTeamToggle.value) {
    loadTeamStats();
  }
});

watch(
  () => data.value?.session?.gameType,
  (gameType) => {
    if (gameType !== "doubles" && rankMode.value === "pairs") {
      rankMode.value = "players";
    }
  }
);

watch(
  () => data.value?.session?.mode,
  (mode) => {
    if (mode !== "tournament" && rankMode.value === "teams") {
      rankMode.value = "players";
    }
  }
);

function extractScore(scoreJson) {
  if (!scoreJson) return null;
  if (Array.isArray(scoreJson)) {
    if (scoreJson.length === 2 && scoreJson.every((v) => typeof v === "number")) {
      return { team1: scoreJson[0], team2: scoreJson[1] };
    }
    if (scoreJson.every((v) => Array.isArray(v) && v.length >= 2)) {
      const totals = scoreJson.reduce(
        (acc, set) => {
          const [a, b] = set;
          return {
            team1: acc.team1 + (Number(a) || 0),
            team2: acc.team2 + (Number(b) || 0)
          };
        },
        { team1: 0, team2: 0 }
      );
      return totals;
    }
  }
  if (typeof scoreJson === "object") {
    const value = (key) => {
      const raw = scoreJson?.[key];
      const num = Number(raw);
      return Number.isFinite(num) ? num : undefined;
    };
    const team1 =
      value("team1") ??
      value("teamA") ??
      value("score1") ??
      value("home") ??
      value("a");
    const team2 =
      value("team2") ??
      value("teamB") ??
      value("score2") ??
      value("away") ??
      value("b");
    if (team1 != null || team2 != null) {
      return { team1, team2 };
    }
    if (Array.isArray(scoreJson.scores) && scoreJson.scores.length >= 2) {
      const [a, b] = scoreJson.scores;
      const team1Score = Number(a);
      const team2Score = Number(b);
      if (Number.isFinite(team1Score) || Number.isFinite(team2Score)) {
        return {
          team1: Number.isFinite(team1Score) ? team1Score : undefined,
          team2: Number.isFinite(team2Score) ? team2Score : undefined
        };
      }
      return null;
    }
    if (Array.isArray(scoreJson.sets) && scoreJson.sets.length) {
      const totals = scoreJson.sets.reduce(
        (acc, set) => {
          const a = Number(set?.team1 ?? set?.teamA ?? set?.score1 ?? set?.a ?? 0);
          const b = Number(set?.team2 ?? set?.teamB ?? set?.score2 ?? set?.b ?? 0);
          return {
            team1: acc.team1 + (Number.isFinite(a) ? a : 0),
            team2: acc.team2 + (Number.isFinite(b) ? b : 0)
          };
        },
        { team1: 0, team2: 0 }
      );
      return totals;
    }
  }
  return null;
}

function onTouchStart(e) {
  if (window.scrollY === 0) {
    startY.value = e.touches[0].clientY;
  }
}

function onTouchMove(e) {
  if (window.scrollY !== 0) return;
  const delta = e.touches[0].clientY - startY.value;
  if (delta > 30) {
    isPulling.value = true;
  }
}

async function onTouchEnd(e) {
  const delta = e.changedTouches[0].clientY - startY.value;
  if (delta > 60 && !refreshing.value) {
    refreshing.value = true;
    await load();
    refreshing.value = false;
  }
  isPulling.value = false;
}

onMounted(() => {
  load();
  timerId = setInterval(() => {
    nowTick.value = Date.now();
  }, 1000);
  // Keep the live queue current by re-fetching courts/matches/queue periodically.
  refreshTimerId = setInterval(() => {
    if (!refreshing.value) load({ silent: true });
  }, REFRESH_INTERVAL_MS);
});

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
  if (refreshTimerId) clearInterval(refreshTimerId);
});
</script>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────────── */
.public-queue {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: #f0f4f8;
  margin-bottom: -80px; /* cancel app-shell bottom padding for mobile nav */
}

/* ── Pull indicator ──────────────────────────────────────────────── */
.pull-indicator {
  text-align: center;
  font-size: 13px;
  color: #ffffff;
  background: #1565c0;
  padding: 6px;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.2s, opacity 0.2s, padding 0.2s;
}

.pull-indicator.active {
  max-height: 40px;
  opacity: 1;
}

/* ── Hero ────────────────────────────────────────────────────────── */
.pq-hero {
  background: linear-gradient(135deg, #1a237e 0%, #1565c0 55%, #00695c 100%);
  color: #ffffff;
  padding: 0 0 20px;
  margin: 0 -16px;
}

.pq-hero-inner {
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pq-hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pq-eyebrow {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.75;
  margin-bottom: 4px;
}

.pq-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0;
  line-height: 1.2;
}

.pq-live-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.pq-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.pq-refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 999px;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.pq-refresh-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

.pq-refresh-btn:disabled {
  cursor: default;
}

.pq-refresh-btn svg {
  width: 16px;
  height: 16px;
}

.pq-refresh-btn.spinning svg {
  animation: pq-spin 0.7s linear infinite;
}

@keyframes pq-spin {
  to { transform: rotate(360deg); }
}

.pq-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #69f0ae;
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.pq-hero-actions {
  display: flex;
  gap: 8px;
}

.pq-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.12);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.pq-action-btn:hover {
  background: rgba(255,255,255,0.22);
}

.pq-action-count {
  background: rgba(255,255,255,0.25);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 12px;
  font-weight: 700;
}

.pq-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 4px;
}

.pq-stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pq-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.65;
  font-weight: 600;
}

.pq-stat-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}

.pq-stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255,255,255,0.2);
}

/* ── Sections ────────────────────────────────────────────────────── */
.pq-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 0;
  border-bottom: 1px solid #d8e2ee;
}

.pq-section:last-child {
  border-bottom: none;
}

.pq-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pq-section-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.pq-section-count {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.pq-empty {
  font-size: 14px;
  color: #94a3b8;
  padding: 8px 0;
}

/* ── Court cards ─────────────────────────────────────────────────── */
.courts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.court-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.court-card.playing {
  border-color: #0d9488;
  box-shadow: 0 0 0 2px rgba(13,148,136,0.1);
}

.court-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.court-name {
  font-size: 15px;
  color: #1e293b;
}

.court-status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
}

.court-status-badge.live {
  background: rgba(13,148,136,0.12);
  color: #0f766e;
}

.court-status-badge.warning {
  background: rgba(180,95,95,0.1);
  color: #b45f5f;
}

.court-foot {
  display: flex;
  align-items: center;
}

.court-elapsed {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 800;
  color: #0f766e;
  font-variant-numeric: tabular-nums;
}

.court-elapsed-icon {
  width: 14px;
  height: 14px;
}

/* ── Queue list ──────────────────────────────────────────────────── */
.queue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.queue-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.queue-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.queue-position {
  font-size: 13px;
  font-weight: 800;
  color: #1565c0;
  min-width: 28px;
}

.queue-type {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  flex: 1;
}

.queue-time {
  font-size: 12px;
  color: #94a3b8;
}

.queue-matchup {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.queue-team {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.queue-vs-pill {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 4px;
}

/* ── Rankings modal size fix ─────────────────────────────────────── */
:deep(.rank-modal.modal-card) {
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* ── Podium two-row layout ───────────────────────────────────────── */
:deep(.rank-podium-card) {
  gap: 6px;
}

.podium-top-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.podium-icon {
  font-size: 15px;
  flex-shrink: 0;
  line-height: 1;
}

.podium-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

/* ── Rankings modal extras ───────────────────────────────────────── */
.rank-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.rank-modal-session {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 2px;
}

.rank-modal-title {
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 2px;
}

.rank-modal-count {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.rank-tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 16px;
}

.rank-tab {
  padding: 7px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.rank-tab.active {
  color: #1565c0;
  border-bottom-color: #1565c0;
}

.rank-loading {
  font-size: 14px;
  color: #94a3b8;
  padding: 16px 0;
}

/* ── Bracket modal overrides ─────────────────────────────────────── */
:deep(.bracket-backdrop) {
  z-index: 60;
}

:deep(.bracket-modal) {
  background: linear-gradient(180deg, #f0f4f8 0%, #e8f0fb 100%);
}

:deep(.bracket-modal-head) {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
  margin-bottom: 4px;
}

.bracket-modal-head-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bracket-modal-title {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: #1e293b;
}

/* ── Bracket modal extras ────────────────────────────────────────── */
.bracket-block-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 8px;
}

.tournament-bracket-block {
  margin-bottom: 28px;
}

.round-robin-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rr-standings-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.round-robin-round {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rr-round-matches {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
