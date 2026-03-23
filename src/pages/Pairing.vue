<template>
  <div class="pairing-page">
    <!-- Page header -->
    <div class="pairing-header">
      <div>
        <h1 class="pairing-title">Pairing</h1>
        <p class="text-muted" v-if="session">{{ session.name }} · Select 2 players to create a pair.</p>
        <p class="text-muted" v-else>Open a session to manage pairings.</p>
      </div>
      <div class="pairing-header-right">
        <div v-if="session" class="pairing-chips">
          <span class="info-chip">{{ joinedPlayers.length }} players</span>
          <span class="info-chip accent2" v-if="manualTeams.length">{{ manualTeams.length }} manual</span>
        </div>
        <router-link class="button ghost button-compact" to="/tournament">← Bracket</router-link>
      </div>
    </div>

    <div v-if="error" class="notice">{{ error }}</div>

    <!-- Empty / unavailable states -->
    <div v-if="!session && !error" class="empty-state">
      No active session. Start one from the home screen.
    </div>
    <div v-else-if="session && matchFormat !== 'doubles'" class="empty-state">
      Pairing is only available for doubles sessions.
    </div>

    <!-- Builder -->
    <template v-else-if="session && matchFormat === 'doubles'">
      <!-- Toolbar -->
      <div class="pairing-toolbar">
        <div class="pairing-toolbar-left">
          <span class="selection-hint" :class="{ ready: selectedTeamPlayers.length === 2 }">
            {{ selectedTeamPlayers.length }}/2 selected
          </span>
          <button
            class="button button-compact"
            @click="requestTeamConfirm"
            :disabled="selectedTeamPlayers.length !== 2"
          >Create Pair</button>
        </div>
        <div class="pairing-toolbar-right">
          <button class="button ghost button-compact" @click="autoPairTeams">Auto Pair</button>
          <button class="button ghost button-compact" @click="clearTeams">Reset</button>
        </div>
      </div>

      <!-- Two-panel layout -->
      <div class="pairing-panels">
        <!-- Players panel -->
        <div class="pairing-panel">
          <div class="panel-label">Players</div>
          <div v-if="joinedPlayers.length === 0" class="panel-empty">No players in session.</div>
          <div v-else class="player-grid">
            <button
              v-for="player in joinedPlayers"
              :key="player.id"
              class="player-chip"
              :class="{
                selected: selectedTeamPlayers.includes(player.id),
                assigned: assignedPlayerIds.has(player.id)
              }"
              :disabled="assignedPlayerIds.has(player.id)"
              @click="togglePlayerSelection(player.id)"
            >
              {{ player.name }}
            </button>
          </div>
        </div>

        <!-- Pairs panel -->
        <div class="pairing-panel">
          <div class="panel-label">Pairs</div>
          <div v-if="teamPreview.length === 0" class="panel-empty">No pairs yet.</div>
          <div v-else class="pairs-list">
            <div
              v-for="(team, idx) in teamPreview"
              :key="team.id"
              class="pair-row"
              :class="{ 'is-auto': team.source === 'auto' }"
            >
              <span class="pair-name">{{ team.name }}</span>
              <span v-if="team.source === 'auto'" class="pair-badge">Auto</span>
              <button
                v-if="team.source === 'manual'"
                class="icon-button danger pair-remove"
                @click="removeTeam(idx)"
                aria-label="Remove pair"
              >
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M6 7h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7zm3-3h6l1 2H8l1-2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Confirm modal -->
  <div v-if="showTeamConfirm" class="modal-backdrop">
    <div class="modal-card">
      <h3>Create Pair</h3>
      <div class="subtitle">Confirm this pairing?</div>
      <div class="team-confirm">
        <strong>{{ selectedTeamNames[0] || "Player 1" }}</strong>
        <span class="team-confirm-plus">+</span>
        <strong>{{ selectedTeamNames[1] || "Player 2" }}</strong>
      </div>
      <div class="grid two">
        <button class="button ghost" @click="closeTeamConfirm">Cancel</button>
        <button class="button" @click="confirmTeamCreate">Create</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { api } from "../api.js";
