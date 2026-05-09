<template>
  <div class="team-detail-page">
    <!-- Back + actions header -->
    <div class="detail-header">
      <button class="back-button" type="button" @click="$router.back()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 19l-7-7 7-7"/></svg>
        Teams
      </button>
      <div class="detail-header-actions">
        <button class="button button-compact" @click="openEditTeam">Edit</button>
        <button class="button ghost danger button-compact" @click="openDeleteTeam">Delete</button>
      </div>
    </div>

    <div v-if="loading" class="loading-hint">Loading team…</div>

    <template v-else-if="team">
      <!-- Team identity -->
      <div class="team-identity">
        <span class="team-color-swatch" :style="{ backgroundColor: team.color || '#888' }"></span>
        <div>
          <h1 class="team-name">{{ team.name }}</h1>
          <p class="text-muted">{{ teamMembers.length }} member{{ teamMembers.length === 1 ? '' : 's' }}</p>
        </div>
      </div>

      <!-- Session CTA -->
      <!-- Roster section -->
      <div class="detail-section">
        <div class="section-header">
          <h2 class="section-title">
            Roster
            <span class="section-count">{{ teamMembers.length }}</span>
          </h2>
          <button class="button ghost button-compact" @click="openAddPlayerModal">+ New Player</button>
        </div>

        <!-- Add existing player search -->
        <div class="add-to-team-wrap">
          <div class="skill-filter-chips">
            <button
              v-for="f in ['All', ...skillLevels]"
              :key="f"
              class="skill-filter-chip"
              :class="[{ active: addSkillFilter === f }, f !== 'All' ? `skill-${f.toLowerCase()}` : '']"
              @mousedown.prevent="addSkillFilter = f"
            >{{ f }}</button>
          </div>
          <input
            class="input"
            v-model="addPlayerSearch"
            placeholder="Search players to add…"
            @focus="showAddResults = true"
            @blur="onAddSearchBlur"
            autocomplete="off"
          />
          <div v-if="showAddResults && addPlayerSearch.trim()" class="add-player-dropdown">
            <button
              v-for="p in addPlayerResults"
              :key="p.id"
              class="add-player-option"
              @mousedown.prevent="addPlayerToTeam(p)"
            >
              <span class="add-player-name">{{ p.nickname || p.fullName }}</span>
              <span v-if="p.teamId && p.teamId !== teamId" class="add-player-tag other-team">{{ p.team?.name || 'Other team' }}</span>
              <span class="add-player-skill-badge" :class="`skill-${(p.skillLevel || 'Beginner').toLowerCase()}`">
                {{ p.skillLevel || 'Beginner' }}
              </span>
            </button>
            <p v-if="addPlayerResults.length === 0" class="add-player-empty">No players found.</p>
          </div>
        </div>

        <!-- Roster skill filter -->
        <div class="skill-filter-chips">
          <button
            v-for="f in ['All', ...skillLevels]"
            :key="f"
            class="skill-filter-chip"
            :class="[{ active: rosterSkillFilter === f }, f !== 'All' ? `skill-${f.toLowerCase()}` : '']"
            @click="rosterSkillFilter = f"
          >{{ f }}</button>
        </div>

        <!-- Live roster list -->
        <div v-if="teamMembers.length === 0" class="empty-hint">No members yet. Search above or create a new player.</div>
        <div v-else-if="filteredRosterMembers.length === 0" class="empty-hint">No {{ rosterSkillFilter }} members in this team.</div>
        <div v-else class="roster-live-list">
          <div v-for="player in filteredRosterMembers" :key="player.id" class="roster-live-row" @click="openCheckinModal(player)">
            <div class="roster-player-info">
              <span class="roster-player-name">{{ player.nickname || player.fullName }}</span>
              <span
                v-if="isPlayerInSession(player.id)"
                class="session-status-icon"
                :class="`status-${sessionStatusByPlayerId(player.id) || 'in_session'}`"
                :title="sessionStatusLabel(sessionStatusByPlayerId(player.id))"
              >
                <!-- checked_in -->
                <svg v-if="sessionStatusByPlayerId(player.id) === 'checked_in'" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                <!-- present -->
                <svg v-else-if="sessionStatusByPlayerId(player.id) === 'present'" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                <!-- away -->
                <svg v-else-if="sessionStatusByPlayerId(player.id) === 'away'" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <!-- fallback -->
                <svg v-else viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z"/></svg>
              </span>
            </div>
            <select
              class="skill-select"
              :class="`skill-${(player.skillLevel || 'Beginner').toLowerCase()}`"
              :value="player.skillLevel || 'Beginner'"
              @click.stop
              @change="updateSkillLevel(player, $event.target.value)"
            >
              <option v-for="level in skillLevels" :key="level" :value="level">{{ level }}</option>
            </select>
            <button class="remove-member-btn" @click.stop="removeFromTeam(player)" title="Remove from team">
              <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div v-if="membersError" class="notice">{{ membersError }}</div>
      </div>
    </template>

    <p v-else class="empty-state">Team not found.</p>

    <!-- Toast -->
    <div v-if="showToast" class="teams-toast">{{ toastMessage }}</div>

    <!-- Edit team modal -->
    <div v-if="showEditTeam" class="modal-backdrop">
      <div class="modal-card">
        <h3>Edit team</h3>
        <div class="field">
          <label class="field-label">Name</label>
          <input class="input" v-model="editTeamName" placeholder="Team name" />
        </div>
        <div class="field">
          <label class="field-label">Color</label>
          <div class="teams-color-row">
            <button
              v-for="swatch in colorSwatches"
              :key="swatch"
              class="teams-color-swatch"
              :class="{ active: editTeamColor === swatch }"
              type="button"
              :style="{ backgroundColor: swatch }"
              @click="editTeamColor = swatch"
            ></button>
            <input class="input color-input" type="color" v-model="editTeamColor" />
          </div>
        </div>
        <div v-if="editError" class="notice">{{ editError }}</div>
        <div class="grid two">
          <button class="button ghost" @click="closeEditTeam">Cancel</button>
          <button class="button" @click="confirmEditTeam">Save</button>
        </div>
      </div>
    </div>

    <!-- Delete team modal -->
    <div v-if="showDeleteTeam" class="modal-backdrop">
      <div class="modal-card">
        <h3>Delete team</h3>
        <div class="subtitle">Delete {{ team?.name || 'this team' }}? This cannot be undone.</div>
        <div class="grid two">
          <button class="button ghost" @click="closeDeleteTeam">Cancel</button>
          <button class="button danger" @click="confirmDeleteTeam">Delete</button>
        </div>
      </div>
    </div>

    <!-- Check-in session picker modal -->
    <div v-if="showCheckinModal" class="modal-backdrop">
      <div class="modal-card">
        <h3>Check In — {{ checkinTarget?.nickname || checkinTarget?.fullName }}</h3>
        <p class="text-muted" style="margin: 0 0 14px">Select a session to check this player into.</p>
        <div v-if="checkinLoading" class="checkin-sessions-loading">Loading sessions…</div>
        <div v-else-if="openSessions.length === 0" class="checkin-sessions-empty">No open sessions available.</div>
        <div v-else class="checkin-session-list">
          <button
            v-for="s in openSessions"
            :key="s.id"
            class="checkin-session-row"
            @click="confirmCheckin(s)"
          >
            <div class="checkin-session-info">
              <span class="checkin-session-name">{{ s.name }}</span>
              <span class="checkin-session-meta">{{ s.gameType === 'doubles' ? 'Doubles' : 'Singles' }}{{ s.mode === 'tournament' ? ' · Tournament' : '' }}</span>
            </div>
            <svg class="checkin-session-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <div v-if="checkinError" class="notice" style="margin-top: 12px">{{ checkinError }}</div>
        <div style="margin-top: 16px">
          <button class="button ghost" style="width: 100%" @click="closeCheckinModal">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Add new player modal -->
    <div v-if="showAddPlayerModal" class="modal-backdrop">
      <div class="modal-card">
        <h3>New Player</h3>
        <div class="field">
          <label class="field-label">Name</label>
          <input class="input" v-model="newPlayerName" placeholder="Player name" />
        </div>
        <div class="field">
          <label class="field-label">Skill level</label>
          <div class="chip-row">
            <button
              v-for="level in skillLevels"
              :key="level"
              class="chip"
              :class="{ active: newPlayerSkill === level }"
              type="button"
              @click="newPlayerSkill = level"
            >{{ level }}</button>
          </div>
        </div>
        <div v-if="addPlayerError" class="notice">{{ addPlayerError }}</div>
        <div class="grid two">
          <button class="button ghost" @click="closeAddPlayerModal">Cancel</button>
          <button class="button" @click="createPlayerFromTeam">Add Player</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api.js";
