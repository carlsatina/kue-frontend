<template>
  <div class="group-detail-page">
    <div class="detail-header">
      <button class="back-button" type="button" @click="$router.push('/groups')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 19l-7-7 7-7"/></svg>
        Groups
      </button>
      <div class="detail-header-actions">
        <button class="button button-compact" @click="goToSession">Add to session</button>
        <button class="button ghost button-compact" @click="openEditGroup">Edit</button>
        <button class="button ghost danger button-compact" @click="showDeleteGroup = true">Delete</button>
      </div>
    </div>

    <template v-if="!loading && group">
      <div class="group-identity">
        <h1 class="group-name">{{ group.name }}</h1>
        <p v-if="group.description" class="text-muted">{{ group.description }}</p>
        <p class="text-muted">{{ members.length }} member{{ members.length === 1 ? '' : 's' }}</p>
      </div>

      <!-- Roster -->
      <div class="detail-section">
        <div class="section-header">
          <h2 class="section-title">
            Roster
            <span class="section-count">{{ members.length }}</span>
          </h2>
          <button class="button ghost button-compact" @click="openAddPlayerModal">+ New Player</button>
        </div>


        <p v-if="members.length === 0" class="empty-hint">
          No members yet. Add a new player, or share the invite link so they add
          themselves.
        </p>
        <div v-else class="member-list">
          <div v-for="member in members" :key="member.id" class="member-row">
            <div class="member-info">
              <span class="member-name">{{ member.player.nickname || member.player.fullName }}</span>
              <span class="member-meta">
                <span v-if="member.role !== 'member'" class="member-role">{{ roleLabel(member.role) }}</span>
                <span v-if="inSession(member.playerId)" class="in-session-tag">
                  {{ statusLabel(sessionStatusFor(member.playerId)) }}
                </span>
                <span v-else-if="member.player.nickname" class="member-fullname">{{ member.player.fullName }}</span>
              </span>
            </div>
            <button class="remove-member-btn" title="Remove from group" @click="removeMember(member)">
              <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div v-if="membersError" class="notice">{{ membersError }}</div>
      </div>

      <!-- Invite link -->
      <div class="detail-section">
        <button class="button button-compact" @click="toggleInvite">
          {{ showInvite ? 'Hide invite link' : 'Invite link' }}
        </button>

        <div v-if="showInvite && inviteUrl" class="invite-panel">
          <p class="text-muted">
            Anyone with this link can add themselves to the group's roster.
          </p>
          <div class="invite-row">
            <input class="input" :value="inviteUrl" readonly @focus="$event.target.select()" />
            <button class="button button-compact" @click="copyInvite">{{ copied ? 'Copied' : 'Copy' }}</button>
          </div>
          <div class="invite-actions">
            <button class="button ghost button-compact" @click="createInviteLink">Regenerate</button>
            <button class="button ghost danger button-compact" @click="revokeInviteLink">Revoke</button>
          </div>
        </div>

        <div v-if="inviteError" class="notice">{{ inviteError }}</div>
      </div>
    </template>

    <p v-if="!loading && !group" class="empty-hint">Group not found.</p>

    <div v-if="showToast" class="teams-toast">{{ toastMessage }}</div>

    <div v-if="showAddPlayerModal" class="modal-backdrop">
      <div class="modal-card">
        <h3>New player</h3>
        <p class="text-muted" style="margin: 0 0 12px">
          Creates the player on your workspace roster and adds them to {{ group?.name }}.
        </p>
        <div class="field">
          <label class="field-label">Name</label>
          <input ref="newPlayerNameInput" class="input" v-model="newPlayerName" placeholder="Player name" />
        </div>
        <div class="field">
          <label class="field-label">Nickname <span class="field-hint">optional</span></label>
          <input class="input" v-model="newPlayerNickname" placeholder="What everyone calls them" />
        </div>
        <div class="field">
          <label class="field-label">Mobile number <span class="field-hint">optional</span></label>
          <input class="input" v-model="newPlayerContact" placeholder="09XX XXX XXXX" inputmode="tel" />
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
          <button class="button ghost" @click="showAddPlayerModal = false">Cancel</button>
          <button class="button" :disabled="creatingPlayer" @click="createPlayerInGroup">
            {{ creatingPlayer ? 'Adding…' : 'Add Player' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showEditGroup" class="modal-backdrop">
      <div class="modal-card">
        <h3>Edit group</h3>
        <div class="field">
          <label class="field-label">Name</label>
          <input ref="editNameInput" class="input" v-model="editName" placeholder="Group name" />
        </div>
        <div class="field">
          <label class="field-label">Description <span class="field-hint">optional</span></label>
          <input class="input" v-model="editDescription" placeholder="Who plays in this group?" />
        </div>
        <div v-if="editError" class="notice">{{ editError }}</div>
        <div class="grid two">
          <button class="button ghost" @click="showEditGroup = false">Cancel</button>
          <button class="button" @click="saveGroup">Save</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteGroup" class="modal-backdrop">
      <div class="modal-card">
        <h3>Delete group</h3>
        <div class="subtitle">
          Delete {{ group?.name || 'this group' }}? Players stay on the workspace roster — only the
          group and its membership list go away.
        </div>
        <div class="grid two">
          <button class="button ghost" @click="showDeleteGroup = false">Cancel</button>
          <button class="button danger" @click="deleteGroup">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api.js";
import { selectedSessionId } from "../state/sessionStore.js";

const route = useRoute();
const router = useRouter();
const groupId = route.params.id;

const group = ref(null);
const members = ref([]);
const inviteLink = ref(null);
const appBaseUrl = ref("");
const loading = ref(true);

const membersError = ref("");

const skillLevels = ["Beginner", "Intermediate", "Advance", "Elite"];
const showAddPlayerModal = ref(false);
const newPlayerNameInput = ref(null);
const newPlayerName = ref("");
const newPlayerNickname = ref("");
const newPlayerContact = ref("");
const newPlayerSkill = ref("Beginner");
const creatingPlayer = ref(false);
const addPlayerError = ref("");

// Statuses for the session currently selected in the header, so the roster can
// show who's already playing tonight.
const sessionPlayers = ref([]);

const showEditGroup = ref(false);
const editNameInput = ref(null);
const editName = ref("");
const editDescription = ref("");
const editError = ref("");
const showDeleteGroup = ref(false);

const inviteError = ref("");
const copied = ref(false);
const showInvite = ref(false);

const showToast = ref(false);
const toastMessage = ref("");
let toastTimer = null;

const inviteUrl = computed(() => {
  if (!inviteLink.value) return "";
  const base = appBaseUrl.value || window.location.origin;
  return `${base}/g/${inviteLink.value.token}`;
});

// Indexed once per change instead of scanned per row: the roster template asks
// about every member, so a linear find() here is O(members x session players)
// on every render.
const sessionStatusByPlayer = computed(
  () => new Map(sessionPlayers.value.map((sp) => [sp.playerId, sp.status]))
);

function sessionStatusFor(playerId) {
  return sessionStatusByPlayer.value.get(playerId) || null;
}

function inSession(playerId) {
  const status = sessionStatusFor(playerId);
  return Boolean(status) && status !== "done";
}

function statusLabel(status) {
  if (status === "pending_payment") return "Awaiting payment";
  if (status === "waitlisted") return "Waitlisted";
  if (status === "checked_in") return "Checked in";
  if (status === "present") return "Present";
  if (status === "away") return "Away";
  return "In session";
}

function triggerToast(message) {
  toastMessage.value = message;
  showToast.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    showToast.value = false;
  }, 2800);
}