import { loadManualTeams, saveManualTeams } from "../utils/teamBuilder.js";
import { selectedSessionId, setSelectedSessionId } from "../state/sessionStore.js";

const session = ref(null);
const sessionPlayers = ref([]);
const manualTeams = ref([]);
const selectedTeamPlayers = ref([]);
const showTeamConfirm = ref(false);
const lastTeamConfirmSignature = ref("");
const error = ref("");

const matchFormat = computed(() => session.value?.gameType || "doubles");

const joinedPlayers = computed(() => {
  return sessionPlayers.value
    .filter((sp) => sp.status !== "done")
    .sort((a, b) => new Date(a.checkedInAt) - new Date(b.checkedInAt))
    .map((sp) => ({
      id: sp.player.id,
      name: sp.player.nickname || sp.player.fullName
    }));
});

const assignedPlayerIds = computed(() => {
  const ids = manualTeams.value.flatMap((team) => team.memberIds || []);
  return new Set(ids);
});

const entrants = computed(() => buildTeamEntrants(joinedPlayers.value, manualTeams.value));
const teamPreview = computed(() => entrants.value);

const selectedTeamNames = computed(() => {
  return selectedTeamPlayers.value
    .map((id) => joinedPlayers.value.find((player) => player.id === id))
    .filter(Boolean)
    .map((player) => player.name);
});

async function load() {
  error.value = "";
  try {
    let currentSession = null;
    if (selectedSessionId.value) {
      currentSession = await api.session(selectedSessionId.value);
    } else {
      currentSession = await api.activeSession();
      if (currentSession?.id) setSelectedSessionId(currentSession.id);
    }
    session.value = currentSession;
    if (!currentSession) {
      sessionPlayers.value = [];
      manualTeams.value = [];
      return;
    }
    sessionPlayers.value = await api.sessionPlayers(currentSession.id);
    manualTeams.value = loadManualTeams(currentSession.id);
  } catch (err) {
    error.value = err.message || "Unable to load session";
    session.value = null;
    sessionPlayers.value = [];
    manualTeams.value = [];
  }
}

function togglePlayerSelection(playerId) {
  if (assignedPlayerIds.value.has(playerId)) return;
  if (selectedTeamPlayers.value.includes(playerId)) {
    selectedTeamPlayers.value = selectedTeamPlayers.value.filter((id) => id !== playerId);
    return;
  }
  if (selectedTeamPlayers.value.length >= 2) return;
  selectedTeamPlayers.value = [...selectedTeamPlayers.value, playerId];
}

function createManualTeam() {
  if (selectedTeamPlayers.value.length !== 2) return;
  const selected = selectedTeamPlayers.value
    .map((id) => joinedPlayers.value.find((player) => player.id === id))
    .filter(Boolean);
  if (selected.length !== 2) return;
  const memberIds = selected.map((player) => player.id);
  const name = `${selected[0].name} + ${selected[1].name}`;
  manualTeams.value = [
    ...manualTeams.value,
    buildTeam(memberIds, name, { source: "manual" })
  ];
  selectedTeamPlayers.value = [];
  persistManualTeams();
}

function requestTeamConfirm() {
  if (matchFormat.value !== "doubles") return;
  if (selectedTeamPlayers.value.length !== 2) return;
  showTeamConfirm.value = true;
}

function closeTeamConfirm() {
  showTeamConfirm.value = false;
  lastTeamConfirmSignature.value = selectedTeamPlayers.value.join("|");
}

function confirmTeamCreate() {
  createManualTeam();
  showTeamConfirm.value = false;
  lastTeamConfirmSignature.value = "";
}