import { selectedSessionId, setSelectedSessionId } from "../state/sessionStore.js";

const route = useRoute();
const router = useRouter();
const teamId = computed(() => route.params.id);

const team = ref(null);
const players = ref([]);
const sessionPlayers = ref([]);
const session = ref(null);
const loading = ref(true);

const editTeamName = ref("");
const editTeamColor = ref("#2a9d8f");
const membersError = ref("");
const editError = ref("");

const showEditTeam = ref(false);
const showDeleteTeam = ref(false);
const showAddPlayerModal = ref(false);
const newPlayerName = ref("");
const newPlayerSkill = ref("Beginner");
const addPlayerError = ref("");
const showToast = ref(false);
const toastMessage = ref("");
let toastTimer = null;

const addPlayerSearch = ref("");
const showAddResults = ref(false);
const addSkillFilter = ref("All");
const rosterSkillFilter = ref("All");

const colorSwatches = [
  "#2f7f73","#4a6fa5","#c27b54","#8f5e90","#2f4858",
  "#d08b5b","#4c9a82","#b45f5f","#3b7ea1","#6b8e23",
  "#c65a82","#8c6d62","#3f6c5c","#a34f3f","#516fa3",
  "#d4a018","#7a8f9a","#b76b2a","#2f5966","#7d5a8f"
];
const skillLevels = ["Beginner", "Intermediate", "Advance", "Elite"];

