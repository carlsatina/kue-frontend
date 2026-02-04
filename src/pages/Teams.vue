<template>
  <div class="page-grid with-sidebar teams-page">
    <div class="page-main stack">
      <div class="card stack live-surface teams-card">
        <div class="teams-hero">
          <div>
            <div class="teams-eyebrow">Team control</div>
            <div class="teams-title">Teams</div>
            <div class="subtitle">Create teams for tournament sessions and assign players.</div>
          </div>
          <div class="teams-hero-meta">
            <div class="teams-chip">
              {{ session?.name || "No session selected" }} · {{ session?.status || "inactive" }}
            </div>
            <div v-if="sessionError" class="notice">{{ sessionError }}</div>
          </div>
        </div>
        <div class="teams-stats">
          <div class="teams-stat">
            <div class="subtitle">Teams</div>
            <strong>{{ teams.length }}</strong>
          </div>
          <div class="teams-stat">
            <div class="subtitle">Players</div>
            <strong>{{ players.length }}</strong>
          </div>
          <div class="teams-stat">
            <div class="subtitle">Mode</div>
            <strong>{{ session?.mode || "—" }}</strong>
          </div>
        </div>
        <div class="teams-toolbar">
          <input class="input teams-search" v-model="teamSearch" placeholder="Search teams" />
          <div class="teams-toolbar-actions">
            <div class="subtitle compact teams-toolbar-note">
              Select a team to manage roster and session.
            </div>
            <button class="button button-compact" @click="openCreateTeam">Create Team</button>
          </div>
        </div>
        <div v-if="filteredTeams.length === 0" class="subtitle">
          No teams yet. Create one from the sidebar.
        </div>
        <div v-else class="team-grid compact">
          <button
            v-for="team in filteredTeams"
            :key="team.id"
            class="team-card"
            :class="{ selected: team.id === selectedTeamId }"
            :style="{ '--team-color': team.color || '#d8d2c8' }"
            type="button"
            @click="selectTeam(team)"
          >
            <span class="team-color" :style="{ backgroundColor: team.color || '#d8d2c8' }"></span>
            <div class="team-card-info">
              <strong>{{ team.name }}</strong>
              <div class="subtitle compact">{{ team.players?.length || 0 }} players</div>
            </div>
            <div class="team-card-meta">
              <span class="team-pill">{{ team.players?.length || 0 }}</span>
            </div>
          </button>
        </div>
        <div v-if="listError" class="notice">{{ listError }}</div>
      </div>
    </div>

    <div class="page-side stack">
      <div class="card live-surface teams-panel">
        <div class="section-title">Manage Team</div>
        <div v-if="!selectedTeam" class="subtitle">Select a team to manage players.</div>
        <template v-else>
          <div class="teams-manage-head">
            <div class="teams-manage-info">
              <span class="team-color" :style="{ backgroundColor: selectedTeam?.color || '#d8d2c8' }"></span>
              <div>
                <strong>{{ selectedTeam?.name }}</strong>
                <div class="subtitle compact">{{ teamMembers.length }} players</div>
              </div>
            </div>
            <div class="inline-actions">
              <button class="button button-compact" @click="openEditTeam">Edit Team</button>
              <button class="button ghost danger button-compact" @click="openDeleteTeam">Delete</button>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Team roster</label>
            <div class="subtitle compact team-assign-note">
              {{ rosterHint }}
            </div>
            <label class="teams-toggle">
              <input type="checkbox" v-model="showUnassigned" />
              <span>Show unassigned players</span>
            </label>
            <label class="teams-toggle">
              <input type="checkbox" v-model="includeOtherTeams" />
              <span>Show players from other teams</span>
            </label>
            <div class="teams-search-row">
              <input class="input teams-search" v-model="rosterSearch" placeholder="Search players" />
              <button class="button ghost button-compact" @click="openAddPlayerModal">Add New Player</button>
            </div>
            <div class="team-member-list">
              <label v-for="player in filteredRosterPlayers" :key="player.id" class="team-member-row">
                <input type="checkbox" :value="player.id" v-model="memberIds" />
                <span>{{ player.nickname || player.fullName }}</span>
                <span
                  v-if="player.team && player.team.id !== selectedTeamId"
                  class="subtitle compact team-member-note"
                >
                  {{ player.team.name }}
                </span>
              </label>
            </div>
            <div class="inline-actions">
              <button class="button button-compact" @click="saveMembers">Save Members</button>
              <button class="button ghost button-compact" @click="selectAllRosterMembers">Select all</button>
              <button class="button ghost button-compact" @click="clearRosterMembers">Clear</button>
            </div>
          </div>
          <div class="team-section-spacer"></div>
          <div class="team-section session-section">
            <div class="team-section-title">Add to session</div>
            <div class="subtitle compact team-assign-note">
              Select which members to add to the current session.
            </div>
            <div class="inline-actions">
              <button class="button secondary button-compact" @click="openSessionAddModal">
                Add Team to Session
              </button>
              <button class="button ghost button-compact" @click="selectAllSessionMembers">Select all</button>
              <button class="button ghost button-compact" @click="clearSessionMembers">Clear</button>
            </div>
          </div>
          <div v-if="membersError" class="notice">{{ membersError }}</div>
        </template>
      </div>
    </div>
  </div>

  <div v-if="showTeamUpdated" class="teams-toast">
    {{ teamUpdatedMessage }}
  </div>

  <div v-if="showDeleteTeam" class="modal-backdrop">
    <div class="modal-card">
      <h3>Delete team</h3>
      <div class="subtitle">Delete {{ selectedTeam?.name || "this team" }}?</div>
      <div class="grid two">
        <button class="button ghost" @click="closeDeleteTeam">Cancel</button>
        <button class="button danger" @click="confirmDeleteTeam">Delete</button>
      </div>
    </div>
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
            :key="`edit-${swatch}`"
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
            :key="`team-skill-${level}`"
            class="chip"
            :class="{ active: newPlayerSkill === level }"
            type="button"
            @click="newPlayerSkill = level"
          >
            {{ level }}
          </button>
        </div>
      </div>
      <div v-if="addPlayerError" class="notice">{{ addPlayerError }}</div>
      <div class="grid two">
        <button class="button ghost" @click="closeAddPlayerModal">Cancel</button>
        <button class="button" @click="createPlayerFromTeam">Add Player</button>
      </div>
    </div>
  </div>
  <div v-if="showSessionAddModal" class="modal-backdrop">
    <div class="modal-card">
      <h3>Add team to session</h3>
      <div class="subtitle">
        {{ session?.name || "No session selected" }} · {{ session?.status || "inactive" }}
      </div>
      <div v-if="!session || session.status !== 'open'" class="notice">
        Open a session to add players.
      </div>
        <div class="field">
          <label class="field-label">Team members</label>
          <input class="input teams-search" v-model="sessionRosterSearch" placeholder="Search team members" />
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
            >
              {{ otherSessionLabel(player.id) }}
            </span>
          </label>
          </div>
        </div>
      <div class="inline-actions">
        <button class="button ghost button-compact" @click="selectAllSessionMembers">Select all</button>
        <button class="button ghost button-compact" @click="clearSessionMembers">Clear</button>
      </div>
      <div class="grid two">
        <button class="button ghost" @click="closeSessionAddModal">Cancel</button>
        <button class="button" @click="confirmSessionAdd" :disabled="!session || session.status !== 'open'">
          Add to Session
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { api } from "../api.js";
import { selectedSessionId, setSelectedSessionId } from "../state/sessionStore.js";