async function load() {
  loading.value = true;
  try {
    const data = await api.group(groupId);
    group.value = data;
    members.value = data.members || [];
    inviteLink.value = (data.inviteLinks || [])[0] || null;
    appBaseUrl.value = data.appBaseUrl || "";
  } catch (err) {
    group.value = null;
    membersError.value = err.message || "Unable to load group";
  } finally {
    loading.value = false;
  }
}

async function loadSupporting() {
  if (!selectedSessionId.value) return;
  try {
    sessionPlayers.value = await api.sessionPlayers(selectedSessionId.value);
  } catch {
    sessionPlayers.value = [];
  }
}

// Adding to a session happens on the Players page, where the session is already
// in context. Hand off with the group preselected so it's still one trip.
function goToSession() {
  router.push({ path: "/players", query: { group: groupId } });
}

function openAddPlayerModal() {
  addPlayerError.value = "";
  newPlayerName.value = "";
  newPlayerNickname.value = "";
  newPlayerContact.value = "";
  newPlayerSkill.value = "Beginner";
  showAddPlayerModal.value = true;
  // Wait for the modal to render before the field exists to focus.
  nextTick(() => newPlayerNameInput.value?.focus());
}

// Create the player on the workspace roster, then put them in this group — the
// two-step the roster search can't do because the player doesn't exist yet.
async function createPlayerInGroup() {
  addPlayerError.value = "";
  const name = newPlayerName.value.trim();
  if (!name) {
    addPlayerError.value = "Player name is required.";
    return;
  }
  creatingPlayer.value = true;
  try {
    const created = await api.createPlayer({
      fullName: name,
      nickname: newPlayerNickname.value.trim() || undefined,
      contact: newPlayerContact.value.trim() || undefined,
      skillLevel: newPlayerSkill.value
    });
    const updated = await api.addGroupMembers(groupId, { playerIds: [created.id] });
    members.value = updated.members || [];
    showAddPlayerModal.value = false;
    triggerToast(`${created.nickname || created.fullName} added`);
  } catch (err) {
    addPlayerError.value = err.message || "Unable to add player";
  } finally {
    creatingPlayer.value = false;
  }
}