const teamMembers = computed(() => players.value.filter((p) => p.teamId === teamId.value));

const sessionPlayerStatusMap = computed(
  () => new Map(sessionPlayers.value.map((sp) => [sp.playerId, sp.status]))
);
const activeSessionPlayerIds = computed(
  () => new Set(sessionPlayers.value.filter((sp) => sp.status !== "done").map((sp) => sp.playerId))
);


const addPlayerResults = computed(() => {
  const q = addPlayerSearch.value.trim().toLowerCase();
  if (!q) return [];
  const currentIds = new Set(teamMembers.value.map((p) => p.id));
  return players.value
    .filter((p) => {
      if (currentIds.has(p.id)) return false;
      if (addSkillFilter.value !== "All" && (p.skillLevel || "Beginner") !== addSkillFilter.value) return false;
      const name = `${p.fullName} ${p.nickname || ""}`.toLowerCase();
      return name.includes(q);
    })
    .slice(0, 8);
});

const filteredRosterMembers = computed(() => {
  if (rosterSkillFilter.value === "All") return teamMembers.value;
  return teamMembers.value.filter((p) => (p.skillLevel || "Beginner") === rosterSkillFilter.value);
});

async function load() {
  loading.value = true;
  try {
    const [teamResult, playerResult] = await Promise.allSettled([
      api.listTeams().then((ts) => ts.find((t) => t.id === teamId.value)),
      api.listPlayers()
    ]);
    team.value = teamResult.status === "fulfilled" ? teamResult.value : null;
    players.value = playerResult.status === "fulfilled" ? playerResult.value : [];
    if (team.value) {
      editTeamName.value = team.value.name || "";
      editTeamColor.value = team.value.color || "#2a9d8f";
    }
    await loadSession();
    await loadSessionPlayers();
  } finally {
    loading.value = false;
  }
}