const teams = ref([]);
const players = ref([]);
const sessionPlayers = ref([]);
const otherSessionPlayers = ref({});
const selectedTeamId = ref("");
const session = ref(null);

const newTeamName = ref("");
const newTeamColor = ref("#2a9d8f");
const createError = ref("");
const editError = ref("");
const listError = ref("");

const editTeamName = ref("");
const editTeamColor = ref("#2a9d8f");
const memberIds = ref([]);
const sessionMemberIds = ref([]);
const membersError = ref("");
const showDeleteTeam = ref(false);
const sessionError = ref("");
const showTeamUpdated = ref(false);
const teamUpdatedMessage = ref("");
const showCreateTeam = ref(false);
const showEditTeam = ref(false);
const showAddPlayerModal = ref(false);
const showSessionAddModal = ref(false);
const teamSearch = ref("");
const rosterSearch = ref("");
const sessionRosterSearch = ref("");
const includeOtherTeams = ref(false);
const showUnassigned = ref(true);
const newPlayerName = ref("");
const newPlayerSkill = ref("Beginner");
const addPlayerError = ref("");

let teamUpdatedTimer = null;

const colorSwatches = [
  "#2f7f73",
  "#4a6fa5",
  "#c27b54",
  "#8f5e90",
  "#2f4858",
  "#d08b5b",
  "#4c9a82",
  "#b45f5f",
  "#3b7ea1",
  "#6b8e23",
  "#c65a82",
  "#8c6d62",
  "#3f6c5c",
  "#a34f3f",
  "#516fa3",
  "#d4a018",
  "#7a8f9a",
  "#b76b2a",
  "#2f5966",
  "#7d5a8f"
];
const skillLevels = ["Beginner", "Intermediate", "Advance", "Elite"];

