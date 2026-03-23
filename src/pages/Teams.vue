<template>
  <div class="teams-page">
    <!-- Page header -->
    <div class="teams-header">
      <div>
        <h1 class="teams-title">Teams</h1>
        <p class="text-muted">Create and manage teams for tournament sessions.</p>
      </div>
      <p class="text-muted">{{ teams.length }} team{{ teams.length === 1 ? '' : 's' }}</p>
    </div>

    <!-- Main layout: list + manage panel side by side on desktop -->
    <div class="teams-layout">
      <!-- Team list -->
      <div class="teams-list-section">
        <div class="teams-toolbar">
          <input class="input" v-model="teamSearch" placeholder="Search teams" />
          <button class="button button-compact" @click="openCreateTeam">Create Team</button>
        </div>
        <p v-if="filteredTeams.length === 0" class="empty-hint">No teams yet. Create one to get started.</p>
        <div v-else class="team-grid compact">
          <button
            v-for="team in filteredTeams"
            :key="team.id"
            class="team-card"
            :style="{ '--team-color': team.color || '#888' }"
            type="button"
            @click="$router.push(`/teams/${team.id}`)"
          >
            <span class="team-color-dot" :style="{ backgroundColor: team.color || '#888' }"></span>
            <div class="team-card-info">
              <strong>{{ team.name }}</strong>
              <p class="team-card-sub">{{ team.players?.length || 0 }} players</p>
            </div>
            <svg class="team-card-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div v-if="listError" class="notice">{{ listError }}</div>
      </div>
    </div>
  </div>

  <div v-if="showTeamUpdated" class="teams-toast">
    {{ teamUpdatedMessage }}
  </div>

  <div v-if="showCreateTeam" class="modal-backdrop">
    <div class="modal-card">
      <h3>Create team</h3>
      <div class="field">
        <label class="field-label">Name</label>
        <input class="input" v-model="newTeamName" placeholder="Team name" />
      </div>
      <div class="field">
        <label class="field-label">Color</label>
        <div class="teams-color-row">
          <button
            v-for="swatch in colorSwatches"
            :key="`create-${swatch}`"
            class="teams-color-swatch"
            :class="{ active: newTeamColor === swatch }"
            type="button"
            :style="{ backgroundColor: swatch }"
            @click="newTeamColor = swatch"
          ></button>
          <input class="input color-input" type="color" v-model="newTeamColor" />
        </div>
      </div>
      <div v-if="createError" class="notice">{{ createError }}</div>
      <div class="grid two">
        <button class="button ghost" @click="closeCreateTeam">Cancel</button>
        <button class="button" @click="createTeam">Create</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { api } from "../api.js";
import { selectedSessionId } from "../state/sessionStore.js";

const teams = ref([]);
const newTeamName = ref("");
const newTeamColor = ref("#2a9d8f");
const createError = ref("");
const listError = ref("");
const showTeamUpdated = ref(false);
const teamUpdatedMessage = ref("");
const showCreateTeam = ref(false);
const teamSearch = ref("");

const colorSwatches = [
  "#2f7f73","#4a6fa5","#c27b54","#8f5e90","#2f4858",
  "#d08b5b","#4c9a82","#b45f5f","#3b7ea1","#6b8e23",
  "#c65a82","#8c6d62","#3f6c5c","#a34f3f","#516fa3",
  "#d4a018","#7a8f9a","#b76b2a","#2f5966","#7d5a8f"
];

const filteredTeams = computed(() => {
  if (!teamSearch.value.trim()) return teams.value;
  const term = teamSearch.value.trim().toLowerCase();
  return teams.value.filter((t) => (t.name || "").toLowerCase().includes(term));
});

async function load() {
  listError.value = "";
  try {
    teams.value = await api.listTeams();
  } catch (err) {
    listError.value = err.message || "Unable to load teams";
  }
}

async function createTeam() {
  createError.value = "";
  const teamName = newTeamName.value.trim();
  if (!teamName) { createError.value = "Team name is required."; return; }
  try {
    await api.createTeam({ name: teamName, color: newTeamColor.value || null });
    newTeamName.value = "";
    showCreateTeam.value = false;
    await load();
  } catch (err) {
    createError.value = err.message || "Unable to create team";
  }
}

function openCreateTeam() { createError.value = ""; showCreateTeam.value = true; }
function closeCreateTeam() { showCreateTeam.value = false; createError.value = ""; }

let toastTimer = null;
function triggerTeamUpdatedToast(message) {
  teamUpdatedMessage.value = message;
  showTeamUpdated.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { showTeamUpdated.value = false; }, 2600);
}

onMounted(load);
</script>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────────── */
.teams-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ──────────────────────────────────────────────────────── */
.teams-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.teams-title {
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

.session-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(21, 101, 192, 0.1);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.text-muted {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 2px 0 0;
}

/* ── Main layout ─────────────────────────────────────────────────── */
.teams-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 880px) {
  .teams-layout {
    flex-direction: row;
    align-items: flex-start;
    gap: 32px;
  }

  .teams-list-section {
    flex: 1;
    min-width: 0;
  }

  .teams-manage-section {
    width: 340px;
    flex-shrink: 0;
  }
}

/* ── Toolbar ─────────────────────────────────────────────────────── */
.teams-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;
}

.teams-toolbar .input {
  flex: 1;
}

/* ── Empty hint ──────────────────────────────────────────────────── */
.empty-hint {
  font-size: 15px;
  color: var(--ink-soft);
  margin: 0;
  padding: 20px 0;
}

/* ── Team card ───────────────────────────────────────────────────── */
.team-card-chevron {
  width: 18px;
  height: 18px;
  stroke: var(--ink-soft);
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.team-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-left: 4px solid var(--team-color, var(--border));
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  width: 100%;
}

.team-card:hover {
  box-shadow: var(--shadow);
}


.team-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.team-color-dot.large {
  width: 18px;
  height: 18px;
}

.team-card-info {
  flex: 1;
  min-width: 0;
}

.team-card-info strong {
  font-size: 15px;
  display: block;
}

.team-card-sub {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 2px 0 0;
}

.team-count-pill {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(21, 101, 192, 0.1);
  color: var(--accent);
  flex-shrink: 0;
}

/* ── Manage section ──────────────────────────────────────────────── */
.teams-manage-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.manage-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.manage-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.manage-team-name {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 2px;
  color: var(--ink);
}

.manage-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Manage blocks ───────────────────────────────────────────────── */
.manage-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}

.manage-block:last-of-type {
  border-bottom: none;
}

.manage-section-heading {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--ink);
}

.manage-toggles {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.roster-search-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.roster-search-row .input {
  flex: 1;
  min-width: 140px;
}

.member-team-note {
  font-size: 12px;
  color: var(--ink-soft);
  margin-left: auto;
}

.manage-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