async function loadSession() {
  try {
    let current = null;
    if (selectedSessionId.value) {
      current = await api.session(selectedSessionId.value);
    } else {
      current = await api.activeSession();
      if (current?.id) setSelectedSessionId(current.id);
    }
    session.value = current;
  } catch {
    session.value = null;
    sessionPlayers.value = [];
  }
}

async function loadSessionPlayers() {
  if (!session.value?.id) { sessionPlayers.value = []; return; }
  try { sessionPlayers.value = await api.sessionPlayers(session.value.id); }
  catch { sessionPlayers.value = []; }
}

function triggerToast(msg) {
  toastMessage.value = msg;
  showToast.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { showToast.value = false; }, 2600);
}

// ── Team edit / delete ────────────────────────────────────────────

function openEditTeam() { editError.value = ""; showEditTeam.value = true; }
function closeEditTeam() { showEditTeam.value = false; editError.value = ""; }

async function confirmEditTeam() {
  editError.value = "";
  try {
    await api.updateTeam(teamId.value, { name: editTeamName.value.trim(), color: editTeamColor.value || null });
    const updated = await api.listTeams().then((ts) => ts.find((t) => t.id === teamId.value));
    if (updated) team.value = updated;
    showEditTeam.value = false;
    triggerToast(`${team.value?.name || "Team"} updated.`);
  } catch (err) {
    editError.value = err.message || "Unable to update team";
  }
}

function openDeleteTeam() { showDeleteTeam.value = true; }
function closeDeleteTeam() { showDeleteTeam.value = false; }

async function confirmDeleteTeam() {
  try {
    await api.deleteTeam(teamId.value);
    router.replace("/teams");
  } catch (err) {
    membersError.value = err.message || "Unable to delete team";
    showDeleteTeam.value = false;
  }
}

// ── Roster: add existing player ───────────────────────────────────

function onAddSearchBlur() {
  setTimeout(() => { showAddResults.value = false; }, 150);
}

async function addPlayerToTeam(player) {
  addPlayerSearch.value = "";
  showAddResults.value = false;
  membersError.value = "";
  try {
    const newIds = [...teamMembers.value.map((p) => p.id), player.id];
    await api.updateTeamMembers(teamId.value, { playerIds: newIds });
    const idx = players.value.findIndex((p) => p.id === player.id);
    if (idx !== -1) players.value[idx] = { ...players.value[idx], teamId: teamId.value };
    triggerToast(`${player.nickname || player.fullName} added to team.`);
  } catch (err) {
    membersError.value = err.message || "Unable to add player";
  }
}

// ── Roster: remove player ─────────────────────────────────────────

async function removeFromTeam(player) {
  membersError.value = "";
  try {
    const newIds = teamMembers.value.filter((p) => p.id !== player.id).map((p) => p.id);
    await api.updateTeamMembers(teamId.value, { playerIds: newIds });
    const idx = players.value.findIndex((p) => p.id === player.id);
    if (idx !== -1) players.value[idx] = { ...players.value[idx], teamId: null };
    triggerToast(`${player.nickname || player.fullName} removed from team.`);
  } catch (err) {
    membersError.value = err.message || "Unable to remove player";
  }
}

// ── Roster: update skill level ────────────────────────────────────

async function updateSkillLevel(player, level) {
  membersError.value = "";
  try {
    await api.updatePlayer(player.id, { skillLevel: level });
    const idx = players.value.findIndex((p) => p.id === player.id);
    if (idx !== -1) players.value[idx] = { ...players.value[idx], skillLevel: level };
    triggerToast(`${player.nickname || player.fullName} → ${level}.`);
  } catch (err) {
    membersError.value = err.message || "Unable to update skill level";
  }
}

// ── Session check-in modal ────────────────────────────────────────

const showCheckinModal = ref(false);
const checkinTarget = ref(null);
const openSessions = ref([]);
const checkinLoading = ref(false);
const checkinError = ref("");

async function openCheckinModal(player) {
  checkinTarget.value = player;
  checkinError.value = "";
  openSessions.value = [];
  showCheckinModal.value = true;
  checkinLoading.value = true;
  try {
    openSessions.value = await api.listSessions("open");
  } catch {
    checkinError.value = "Unable to load sessions.";
  } finally {
    checkinLoading.value = false;
  }
}