const selectedTeam = computed(() => teams.value.find((team) => team.id === selectedTeamId.value) || null);
const teamMembers = computed(() => players.value.filter((player) => player.teamId === selectedTeamId.value));
const sessionPlayerStatusMap = computed(
  () => new Map(sessionPlayers.value.map((sp) => [sp.playerId, sp.status]))
);
const activeSessionPlayerIds = computed(
  () => new Set(sessionPlayers.value.filter((sp) => sp.status !== "done").map((sp) => sp.playerId))
);
const filteredTeams = computed(() => {
  if (!teamSearch.value.trim()) return teams.value;
  const term = teamSearch.value.trim().toLowerCase();
  return teams.value.filter((team) => (team.name || "").toLowerCase().includes(term));
});

const rosterHint = computed(() => {
  if (includeOtherTeams.value && showUnassigned.value) {
    return "Showing all players. Selecting moves them from their current team.";
  }
  if (includeOtherTeams.value && !showUnassigned.value) {
    return "Showing current team and other teams. Unassigned players are hidden.";
  }
  if (!includeOtherTeams.value && showUnassigned.value) {
    return "Showing unassigned players and current team members.";
  }
  return "Showing current team members only.";
});

const filteredRosterPlayers = computed(() => {
  const teamId = selectedTeamId.value;
  const availablePlayers = players.value.filter((player) => {
    const currentTeamId = player.teamId || player.team?.id || null;
    if (!showUnassigned.value && !currentTeamId) return false;
    if (!includeOtherTeams.value && currentTeamId && currentTeamId !== teamId) return false;
    return true;
  });
  if (!rosterSearch.value.trim()) return availablePlayers;
  const term = rosterSearch.value.trim().toLowerCase();
  return availablePlayers.filter((player) => {
    const name = `${player.fullName} ${player.nickname || ""}`.toLowerCase();
    return name.includes(term);
  });
});

const filteredSessionMembers = computed(() => {
  if (!sessionRosterSearch.value.trim()) return teamMembers.value;
  const term = sessionRosterSearch.value.trim().toLowerCase();
  return teamMembers.value.filter((player) => {
    const name = `${player.fullName} ${player.nickname || ""}`.toLowerCase();
    return name.includes(term);
  });
});

async function load() {
  listError.value = "";
  try {
    const [teamResult, playerResult] = await Promise.allSettled([api.listTeams(), api.listPlayers()]);
    teams.value = teamResult.status === "fulfilled" ? teamResult.value : [];
    players.value = playerResult.status === "fulfilled" ? playerResult.value : [];
    const exists = teams.value.some((team) => team.id === selectedTeamId.value);
    if (!exists) selectedTeamId.value = "";
    await loadSession();
    await loadSessionPlayers();
    await loadOtherSessionsPlayers();
  } catch (err) {
    listError.value = err.message || "Unable to load teams";
  }
}

async function loadSession() {
  sessionError.value = "";
  try {
    let current = null;
    if (selectedSessionId.value) {
      current = await api.session(selectedSessionId.value);
    } else {
      current = await api.activeSession();
      if (current?.id) setSelectedSessionId(current.id);
    }
    session.value = current;
  } catch (err) {
    session.value = null;
    sessionPlayers.value = [];
    otherSessionPlayers.value = {};
    sessionError.value = err.message || "Unable to load session";
  }
}

async function loadSessionPlayers() {
  if (!session.value?.id) {
    sessionPlayers.value = [];
    return;
  }
  try {
    sessionPlayers.value = await api.sessionPlayers(session.value.id);
  } catch {
    sessionPlayers.value = [];
  }
}

