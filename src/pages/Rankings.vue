<template>
  <div class="rankings-page">
    <!-- Page header -->
    <div class="rankings-header">
      <div>
        <h1 class="rankings-title">Rankings</h1>
        <p v-if="session" class="text-muted">{{ rankScopeLabel }} · {{ totalCount }} {{ summaryLabel }}</p>
        <p v-else class="text-muted">Open a session to see live rankings.</p>
      </div>
      <div v-if="session && isTeamView && champion" class="champion-badge">
        🏆 {{ champion.name }}
      </div>
    </div>

    <!-- Mode toggle -->
    <div v-if="showRankToggle" class="rank-tab-bar">
      <button
        class="rank-tab"
        :class="{ active: rankMode === 'players' }"
        type="button"
        @click="rankMode = 'players'"
      >Players</button>
      <button
        v-if="showPairToggle"
        class="rank-tab"
        :class="{ active: rankMode === 'pairs' }"
        type="button"
        @click="rankMode = 'pairs'"
      >Pairs</button>
      <button
        v-if="showTeamToggle"
        class="rank-tab"
        :class="{ active: rankMode === 'teams' }"
        type="button"
        @click="rankMode = 'teams'"
      >Teams</button>
    </div>

    <!-- Empty state -->
    <div v-if="!session" class="empty-state">
      No active session. Start one from the home screen.
    </div>
    <div v-else-if="rankedRows.length === 0" class="empty-state">
      No stats yet. Play some matches to see rankings.
    </div>

    <!-- Rankings content -->
    <template v-else>
      <!-- Podium (top 3) -->
      <div class="rank-podium">
        <div
          v-for="(row, idx) in podiumRows"
          :key="row.id"
          class="rank-podium-card"
          :class="`podium-${rankClass(row.rank)}`"
          :style="{ animationDelay: `${idx * 80}ms` }"
        >
          <div class="rank-corner-icon">{{ rankCornerIcon(row.rank) }}</div>
          <div class="rank-medal">
            <span class="rank-number">{{ row.rank }}</span>
          </div>
          <div class="rank-name">{{ row.name }}</div>
          <div class="rank-mini-stats">
            <span>GP {{ row.gamesPlayed }}</span>
            <span>W {{ row.wins }}</span>
            <span>L {{ row.losses }}</span>
            <span v-if="isTeamView">Pts {{ row.points }}</span>
            <span v-else>{{ winPct(row.winPct) }}</span>
          </div>
        </div>
      </div>

      <!-- Rest of the list -->
      <div v-if="restRows.length" class="rank-list">
        <div
          v-for="(row, idx) in restRows"
          :key="row.id"
          class="rank-row"
          :style="{ animationDelay: `${(idx + 3) * 40}ms` }"
        >
          <div class="rank-row-left">
            <div class="rank-row-badge" :class="rankClass(row.rank)">
              <span class="rank-number">{{ row.rank }}</span>
            </div>
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
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { api } from "../api.js";
import { selectedSessionId, setSelectedSessionId } from "../state/sessionStore.js";

const session = ref(null);
const rankedPlayers = ref([]);
const totalPlayers = ref(0);
const rankedTeams = ref([]);
const rankedPairs = ref([]);
const champion = ref(null);
const rankMode = ref("players");
const isTournamentMode = computed(() => session.value?.mode === "tournament");
const isTeamView = computed(() => rankMode.value === "teams" && isTournamentMode.value);
const isPairView = computed(() => rankMode.value === "pairs");
const rankedRows = computed(() => {
  if (isTeamView.value) return rankedTeams.value;
  if (isPairView.value) return rankedPairs.value;
  return buildPlayerRows(rankedPlayers.value);
});
const podiumRows = computed(() => rankedRows.value.slice(0, 3));
const restRows = computed(() => rankedRows.value.slice(3));
const totalCount = computed(() => {
  if (isTeamView.value) return rankedTeams.value.length;
  if (isPairView.value) return rankedPairs.value.length;
  return totalPlayers.value;
});
const summaryLabel = computed(() => {
  if (isTeamView.value) return "teams";
  if (isPairView.value) return "pairs";
  return "players";
});
const rankScopeLabel = computed(() => (isTeamView.value ? "All sessions" : session.value?.name || "Session"));
const showPairToggle = computed(() => session.value?.gameType === "doubles");
const showTeamToggle = computed(() => isTournamentMode.value);
const showRankToggle = computed(() => {
  const options = [true, showPairToggle.value, showTeamToggle.value].filter(Boolean);
  return options.length > 1;
});