function closeCheckinModal() {
  showCheckinModal.value = false;
  checkinTarget.value = null;
  openSessions.value = [];
  checkinError.value = "";
}

async function confirmCheckin(sessionObj) {
  checkinError.value = "";
  const player = checkinTarget.value;
  try {
    await api.checkinPlayer(player.id, { sessionId: sessionObj.id });
    await loadSessionPlayers();
    closeCheckinModal();
    triggerToast(`${player.nickname || player.fullName} checked in to ${sessionObj.name}.`);
  } catch (err) {
    checkinError.value = err.message || "Unable to check in player";
  }
}

// ── Add new player modal ──────────────────────────────────────────

function openAddPlayerModal() {
  addPlayerError.value = "";
  newPlayerName.value = "";
  newPlayerSkill.value = "Beginner";
  showAddPlayerModal.value = true;
}
function closeAddPlayerModal() { showAddPlayerModal.value = false; addPlayerError.value = ""; }

async function createPlayerFromTeam() {
  addPlayerError.value = "";
  const name = newPlayerName.value.trim();
  if (!name) { addPlayerError.value = "Player name is required."; return; }
  try {
    const created = await api.createPlayer({ fullName: name, skillLevel: newPlayerSkill.value });
    const newIds = [...teamMembers.value.map((p) => p.id), created.id];
    await api.updateTeamMembers(teamId.value, { playerIds: newIds });
    players.value = await api.listPlayers();
    showAddPlayerModal.value = false;
    triggerToast(`${name} added to team.`);
  } catch (err) {
    addPlayerError.value = err.message || "Unable to add player";
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function isPlayerInSession(playerId) { return activeSessionPlayerIds.value.has(playerId); }
function sessionStatusByPlayerId(playerId) { return sessionPlayerStatusMap.value.get(playerId) || null; }
function sessionStatusLabel(status) {
  if (status === "present") return "Present";
  if (status === "away") return "Away";
  if (status === "checked_in") return "Checked In";
  return "In Session";
}

onMounted(load);
onBeforeUnmount(() => { if (toastTimer) clearTimeout(toastTimer); });
</script>

<style scoped>
.team-detail-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Header ───────────────────────────────────────────────────────── */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  padding: 0;
}
.back-button svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.detail-header-actions { display: flex; gap: 8px; }

/* ── Team identity ────────────────────────────────────────────────── */
.team-identity { display: flex; align-items: center; gap: 10px; }

.team-color-swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.1);
}

.team-name { font-size: 18px; font-weight: 700; margin: 0 0 1px; color: var(--ink); }
.text-muted { font-size: 13px; color: var(--ink-soft); margin: 0; }

/* ── Check-in session picker modal ────────────────────────────────── */
.checkin-sessions-loading,
.checkin-sessions-empty {
  font-size: 14px;
  color: var(--ink-soft);
  padding: 12px 0;
}

.checkin-session-list {
  display: flex;
  flex-direction: column;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.checkin-session-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.checkin-session-row:last-child { border-bottom: none; }
.checkin-session-row:hover { background: rgba(15, 157, 138, 0.07); }

.checkin-session-info { flex: 1; min-width: 0; }
.checkin-session-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.checkin-session-meta {
  display: block;
  font-size: 12px;
  color: var(--ink-soft);
  margin-top: 2px;
}

.checkin-session-arrow {
  width: 18px;
  height: 18px;
  stroke: var(--ink-soft);
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

/* ── Detail section ───────────────────────────────────────────────── */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--border);
  padding-top: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-soft);
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 999px;
}

/* ── Add-to-team search ───────────────────────────────────────────── */
.add-to-team-wrap { position: relative; }

.add-player-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
}

.add-player-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.add-player-option:last-child { border-bottom: none; }
.add-player-option:hover { background: rgba(15, 157, 138, 0.07); }

.add-player-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-player-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  flex-shrink: 0;
}
.add-player-tag.other-team {
  background: rgba(245, 158, 11, 0.15);
  color: #92400e;
}