async function loadOtherSessionsPlayers() {
  otherSessionPlayers.value = {};
  if (!session.value?.id) return;
  try {
    const sessions = await api.listSessions("open");
    const otherSessions = (sessions || []).filter((item) => item.id !== session.value.id);
    if (!otherSessions.length) return;
    const results = await Promise.allSettled(otherSessions.map((item) => api.sessionPlayers(item.id)));
    const map = {};
    results.forEach((result, idx) => {
      if (result.status !== "fulfilled") return;
      const sessionItem = otherSessions[idx];
      (result.value || [])
        .filter((sp) => sp.status !== "done")
        .forEach((sp) => {
          if (!map[sp.playerId]) map[sp.playerId] = [];
          map[sp.playerId].push({
            sessionId: sessionItem.id,
            name: sessionItem.name || "Session",
            status: sp.status
          });
        });
    });
    otherSessionPlayers.value = map;
  } catch {
    otherSessionPlayers.value = {};
  }
}

function selectTeam(team) {
  selectedTeamId.value = team.id;
  editTeamName.value = team.name || "";
  editTeamColor.value = team.color || "#2a9d8f";
  memberIds.value = players.value.filter((player) => player.teamId === team.id).map((player) => player.id);
  sessionMemberIds.value = players.value
    .filter((player) => player.teamId === team.id)
    .map((player) => player.id)
    .filter((id) => !isPlayerInSession(id));
  membersError.value = "";
}

async function createTeam() {
  createError.value = "";
  const teamName = newTeamName.value.trim();
  if (!teamName) {
    createError.value = "Team name is required.";
    return;
  }
  try {
    const created = await api.createTeam({
      name: teamName,
      color: newTeamColor.value || null
    });
    newTeamName.value = "";
    await load();
    if (created?.id) {
      const createdTeam = teams.value.find((team) => team.id === created.id);
      if (createdTeam) selectTeam(createdTeam);
    }
    showCreateTeam.value = false;
    triggerTeamUpdatedToast(`${created?.name || teamName} created.`);
  } catch (err) {
    createError.value = err.message || "Unable to create team";
  }
}

function openCreateTeam() {
  createError.value = "";
  showCreateTeam.value = true;
}

function closeCreateTeam() {
  showCreateTeam.value = false;
  createError.value = "";
}

function triggerTeamUpdatedToast(message) {
  teamUpdatedMessage.value = message;
  showTeamUpdated.value = true;
  if (teamUpdatedTimer) clearTimeout(teamUpdatedTimer);
  teamUpdatedTimer = setTimeout(() => {
    showTeamUpdated.value = false;
  }, 2600);
}

function openEditTeam() {
  if (!selectedTeam.value) return;
  editError.value = "";
  editTeamName.value = selectedTeam.value.name || "";
  editTeamColor.value = selectedTeam.value.color || "#2a9d8f";
  showEditTeam.value = true;
}

function closeEditTeam() {
  showEditTeam.value = false;
  editError.value = "";
}

async function confirmEditTeam() {
  await saveTeam();
  if (!editError.value) {
    showEditTeam.value = false;
    triggerTeamUpdatedToast(`${selectedTeam.value?.name || "Team"} updated.`);
  }
}

function openAddPlayerModal() {
  addPlayerError.value = "";
  newPlayerName.value = "";
  newPlayerSkill.value = "Beginner";
  showAddPlayerModal.value = true;
}

function closeAddPlayerModal() {
  showAddPlayerModal.value = false;
  addPlayerError.value = "";
}

async function saveTeam() {
  if (!selectedTeam.value) return;
  editError.value = "";
  try {
    await api.updateTeam(selectedTeam.value.id, {
      name: editTeamName.value.trim(),
      color: editTeamColor.value || null
    });
    await load();
  } catch (err) {
    editError.value = err.message || "Unable to update team";
  }
}

async function saveMembers() {
  if (!selectedTeam.value) return;
  membersError.value = "";
  const teamName = selectedTeam.value.name || "Team";
  try {
    await api.updateTeamMembers(selectedTeam.value.id, { playerIds: memberIds.value.slice() });
    await load();
    triggerTeamUpdatedToast(`Members saved for ${teamName}.`);
  } catch (err) {
    membersError.value = err.message || "Unable to update team members";
  }
}

async function createPlayerFromTeam() {
  addPlayerError.value = "";
  const name = newPlayerName.value.trim();
  if (!name) {
    addPlayerError.value = "Player name is required.";
    return;
  }
  try {
    await api.createPlayer({ fullName: name, skillLevel: newPlayerSkill.value });
    await load();
    showAddPlayerModal.value = false;
    triggerTeamUpdatedToast(`${name} added.`);
  } catch (err) {
    addPlayerError.value = err.message || "Unable to add player";
  }
}

