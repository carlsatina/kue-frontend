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

    <!-- Loading -->
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

      <!-- Session call-to-action -->
      <div class="session-cta" v-if="session?.status === 'open'">
        <div class="session-cta-body">
          <div class="session-cta-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <div>
            <strong>{{ session.name }}</strong>
            <p class="text-muted">Select members below to add them to this session.</p>
          </div>
        </div>
        <button class="button button-compact" @click="openSessionAddModal">Add to Session</button>
      </div>
      <div v-else class="session-inactive-hint">
        <p class="text-muted">No active session. Open a session to check in team members.</p>
      </div>

      <!-- Roster section -->
      <div class="detail-section">
        <div class="section-header">
          <h2 class="section-title">Roster</h2>
          <button class="button ghost button-compact" @click="openAddPlayerModal">+ New Player</button>
        </div>
        <p class="text-muted">{{ rosterHint }}</p>

        <div class="roster-filters">
          <label class="teams-toggle">
            <input type="checkbox" v-model="showUnassigned" />
            <span>Show unassigned players</span>
          </label>
          <label class="teams-toggle">
            <input type="checkbox" v-model="includeOtherTeams" />
            <span>Show players from other teams</span>
          </label>
        </div>

        <div class="roster-search-row">
          <button class="button ghost button-compact" type="button" @click="toggleRosterSearch">
            {{ showRosterSearch ? 'Hide Search' : 'Search Players' }}
          </button>
          <input v-if="showRosterSearch" class="input" v-model="rosterSearch" placeholder="Search players" />
        </div>

        <div class="team-member-list">
          <label
            v-for="player in filteredRosterPlayers"
            :key="player.id"
            class="team-member-row"
          >
            <input type="checkbox" :value="player.id" v-model="memberIds" />
            <span>{{ player.nickname || player.fullName }}</span>
            <span
              v-if="player.team && player.team.id !== teamId"
              class="member-other-team"
            >{{ player.team.name }}</span>
          </label>
        </div>

        <div class="roster-actions">
          <button class="button button-compact" @click="saveMembers">Save Members</button>
          <button class="button ghost button-compact" @click="selectAllRosterMembers">Select all</button>
          <button class="button ghost button-compact" @click="clearRosterMembers">Clear</button>
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

    <!-- Add player modal -->
    <div v-if="showAddPlayerModal" class="modal-backdrop">
      <div class="modal-card">
        <h3>Add player</h3>
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

    <!-- Session add modal -->
    <div v-if="showSessionAddModal" class="modal-backdrop">
      <div class="modal-card session-add-modal">
        <h3>Add team to session</h3>
        <div class="field">
          <label class="field-label">Session</label>
          <select
            class="input"
            v-model="selectedSessionId"
            @change="handleSessionSelectChange"
            :disabled="openSessions.length === 0"
          >
            <option v-if="openSessions.length === 0" value="">No open sessions</option>
            <option v-for="item in openSessions" :key="item.id" :value="item.id">
              {{ item.name || 'Session' }} · {{ item.status }}
            </option>
          </select>
        </div>
        <div v-if="!session || session.status !== 'open'" class="notice">Open a session to add players.</div>
        <div class="field">
          <label class="field-label">Select members to add</label>
          <input class="input" v-model="sessionRosterSearch" placeholder="Search team members" />
          <div class="team-member-list">
            <label
              v-for="player in filteredSessionMembers"
              :key="`session-${player.id}`"
              class="team-member-row"
              :class="{ 'in-session': isPlayerInSession(player.id) }"
            >
              <input
                type="checkbox"
                :value="player.id"
                v-model="sessionMemberIds"
                :disabled="isPlayerInSession(player.id)"
              />
              <span>{{ player.nickname || player.fullName }}</span>
              <span v-if="isPlayerInSession(player.id)" class="subtitle compact session-member-pill">
                {{ sessionStatusLabel(sessionStatusByPlayerId(player.id)) }}
              </span>
              <span
                v-else-if="otherSessionInfo(player.id).length"
                class="subtitle compact session-member-pill other-session"
                :title="otherSessionTitle(player.id)"
              >{{ otherSessionLabel(player.id) }}</span>
            </label>
          </div>
        </div>
        <div class="inline-actions session-add-actions">
          <button class="button ghost button-compact" @click="selectAllSessionMembers">Select all</button>
          <button class="button ghost button-compact" @click="clearSessionMembers">Clear</button>
        </div>
        <div class="grid two session-add-actions">
          <button class="button ghost button-compact" @click="closeSessionAddModal">Cancel</button>
          <button
            class="button button-compact"
            @click="confirmSessionAdd"
            :disabled="!session || session.status !== 'open'"
          >Add to Session</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api.js";