.add-player-empty {
  padding: 12px;
  font-size: 13px;
  color: var(--ink-soft);
  margin: 0;
}

/* ── Skill badge (in dropdown) ────────────────────────────────────── */
.add-player-skill-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

/* ── Live roster list ─────────────────────────────────────────────── */
.roster-live-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.roster-live-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
  transition: background 0.1s;
}
.roster-live-row:last-child { border-bottom: none; }
.roster-live-row:hover { background: rgba(15, 157, 138, 0.06); }

.roster-player-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.roster-player-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-status-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.session-status-icon svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.status-checked_in  { background: rgba(15,157,138,0.14); }
.status-checked_in svg { stroke: var(--accent); }
.status-present     { background: rgba(34,197,94,0.15); }
.status-present svg { stroke: #16a34a; fill: #16a34a; }
.status-away        { background: rgba(245,158,11,0.15); }
.status-away svg    { stroke: #d97706; }
.status-in_session  { background: rgba(99,102,241,0.15); }
.status-in_session svg { stroke: #4f46e5; fill: #4f46e5; }

/* ── Skill select ─────────────────────────────────────────────────── */
.skill-select {
  -webkit-appearance: none;
  appearance: none;
  border: 1.5px solid var(--border);
  border-radius: 999px;
  padding: 5px 26px 5px 11px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 9px center;
  flex-shrink: 0;
  transition: border-color 0.15s;
  max-width: 130px;
}
.skill-select:focus { outline: none; border-color: var(--accent); }

.skill-select.skill-beginner    { background-color: #f1f5f9; color: #475569; border-color: #cbd5e1; }
.skill-select.skill-intermediate{ background-color: rgba(59,130,246,0.1); color: #1d4ed8; border-color: rgba(59,130,246,0.35); }
.skill-select.skill-advance     { background-color: rgba(245,158,11,0.1); color: #b45309; border-color: rgba(245,158,11,0.35); }
.skill-select.skill-elite       { background-color: rgba(139,92,246,0.1); color: #6d28d9; border-color: rgba(139,92,246,0.35); }

/* same palette for dropdown badges */
.add-player-skill-badge.skill-beginner    { background: #f1f5f9; color: #475569; }
.add-player-skill-badge.skill-intermediate{ background: rgba(59,130,246,0.1); color: #1d4ed8; }
.add-player-skill-badge.skill-advance     { background: rgba(245,158,11,0.1); color: #b45309; }
.add-player-skill-badge.skill-elite       { background: rgba(139,92,246,0.1); color: #6d28d9; }

/* ── Remove button ────────────────────────────────────────────────── */
.remove-member-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1.5px solid var(--border);
  background: white;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: border-color 0.15s, background 0.15s;
}
.remove-member-btn svg {
  width: 14px;
  height: 14px;
  stroke: var(--ink-soft);
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
}
.remove-member-btn:hover { border-color: rgba(185,28,28,0.45); background: rgba(185,28,28,0.05); }
.remove-member-btn:hover svg { stroke: #b91c1c; }

/* ── Skill filter chips ───────────────────────────────────────────── */
.skill-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-filter-chip {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: #f8fafc;
  color: var(--ink-soft);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.skill-filter-chip:hover { border-color: var(--accent); color: var(--accent); }
.skill-filter-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.skill-filter-chip.skill-beginner.active     { background: #475569; border-color: #475569; color: #fff; }
.skill-filter-chip.skill-intermediate.active { background: #1d4ed8; border-color: #1d4ed8; color: #fff; }
.skill-filter-chip.skill-advance.active      { background: #b45309; border-color: #b45309; color: #fff; }
.skill-filter-chip.skill-elite.active        { background: #6d28d9; border-color: #6d28d9; color: #fff; }

/* ── Empty / loading ──────────────────────────────────────────────── */
.empty-hint {
  font-size: 14px;
  color: var(--ink-soft);
  padding: 16px 0;
}

.loading-hint,
.empty-state {
  font-size: 16px;
  color: var(--ink-soft);
  padding: 32px 0;
  text-align: center;
}
</style>