function removeTeam(index) {
  const teamToRemove = teamPreview.value[index];
  if (!teamToRemove || teamToRemove.source !== "manual") return;
  manualTeams.value = manualTeams.value.filter((team) => team.id !== teamToRemove.id);
  persistManualTeams();
}

function clearTeams() {
  manualTeams.value = [];
  selectedTeamPlayers.value = [];
  persistManualTeams();
}

function autoPairTeams() {
  manualTeams.value = buildTeamEntrants(joinedPlayers.value, []).map((team) => ({
    ...team,
    source: "manual"
  }));
  selectedTeamPlayers.value = [];
  persistManualTeams();
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

function teamKey(ids) {
  return ids.slice().sort().join("+");
}

function persistManualTeams() {
  if (!session.value?.id) return;
  saveManualTeams(session.value.id, manualTeams.value);
}

watch(
  () => selectedTeamPlayers.value.join("|"),
  (signature) => {
    if (matchFormat.value !== "doubles") return;
    if (selectedTeamPlayers.value.length !== 2) return;
    if (showTeamConfirm.value) return;
    if (signature && signature !== lastTeamConfirmSignature.value) {
      showTeamConfirm.value = true;
    }
  }
);

watch(joinedPlayers, (players) => {
  const valid = new Set(players.map((player) => player.id));
  manualTeams.value = manualTeams.value.filter((team) =>
    (team.memberIds || []).every((id) => valid.has(id))
  );
  selectedTeamPlayers.value = selectedTeamPlayers.value.filter((id) => valid.has(id));
});

watch(
  () => manualTeams.value,
  (teams) => {
    if (!session.value?.id) return;
    saveManualTeams(session.value.id, teams);
  },
  { deep: true }
);

onMounted(load);

watch(selectedSessionId, load);
</script>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────────── */
.pairing-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ──────────────────────────────────────────────────────── */
.pairing-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pairing-title {
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

.pairing-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.pairing-chips {
  display: flex;
  gap: 8px;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(21, 101, 192, 0.08);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.info-chip.accent2 {
  background: rgba(0, 137, 123, 0.1);
  color: #00897b;
}

/* ── Empty state ─────────────────────────────────────────────────── */
.empty-state {
  font-size: 15px;
  color: var(--ink-soft);
  padding: 24px 0;
}

/* ── Toolbar ─────────────────────────────────────────────────────── */
.pairing-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.pairing-toolbar-left,
.pairing-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.selection-hint {
  font-size: 13px;
  color: var(--ink-soft);
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--border);
  transition: background 0.2s, color 0.2s;
}

.selection-hint.ready {
  background: rgba(0, 137, 123, 0.12);
  color: #00897b;
}

/* ── Two-panel layout ────────────────────────────────────────────── */
.pairing-panels {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 600px) {
  .pairing-panels {
    grid-template-columns: 1fr 1fr;
  }
}

.pairing-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
}

.panel-empty {
  font-size: 14px;
  color: var(--ink-soft);
}

/* ── Player chips ────────────────────────────────────────────────── */
.player-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.player-chip {
  padding: 8px 16px;
  border-radius: 999px;
  border: 2px solid var(--border);
  background: #ffffff;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.player-chip:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.player-chip.selected {
  border-color: #00897b;
  background: rgba(0, 137, 123, 0.08);
  color: #00897b;
}

.player-chip.assigned {
  opacity: 0.4;
  cursor: default;
}

/* ── Pairs list ──────────────────────────────────────────────────── */
.pairs-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.pair-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #ffffff;
  border-bottom: 1px solid var(--border);
}

.pair-row:last-child {
  border-bottom: none;
}

.pair-row.is-auto {
  background: #f8fffe;
}

.pair-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  min-width: 0;
}

.pair-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 137, 123, 0.1);
  color: #00897b;
  flex-shrink: 0;
}

.pair-remove {
  flex-shrink: 0;
}
</style>