import { selectedSessionId, setSelectedSessionId } from "../state/sessionStore.js";

const route = useRoute();
const router = useRouter();
const teamId = computed(() => route.params.id);

const team = ref(null);
const players = ref([]);
const sessionPlayers = ref([]);
const otherSessionPlayers = ref({});
const session = ref(null);
const openSessions = ref([]);
const loading = ref(true);

const editTeamName = ref("");
const editTeamColor = ref("#2a9d8f");
const memberIds = ref([]);
const sessionMemberIds = ref([]);
const membersError = ref("");
const sessionRosterSearch = ref("");
const rosterSearch = ref("");
const includeOtherTeams = ref(false);
const showUnassigned = ref(true);
const showRosterSearch = ref(false);
const editError = ref("");

const showEditTeam = ref(false);
const showDeleteTeam = ref(false);
const showAddPlayerModal = ref(false);
const showSessionAddModal = ref(false);
const newPlayerName = ref("");
const newPlayerSkill = ref("Beginner");
const addPlayerError = ref("");
const showToast = ref(false);
const toastMessage = ref("");
let toastTimer = null;

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

const rosterHint = computed(() => {
  if (includeOtherTeams.value && showUnassigned.value) return "Showing all players. Selecting moves them from their current team.";
  if (includeOtherTeams.value && !showUnassigned.value) return "Showing current team and other teams. Unassigned players are hidden.";
  if (!includeOtherTeams.value && showUnassigned.value) return "Showing unassigned players and current team members.";
  return "Showing current team members only.";
});

const filteredRosterPlayers = computed(() => {
  const id = teamId.value;
  const available = players.value.filter((p) => {
    const currentTeamId = p.teamId || p.team?.id || null;
    if (!showUnassigned.value && !currentTeamId) return false;
    if (!includeOtherTeams.value && currentTeamId && currentTeamId !== id) return false;
    return true;
  });
  if (!rosterSearch.value.trim()) return available;
  const term = rosterSearch.value.trim().toLowerCase();
  return available.filter((p) => `${p.fullName} ${p.nickname || ""}`.toLowerCase().includes(term));
});

const filteredSessionMembers = computed(() => {
  if (!sessionRosterSearch.value.trim()) return teamMembers.value;
  const term = sessionRosterSearch.value.trim().toLowerCase();
  return teamMembers.value.filter((p) => `${p.fullName} ${p.nickname || ""}`.toLowerCase().includes(term));
});

async function load() {
  loading.value = true;
  try {
    const [teamResult, playerResult] = await Promise.allSettled([
      api.team ? api.team(teamId.value) : api.listTeams().then((ts) => ts.find((t) => t.id === teamId.value)),
      api.listPlayers()
    ]);
    team.value = teamResult.status === "fulfilled" ? teamResult.value : null;
    players.value = playerResult.status === "fulfilled" ? playerResult.value : [];
    if (team.value) {
      editTeamName.value = team.value.name || "";
      editTeamColor.value = team.value.color || "#2a9d8f";
      memberIds.value = players.value.filter((p) => p.teamId === teamId.value).map((p) => p.id);
    }
    await loadSession();
    await loadSessionPlayers();
    await loadOtherSessionsPlayers();
  } finally {
    loading.value = false;
  }
}