async function removeMember(member) {
  membersError.value = "";
  try {
    await api.removeGroupMember(groupId, member.playerId);
    members.value = members.value.filter((m) => m.id !== member.id);
    triggerToast(`${member.player.nickname || member.player.fullName} removed`);
  } catch (err) {
    membersError.value = err.message || "Unable to remove member";
  }
}

function roleLabel(role) {
  return role === "owner" ? "Owner" : role === "manager" ? "Manager" : "Member";
}

function openEditGroup() {
  editError.value = "";
  editName.value = group.value?.name || "";
  editDescription.value = group.value?.description || "";
  showEditGroup.value = true;
  // Wait for the modal to render before the field exists to focus.
  nextTick(() => editNameInput.value?.focus());
}

async function saveGroup() {
  editError.value = "";
  const name = editName.value.trim();
  if (!name) {
    editError.value = "Group name is required.";
    return;
  }
  try {
    const updated = await api.updateGroup(groupId, {
      name,
      description: editDescription.value.trim() || null
    });
    group.value = { ...group.value, ...updated };
    showEditGroup.value = false;
    triggerToast("Group updated");
  } catch (err) {
    editError.value = err.message || "Unable to update group";
  }
}

async function deleteGroup() {
  try {
    await api.deleteGroup(groupId);
    router.push("/groups");
  } catch (err) {
    showDeleteGroup.value = false;
    membersError.value = err.message || "Unable to delete group";
  }
}

// One button does both jobs: reveal the link, and mint one the first time
// there isn't one yet.
async function toggleInvite() {
  if (showInvite.value) {
    showInvite.value = false;
    return;
  }
  showInvite.value = true;
  if (!inviteLink.value) await createInviteLink();
}

async function createInviteLink() {
  inviteError.value = "";
  try {
    const link = await api.createGroupInviteLink(groupId);
    inviteLink.value = link;
    appBaseUrl.value = link.appBaseUrl || appBaseUrl.value;
    triggerToast("Invite link ready");
  } catch (err) {
    inviteError.value = err.message || "Unable to create invite link";
  }
}

async function revokeInviteLink() {
  if (!inviteLink.value) return;
  inviteError.value = "";
  try {
    await api.revokeGroupInviteLink(inviteLink.value.id);
    inviteLink.value = null;
    showInvite.value = false;
    triggerToast("Invite link revoked");
  } catch (err) {
    inviteError.value = err.message || "Unable to revoke invite link";
  }
}

async function copyInvite() {
  try {
    await navigator.clipboard.writeText(inviteUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch {
    inviteError.value = "Copy failed — select the link and copy it manually.";
  }
}

onMounted(async () => {
  await load();
  await loadSupporting();
});

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped>
.group-detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  /* Stays put while the roster scrolls, parked under the sticky app header.
     --header-h is measured in App.vue; the fallback is the mobile height for
     the frame before the first measurement lands. */
  position: sticky;
  top: var(--header-h, 69px);
  z-index: 40;
  /* Opaque, and bled into the shell's side padding so member rows don't show
     through the gutters as they pass underneath. */
  background: var(--bg-0);
  margin: 0 -16px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  /* On a narrow phone the actions drop to their own line rather than
     squashing the back button. */
  flex-wrap: wrap;
}

@media (min-width: 880px) {
  .detail-header {
    margin: 0 -24px;
    padding: 10px 24px;
  }
}

.detail-header-actions {
  display: flex;
  gap: 8px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-soft);
  cursor: pointer;
}

.back-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.group-name {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 4px;
  color: var(--ink);
}

.text-muted {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 2px 0 0;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}



.section-title {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  color: var(--ink);
}

.section-count {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-soft);
  margin-left: 6px;
}

.empty-hint {
  font-size: 15px;
  color: var(--ink-soft);
  margin: 0;
  padding: 8px 0;
}

/* ── Roster ──────────────────────────────────────────────────────── */







/* Two columns so a long roster stays scannable without a long scroll. */
.member-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 2px;
  min-width: 0;
  /* Divider on top, so the first row of each column stays clean regardless of
     how the roster count falls across the two columns. */
  border-top: 1px solid var(--border);
}

.member-row:nth-child(1),
.member-row:nth-child(2) {
  border-top: none;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 16px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.member-fullname,
.in-session-tag,
.member-role {
  font-size: 13px;
  color: var(--ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-role {
  flex-shrink: 0;
}

.in-session-tag {
  flex-shrink: 0;
}

.remove-member-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.remove-member-btn svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--ink-soft);
  stroke-width: 2;
  stroke-linecap: round;
}

/* ── Invite link ─────────────────────────────────────────────────── */
.invite-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.invite-panel .text-muted {
  margin: 0;
}

.invite-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.invite-row .input {
  flex: 1;
  min-width: 0;
  font-size: 14px;
}

.invite-actions {
  display: flex;
  gap: 8px;
}
</style>