async function checkInTeam() {
  if (!selectedTeam.value) return;
  membersError.value = "";
  if (!session.value || session.value.status !== "open") {
    membersError.value = "Session is not open.";
    return;
  }
  const targetIds = sessionMemberIds.value.filter((id) => !isPlayerInSession(id));
  if (!targetIds.length) {
    membersError.value = sessionMemberIds.value.length
      ? "Selected players are already in session."
      : "Select at least one team member to add.";
    return;
  }
  try {
    for (const playerId of targetIds) {
      await api.checkinPlayer(playerId, { sessionId: session.value.id });
    }
    membersError.value = "";
    const sessionName = session.value?.name || "session";
    triggerTeamUpdatedToast(`Added ${selectedTeam.value.name} to ${sessionName}.`);
    await loadSessionPlayers();
    await loadOtherSessionsPlayers();
  } catch (err) {
    membersError.value = err.message || "Unable to add team to session";
  }
}

function openSessionAddModal() {
  loadSessionPlayers();
  loadOtherSessionsPlayers();
  showSessionAddModal.value = true;
}

function closeSessionAddModal() {
  showSessionAddModal.value = false;
}

async function confirmSessionAdd() {
  await checkInTeam();
  if (!membersError.value) {
    showSessionAddModal.value = false;
  }
}

function selectAllSessionMembers() {
  sessionMemberIds.value = teamMembers.value
    .map((player) => player.id)
    .filter((id) => !isPlayerInSession(id));
}

function clearSessionMembers() {
  sessionMemberIds.value = [];
}

function selectAllRosterMembers() {
  memberIds.value = filteredRosterPlayers.value.map((player) => player.id);
}

function clearRosterMembers() {
  memberIds.value = [];
}

function openDeleteTeam() {
  if (!selectedTeam.value) return;
  showDeleteTeam.value = true;
}

function closeDeleteTeam() {
  showDeleteTeam.value = false;
}

async function confirmDeleteTeam() {
  if (!selectedTeam.value) return;
  try {
    await api.deleteTeam(selectedTeam.value.id);
    showDeleteTeam.value = false;
    selectedTeamId.value = "";
    await load();
  } catch (err) {
    membersError.value = err.message || "Unable to delete team";
  }
}

watch(players, () => {
  if (!selectedTeam.value) return;
  memberIds.value = players.value.filter((player) => player.teamId === selectedTeam.value.id).map((p) => p.id);
  const valid = new Set(players.value.filter((player) => player.teamId === selectedTeam.value.id).map((p) => p.id));
  sessionMemberIds.value = sessionMemberIds.value.filter((id) => valid.has(id) && !isPlayerInSession(id));
});

watch(selectedTeam, (team) => {
  if (!team) return;
  editTeamName.value = team.name || "";
  editTeamColor.value = team.color || "#2a9d8f";
  sessionMemberIds.value = players.value
    .filter((player) => player.teamId === team.id)
    .map((p) => p.id)
    .filter((id) => !isPlayerInSession(id));
});

watch(sessionPlayers, () => {
  if (!selectedTeam.value) return;
  sessionMemberIds.value = sessionMemberIds.value.filter((id) => !isPlayerInSession(id));
});

function sessionStatusByPlayerId(playerId) {
  return sessionPlayerStatusMap.value.get(playerId) || null;
}

function sessionStatusLabel(status) {
  if (status === "present") return "Present";
  if (status === "away") return "Away";
  if (status === "checked_in") return "Checked in";
  return "In session";
}

function isPlayerInSession(playerId) {
  return activeSessionPlayerIds.value.has(playerId);
}

function otherSessionInfo(playerId) {
  return otherSessionPlayers.value[playerId] || [];
}

function otherSessionLabel(playerId) {
  const list = otherSessionInfo(playerId);
  if (!list.length) return "";
  if (list.length === 1) return `In ${list[0].name}`;
  return `In ${list[0].name} +${list.length - 1}`;
}

function otherSessionTitle(playerId) {
  const list = otherSessionInfo(playerId);
  if (!list.length) return "";
  return list
    .map((item) => `${item.name} (${sessionStatusLabel(item.status)})`)
    .join(", ");
}


onMounted(load);

onBeforeUnmount(() => {
  if (teamUpdatedTimer) clearTimeout(teamUpdatedTimer);
});
</script>