async function loadOpenSessions() {
  try { openSessions.value = await api.listSessions("open"); }
  catch { openSessions.value = []; }
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
    otherSessionPlayers.value = {};
  }
}

async function loadSessionPlayers() {
  if (!session.value?.id) { sessionPlayers.value = []; return; }
  try { sessionPlayers.value = await api.sessionPlayers(session.value.id); }
  catch { sessionPlayers.value = []; }
}

async function loadOtherSessionsPlayers() {
  otherSessionPlayers.value = {};
  if (!session.value?.id) return;
  try {
    const sessions = await api.listSessions("open");
    const others = (sessions || []).filter((s) => s.id !== session.value.id);
    if (!others.length) return;
    const results = await Promise.allSettled(others.map((s) => api.sessionPlayers(s.id)));
    const map = {};
    results.forEach((r, idx) => {
      if (r.status !== "fulfilled") return;
      const s = others[idx];
      (r.value || []).filter((sp) => sp.status !== "done").forEach((sp) => {
        if (!map[sp.playerId]) map[sp.playerId] = [];
        map[sp.playerId].push({ sessionId: s.id, name: s.name || "Session", status: sp.status });
      });
    });
    otherSessionPlayers.value = map;
  } catch {
    otherSessionPlayers.value = {};
  }
}

async function handleSessionSelectChange() {
  if (!selectedSessionId.value) return;
  setSelectedSessionId(selectedSessionId.value);
  await loadSession();
  await loadSessionPlayers();
  await loadOtherSessionsPlayers();
}

function triggerToast(msg) {
  toastMessage.value = msg;
  showToast.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { showToast.value = false; }, 2600);
}

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

async function saveMembers() {
  membersError.value = "";
  try {
    await api.updateTeamMembers(teamId.value, { playerIds: memberIds.value.slice() });
    players.value = await api.listPlayers();
    triggerToast(`Members saved for ${team.value?.name || "team"}.`);
  } catch (err) {
    membersError.value = err.message || "Unable to update team members";
  }
}

function openAddPlayerModal() { addPlayerError.value = ""; newPlayerName.value = ""; newPlayerSkill.value = "Beginner"; showAddPlayerModal.value = true; }
function closeAddPlayerModal() { showAddPlayerModal.value = false; addPlayerError.value = ""; }

async function createPlayerFromTeam() {
  addPlayerError.value = "";
  const name = newPlayerName.value.trim();
  if (!name) { addPlayerError.value = "Player name is required."; return; }
  try {
    await api.createPlayer({ fullName: name, skillLevel: newPlayerSkill.value });
    players.value = await api.listPlayers();
    showAddPlayerModal.value = false;
    triggerToast(`${name} added.`);
  } catch (err) {
    addPlayerError.value = err.message || "Unable to add player";
  }
}

function toggleRosterSearch() {
  showRosterSearch.value = !showRosterSearch.value;
  if (!showRosterSearch.value) rosterSearch.value = "";
}

function selectAllRosterMembers() { memberIds.value = filteredRosterPlayers.value.map((p) => p.id); }
function clearRosterMembers() { memberIds.value = []; }
function selectAllSessionMembers() {
  sessionMemberIds.value = teamMembers.value.map((p) => p.id).filter((id) => !isPlayerInSession(id));
}
function clearSessionMembers() { sessionMemberIds.value = []; }

function openSessionAddModal() {
  loadOpenSessions().then(async () => {
    const openIds = new Set(openSessions.value.map((s) => s.id));
    if (!selectedSessionId.value || !openIds.has(selectedSessionId.value)) {
      const fallbackId = openSessions.value[0]?.id || "";
      if (fallbackId) setSelectedSessionId(fallbackId);
    }
    await loadSession();
    await loadSessionPlayers();
    await loadOtherSessionsPlayers();
    sessionMemberIds.value = teamMembers.value.map((p) => p.id).filter((id) => !isPlayerInSession(id));
    showSessionAddModal.value = true;
  });
}
function closeSessionAddModal() { showSessionAddModal.value = false; }