async function load() {
  try {
    let currentSession = null;
    if (selectedSessionId.value) {
      currentSession = await api.session(selectedSessionId.value);
    } else {
      currentSession = await api.activeSession();
      if (currentSession?.id) setSelectedSessionId(currentSession.id);
    }
    if (!currentSession) {
      session.value = null;
      rankedPlayers.value = [];
      totalPlayers.value = 0;
      rankedTeams.value = [];
      champion.value = null;
      return;
    }
    session.value = currentSession;
    const [rankResult, teamResult, pairsResult] = await Promise.allSettled([
      api.rankings(session.value.id),
      currentSession.mode === "tournament" ? api.teamStats(session.value.id, { scope: "all" }) : null,
      currentSession.gameType === "doubles" ? api.matchHistory(session.value.id) : null
    ]);
    if (rankResult.status === "fulfilled") {
      rankedPlayers.value = rankResult.value.players || [];
      totalPlayers.value = rankResult.value.totalPlayers || 0;
    } else {
      rankedPlayers.value = [];
      totalPlayers.value = 0;
    }
    if (currentSession.mode === "tournament" && teamResult?.status === "fulfilled") {
      rankedTeams.value = teamResult.value.teams || [];
      champion.value = teamResult.value.champion || null;
    } else {
      rankedTeams.value = [];
      champion.value = null;
    }
    if (currentSession.gameType === "doubles" && pairsResult?.status === "fulfilled") {
      rankedPairs.value = buildPairRows(pairsResult.value || []);
    } else {
      rankedPairs.value = [];
    }
  } catch {
    session.value = null;
    rankedPlayers.value = [];
    totalPlayers.value = 0;
    rankedTeams.value = [];
    rankedPairs.value = [];
    champion.value = null;
  }
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

function buildPairRows(matches) {
  const stats = new Map();
  const ensurePair = (pairKey, pairName) => {
    if (stats.has(pairKey)) return stats.get(pairKey);
    const entry = {
      id: pairKey,
      name: pairName,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winPct: 0,
      rank: 0
    };
    stats.set(pairKey, entry);
    return entry;
  };
  const normalizePair = (players) => {
    const ids = players.map((player) => player.id).sort();
    const name = players
      .slice()
      .sort((a, b) => {
        const nameA = (a.nickname || a.fullName || "").toLowerCase();
        const nameB = (b.nickname || b.fullName || "").toLowerCase();
        return nameA.localeCompare(nameB);
      })
      .map((player) => player.nickname || player.fullName || "Player")
      .join(" + ");
    return { key: ids.join("+"), name };
  };

  (matches || [])
    .filter((match) => match.status === "ended" && match.matchType === "doubles")
    .forEach((match) => {
      if (match.winnerTeam !== 1 && match.winnerTeam !== 2) return;
      const participants = match.participants || [];
      const team1Players = participants.filter((p) => p.teamNumber === 1).map((p) => p.player).filter(Boolean);
      const team2Players = participants.filter((p) => p.teamNumber === 2).map((p) => p.player).filter(Boolean);
      if (team1Players.length !== 2 || team2Players.length !== 2) return;

      const pair1 = normalizePair(team1Players);
      const pair2 = normalizePair(team2Players);
      const entry1 = ensurePair(pair1.key, pair1.name);
      const entry2 = ensurePair(pair2.key, pair2.name);

      entry1.gamesPlayed += 1;
      entry2.gamesPlayed += 1;
      if (match.winnerTeam === 1) {
        entry1.wins += 1;
        entry2.losses += 1;
      } else if (match.winnerTeam === 2) {
        entry2.wins += 1;
        entry1.losses += 1;
      }
    });

  const rows = [...stats.values()].map((pair) => ({
    ...pair,
    winPct: pair.gamesPlayed ? pair.wins / pair.gamesPlayed : 0
  }));

  rows.sort((a, b) => {
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    return a.name.localeCompare(b.name);
  });

  return rows.map((pair, idx) => ({ ...pair, rank: idx + 1 }));
}

watch(session, (next) => {
  if (next?.mode !== "tournament") {
    if (rankMode.value === "teams") {
      rankMode.value = "players";
    }
    if (next?.gameType !== "doubles" && rankMode.value === "pairs") {
      rankMode.value = "players";
    }
    return;
  }
  if (rankMode.value === "pairs" && next?.gameType !== "doubles") {
    rankMode.value = "teams";
    return;
  }
  if (rankMode.value !== "teams") rankMode.value = "teams";
});

onMounted(load);

watch(selectedSessionId, load);
</script>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────────── */
.rankings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ──────────────────────────────────────────────────────── */
.rankings-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.rankings-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 4px;
  color: var(--ink);
}

.text-muted {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 0;
}

.champion-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1565c0, #00897b);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Mode tabs ───────────────────────────────────────────────────── */
.rank-tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid var(--border);
  padding-bottom: 0;
}

.rank-tab {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-soft);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.rank-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.rank-tab:hover:not(.active) {
  color: var(--ink);
}

/* ── Empty state ─────────────────────────────────────────────────── */
.empty-state {
  font-size: 15px;
  color: var(--ink-soft);
  padding: 24px 0;
}
</style>