async function checkInTeam() {
  membersError.value = "";
  if (!session.value || session.value.status !== "open") { membersError.value = "Session is not open."; return; }
  const targetIds = sessionMemberIds.value.filter((id) => !isPlayerInSession(id));
  if (!targetIds.length) {
    membersError.value = sessionMemberIds.value.length ? "Selected players are already in session." : "Select at least one member to add.";
    return;
  }
  try {
    for (const playerId of targetIds) {
      await api.checkinPlayer(playerId, { sessionId: session.value.id });
    }
    triggerToast(`Added ${team.value?.name || "team"} to ${session.value?.name || "session"}.`);
    await loadSessionPlayers();
    await loadOtherSessionsPlayers();
  } catch (err) {
    membersError.value = err.message || "Unable to add team to session";
  }
}

async function confirmSessionAdd() {
  await checkInTeam();
  if (!membersError.value) showSessionAddModal.value = false;
}

function isPlayerInSession(playerId) { return activeSessionPlayerIds.value.has(playerId); }
function sessionStatusByPlayerId(playerId) { return sessionPlayerStatusMap.value.get(playerId) || null; }
function sessionStatusLabel(status) {
  if (status === "present") return "Present";
  if (status === "away") return "Away";
  if (status === "checked_in") return "Checked in";
  return "In session";
}
function otherSessionInfo(playerId) { return otherSessionPlayers.value[playerId] || []; }
function otherSessionLabel(playerId) {
  const list = otherSessionInfo(playerId);
  if (!list.length) return "";
  return list.length === 1 ? `In ${list[0].name}` : `In ${list[0].name} +${list.length - 1}`;
}
function otherSessionTitle(playerId) {
  return otherSessionInfo(playerId).map((i) => `${i.name} (${sessionStatusLabel(i.status)})`).join(", ");
}

onMounted(load);
onBeforeUnmount(() => { if (toastTimer) clearTimeout(toastTimer); });
</script>

<style scoped>
.team-detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Back button header ───────────────────────────────────────────── */
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

.detail-header-actions {
  display: flex;
  gap: 8px;
}

/* ── Team identity ───────────────────────────────────────────────── */
.team-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.team-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.1);
}

.team-name {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 2px;
  color: var(--ink);
}

.text-muted {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 0;
}

/* ── Session CTA ─────────────────────────────────────────────────── */
.session-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(135deg, #1a237e 0%, #1565c0 55%, #00695c 100%);
  color: #ffffff;
  border-radius: var(--radius-sm);
  padding: 16px;
  flex-wrap: wrap;
}

.session-cta-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.session-cta-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.session-cta-icon svg {
  width: 20px;
  height: 20px;
  fill: #ffffff;
}

.session-cta strong {
  display: block;
  font-size: 15px;
}

.session-cta .text-muted {
  color: rgba(255,255,255,0.75);
  font-size: 13px;
  margin-top: 2px;
}

.session-cta .button {
  background: rgba(255,255,255,0.2);
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.3);
  white-space: nowrap;
}

.session-cta .button:hover {
  background: rgba(255,255,255,0.3);
}

.session-inactive-hint {
  padding: 12px 0;
}

/* ── Detail sections ─────────────────────────────────────────────── */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--ink);
}

/* ── Roster filters / search ─────────────────────────────────────── */
.roster-filters {
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

/* ── Member note ─────────────────────────────────────────────────── */
.member-other-team {
  font-size: 12px;
  color: var(--ink-soft);
  margin-left: auto;
}

/* ── Roster actions ──────────────────────────────────────────────── */
.roster-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ── Loading / empty ─────────────────────────────────────────────── */
.loading-hint,
.empty-state {
  font-size: 16px;
  color: var(--ink-soft);
  padding: 32px 0;
  text-align: center;
}
</style>
