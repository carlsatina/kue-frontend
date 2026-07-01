<template>
  <div class="manage-page">
    <div class="manage-header">
      <div>
        <h1 class="manage-title">Manage Sessions</h1>
        <p class="text-muted">Review your active and past sessions.</p>
      </div>
      <button class="button" type="button" @click="openCreate">+ New Session</button>
    </div>

    <div v-if="error" class="notice danger">{{ error }}</div>

    <div v-if="loading" class="manage-empty">Loading sessions…</div>

    <template v-else>
      <!-- Active -->
      <section class="manage-section">
        <div class="manage-section-head">
          <h2 class="section-title">Active</h2>
          <span class="count-chip">{{ activeSessions.length }}</span>
        </div>
        <div v-if="activeSessions.length === 0" class="manage-empty">
          No active sessions. Create one to get started.
        </div>
        <div v-else class="manage-grid">
          <article
            v-for="s in activeSessions"
            :key="s.id"
            class="session-card"
            :class="{ current: s.id === selectedSessionId && s.status === 'open' }"
          >
            <div class="session-card-top">
              <div class="session-card-titles">
                <h3 class="session-card-name">{{ s.name }}</h3>
                <div class="session-card-meta">{{ formatMeta(s) }}</div>
                <div v-if="formatSessionLocation(s)" class="session-card-line">📍 {{ formatSessionLocation(s) }}</div>
                <div v-if="formatSessionSchedule(s)" class="session-card-line">🕑 {{ formatSessionSchedule(s) }}</div>
              </div>
              <span class="status-pill" :class="s.status">{{ statusLabel(s.status) }}</span>
            </div>

            <div class="session-card-foot">
              <span class="session-card-date">Created {{ formatDate(s.createdAt) }}</span>
              <span v-if="s.id === selectedSessionId && s.status === 'open'" class="current-tag">Current</span>
            </div>

            <div class="session-card-actions">
              <template v-if="s.status === 'open'">
                <button
                  v-if="s.id === selectedSessionId"
                  class="button small"
                  type="button"
                  @click="openEdit(s)"
                >
                  Edit
                </button>
                <button
                  v-else
                  class="button small"
                  type="button"
                  @click="switchTo(s.id)"
                >
                  Switch to
                </button>
                <button class="button small ghost" type="button" :disabled="busyId === s.id" @click="requestClose(s)">
                  Close
                </button>
              </template>
              <template v-else>
                <button class="button small" type="button" :disabled="busyId === s.id" @click="openOne(s)">
                  Open
                </button>
                <button class="button small danger" type="button" :disabled="busyId === s.id" @click="requestDelete(s)">
                  Delete
                </button>
              </template>
            </div>
            <div class="session-card-subactions">
              <button
                v-if="!(s.status === 'open' && s.id === selectedSessionId)"
                class="link-action"
                type="button"
                @click="openEdit(s)"
              >
                Edit
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- Past -->
      <section class="manage-section">
        <div class="manage-section-head">
          <h2 class="section-title">Past</h2>
          <span class="count-chip">{{ pastSessions.length }}</span>
        </div>
        <div v-if="pastSessions.length === 0" class="manage-empty">No past sessions yet.</div>
        <div v-else class="manage-grid">
          <article v-for="s in pastSessions" :key="s.id" class="session-card past">
            <div class="session-card-top">
              <div class="session-card-titles">
                <h3 class="session-card-name">{{ s.name }}</h3>
                <div class="session-card-meta">{{ formatMeta(s) }}</div>
                <div v-if="formatSessionLocation(s)" class="session-card-line">📍 {{ formatSessionLocation(s) }}</div>
                <div v-if="formatSessionSchedule(s)" class="session-card-line">🕑 {{ formatSessionSchedule(s) }}</div>
              </div>
              <span class="status-pill closed">Closed</span>
            </div>

            <div class="session-card-foot">
              <span class="session-card-date">Closed {{ formatDate(s.closedAt || s.createdAt) }}</span>
            </div>

            <div class="session-card-actions">
              <button class="button small ghost" type="button" :disabled="busyId === s.id" @click="openOne(s)">
                Reopen
              </button>
              <button class="button small danger" type="button" :disabled="busyId === s.id" @click="requestDelete(s)">
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>
    </template>

    <!-- Edit session modal -->
    <div v-if="showEdit" class="modal-backdrop" @click.self="closeEdit">
      <div class="modal-card session-create">
        <h3>Edit Session</h3>
        <div class="field">
          <label class="field-label">Session name</label>
          <input class="input" v-model="editName" />
        </div>
        <div class="field">
          <label class="field-label">Location</label>
          <input class="input" v-model="editLocation" placeholder="e.g. Court 1 Sports Hall" />
        </div>
        <div class="field-grid two">
          <div class="field">
            <label class="field-label">Start time</label>
            <input class="input" v-model="editStartsAt" type="datetime-local" />
          </div>
          <div class="field">
            <label class="field-label">End time</label>
            <input class="input" v-model="editEndsAt" type="datetime-local" />
          </div>
        </div>
        <div class="field-grid two">
          <div class="field">
            <label class="field-label">Game type</label>
            <select class="input" v-model="editGameType">
              <option value="doubles">Doubles</option>
              <option value="singles">Singles</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Session mode</label>
            <select class="input" v-model="editMode">
              <option value="usual">Usual</option>
              <option value="tournament">Tournament</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Fee amount</label>
          <input class="input" v-model.number="editFeeAmount" type="number" min="0" />
        </div>
        <label class="radio-row">
          <input type="checkbox" v-model="editRequirePayment" />
          Require payment to join
        </label>
        <div v-if="editRequirePayment" class="field">
          <label class="field-label">Payment deadline</label>
          <input class="input" v-model="editPaymentDeadline" type="datetime-local" />
        </div>
        <div class="field">
          <label class="field-label">Join limits</label>
          <p class="field-hint">Max players allowed to join via the share link. <strong>Regular</strong> = returning players, <strong>New joiner</strong> = first-timers. Set 0 for no limit.</p>
        </div>
        <div class="join-limits-row">
          <div class="field field-inline">
            <label class="field-label">Regular</label>
            <input class="input" type="number" min="0" v-model.number="editRegularLimit" />
          </div>
          <div class="field field-inline">
            <label class="field-label">New joiner</label>
            <input class="input" type="number" min="0" v-model.number="editJoinerLimit" />
          </div>
        </div>
        <div v-if="editError" class="notice danger">{{ editError }}</div>
        <div class="field-grid two create-actions">
          <button class="button ghost" type="button" @click="closeEdit">Cancel</button>
          <button class="button" type="button" :disabled="editSaving" @click="saveEdit">Save</button>
        </div>
      </div>
    </div>

    <!-- Close session confirmation modal -->
    <transition name="confirm-pop">
      <div v-if="showCloseConfirm" class="modal-backdrop" @click.self="cancelClose">
        <div class="modal-card confirm-modal">
          <div class="confirm-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a1 1 0 0 1 1 1v5a1 1 0 0 1-2 0V8a1 1 0 0 1 1-1zm0 9.25a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3z"/></svg>
          </div>
          <h3 class="confirm-title">Close this session?</h3>
          <p class="confirm-text">
            <strong>{{ closeTarget?.name }}</strong> will move to <span class="confirm-emph">Past</span> sessions.
            Players will no longer be able to join, check in, or queue matches.
          </p>
          <div v-if="closeError" class="notice danger">{{ closeError }}</div>
          <div class="confirm-actions">
            <button class="button ghost" type="button" :disabled="closing" @click="cancelClose">Cancel</button>
            <button class="button danger" type="button" :disabled="closing" @click="confirmClose">
              {{ closing ? "Closing…" : "Close session" }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Delete session confirmation modal -->
    <transition name="confirm-pop">
      <div v-if="showDeleteConfirm" class="modal-backdrop" @click.self="cancelDelete">
        <div class="modal-card confirm-modal">
          <div class="confirm-icon danger" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1.07l-.86 12.06A2 2 0 0 1 16.08 21H7.92a2 2 0 0 1-1.99-1.94L5.07 7H4a1 1 0 0 1 0-2h4V4a1 1 0 0 1 1-1zm1 2v0h4V5h-4zm-.5 5a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm5 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z"/></svg>
          </div>
          <h3 class="confirm-title">Delete this session?</h3>
          <p class="confirm-text">
            <strong>{{ deleteTarget?.name }}</strong> and all of its players, matches, and queue history will be
            <span class="confirm-emph">permanently removed</span>. This cannot be undone.
          </p>
          <div v-if="deleteError" class="notice danger">{{ deleteError }}</div>
          <div class="confirm-actions">
            <button class="button ghost" type="button" :disabled="deleting" @click="cancelDelete">Cancel</button>
            <button class="button danger" type="button" :disabled="deleting" @click="confirmDelete">
              {{ deleting ? "Deleting…" : "Delete session" }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api.js";
import { track } from "../utils/analytics.js";
import { selectedSessionId, setSelectedSessionId, setPendingSessionId } from "../state/sessionStore.js";
import { formatSessionSchedule, formatSessionLocation } from "../utils/sessionSchedule.js";

const router = useRouter();
const sessions = ref([]);
const loading = ref(true);
const error = ref("");
const busyId = ref("");

const activeSessions = computed(() => sessions.value.filter((s) => s.status !== "closed"));
const pastSessions = computed(() => sessions.value.filter((s) => s.status === "closed"));

// Edit session modal
const showEdit = ref(false);
const editTarget = ref(null);
const editName = ref("");
const editLocation = ref("");
const editStartsAt = ref("");
const editEndsAt = ref("");
const editGameType = ref("doubles");
const editMode = ref("usual");
const editFeeAmount = ref(0);
const editRequirePayment = ref(false);
const editPaymentDeadline = ref("");
const editRegularLimit = ref(0);
const editJoinerLimit = ref(0);
const editError = ref("");
const editSaving = ref(false);

// Close session confirmation modal
const showCloseConfirm = ref(false);
const closeTarget = ref(null);
const closeError = ref("");
const closing = ref(false);

// Delete session confirmation modal
const showDeleteConfirm = ref(false);
const deleteTarget = ref(null);
const deleteError = ref("");
const deleting = ref(false);

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openEdit(s) {
  editTarget.value = s;
  editError.value = "";
  editName.value = s.name || "";
  editLocation.value = s.location || "";
  editStartsAt.value = toLocalInput(s.startsAt);
  editEndsAt.value = toLocalInput(s.endsAt);
  editGameType.value = s.gameType || "doubles";
  editMode.value = s.mode || "usual";
  editFeeAmount.value = Number(s.feeAmount || 0);
  editRequirePayment.value = Boolean(s.requirePaymentToJoin);
  editPaymentDeadline.value = toLocalInput(s.paymentDeadline);
  editRegularLimit.value = Number(s.regularJoinLimit || 0);
  editJoinerLimit.value = Number(s.newJoinerLimit || 0);
  showEdit.value = true;
}

function closeEdit() {
  showEdit.value = false;
  editTarget.value = null;
  editError.value = "";
}

async function saveEdit() {
  if (!editTarget.value) return;
  editSaving.value = true;
  editError.value = "";
  try {
    await api.updateSession(editTarget.value.id, {
      name: editName.value,
      location: editLocation.value.trim() || null,
      startsAt: editStartsAt.value ? new Date(editStartsAt.value).toISOString() : null,
      endsAt: editEndsAt.value ? new Date(editEndsAt.value).toISOString() : null,
      gameType: editGameType.value,
      mode: editMode.value,
      feeAmount: Number(editFeeAmount.value || 0),
      requirePaymentToJoin: Boolean(editRequirePayment.value),
      paymentDeadline: editPaymentDeadline.value ? new Date(editPaymentDeadline.value).toISOString() : null,
      regularJoinLimit: Math.max(0, Number(editRegularLimit.value) || 0),
      newJoinerLimit: Math.max(0, Number(editJoinerLimit.value) || 0),
    });
    showEdit.value = false;
    editTarget.value = null;
    await load();
    notifyHeader();
  } catch (err) {
    editError.value = err.message || "Unable to update session";
  } finally {
    editSaving.value = false;
  }
}

async function load() {
  error.value = "";
  try {
    const list = await api.listSessions();
    sessions.value = list || [];
  } catch (err) {
    error.value = err.message || "Unable to load sessions";
  } finally {
    loading.value = false;
  }
}

function notifyHeader() {
  document.dispatchEvent(new CustomEvent("sessions:updated"));
}

function switchTo(id) {
  setSelectedSessionId(id);
  router.push("/");
}

async function openOne(s) {
  busyId.value = s.id;
  error.value = "";
  try {
    await api.openSession(s.id);
    track("session-opened");
    setPendingSessionId(s.id);
    await load();
    notifyHeader();
  } catch (err) {
    error.value = err.message || "Unable to open session";
  } finally {
    busyId.value = "";
  }
}

function requestClose(s) {
  closeTarget.value = s;
  closeError.value = "";
  showCloseConfirm.value = true;
}

function cancelClose() {
  if (closing.value) return;
  showCloseConfirm.value = false;
  closeTarget.value = null;
  closeError.value = "";
}

async function confirmClose() {
  const s = closeTarget.value;
  if (!s) return;
  closing.value = true;
  busyId.value = s.id;
  closeError.value = "";
  try {
    await api.closeSession(s.id);
    track("session-closed");
    showCloseConfirm.value = false;
    closeTarget.value = null;
    await load();
    notifyHeader();
  } catch (err) {
    closeError.value = err.message || "Unable to close session";
  } finally {
    closing.value = false;
    busyId.value = "";
  }
}

function requestDelete(s) {
  deleteTarget.value = s;
  deleteError.value = "";
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  if (deleting.value) return;
  showDeleteConfirm.value = false;
  deleteTarget.value = null;
  deleteError.value = "";
}

async function confirmDelete() {
  const s = deleteTarget.value;
  if (!s) return;
  deleting.value = true;
  busyId.value = s.id;
  deleteError.value = "";
  try {
    await api.deleteSession(s.id);
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
    await load();
    notifyHeader();
  } catch (err) {
    deleteError.value = err.message || "Unable to delete session";
  } finally {
    deleting.value = false;
    busyId.value = "";
  }
}

function openCreate() {
  document.dispatchEvent(new CustomEvent("createSession:open"));
}

function statusLabel(status) {
  if (status === "open") return "Active";
  if (status === "draft") return "Draft";
  return "Closed";
}

function formatMeta(s) {
  const parts = [s.mode, s.gameType].filter(Boolean).map(cap);
  const fee = Number(s.feeAmount);
  if (!Number.isNaN(fee) && fee > 0) parts.push(`₱${fee}`);
  return parts.join(" · ");
}

function cap(v) {
  const str = String(v || "");
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

onMounted(load);
</script>

<style scoped>
.manage-page {
  display: grid;
  gap: 24px;
}

.manage-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
/* Keep the New Session action proportional rather than a chunky full-size pill. */
.manage-header .button {
  padding: 10px 16px;
  font-size: 14px;
}
.manage-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.text-muted {
  margin: 4px 0 0;
  color: var(--ink-soft);
}

.notice.danger {
  background: rgba(185, 28, 28, 0.12);
  color: var(--accent-3);
  font-weight: 500;
}

.manage-section {
  display: grid;
  gap: 12px;
}
.manage-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title {
  margin: 0;
}
.count-chip {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-soft);
  background: var(--bg-1);
  border-radius: 999px;
  padding: 2px 9px;
}

.manage-empty {
  padding: 24px;
  text-align: center;
  color: var(--ink-soft);
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

.manage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.session-card {
  display: grid;
  gap: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
}
.session-card.current {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.14), var(--shadow);
}
.session-card.past {
  opacity: 0.92;
}

.session-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.session-card-titles {
  min-width: 0;
}
.session-card-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.session-card-meta {
  margin-top: 3px;
  font-size: 13px;
  color: var(--ink-soft);
}

.session-card-line {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
}

.status-pill {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 9px;
  border-radius: 999px;
  flex-shrink: 0;
}
.status-pill.open {
  color: #047857;
  background: rgba(16, 185, 129, 0.14);
}
.status-pill.draft {
  color: #b45309;
  background: rgba(245, 158, 11, 0.16);
}
.status-pill.closed {
  color: var(--ink-soft);
  background: var(--bg-1);
}

.session-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-soft);
}
.current-tag {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent);
}

.session-card-actions {
  display: flex;
  gap: 8px;
}
.session-card-actions .button.small {
  flex: 1 1 auto;
  padding: 8px 12px;
  font-size: 13px;
}

.session-card-subactions {
  display: flex;
  gap: 16px;
  margin-top: -4px;
}
.link-action {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
}
.link-action:hover {
  text-decoration: underline;
}
.link-action:disabled {
  opacity: 0.5;
  cursor: default;
  text-decoration: none;
}


/* ── Close confirmation modal ────────────────────────────────────── */
.confirm-modal {
  max-width: 380px;
  text-align: center;
  display: grid;
  gap: 12px;
  justify-items: center;
}

.confirm-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #b45309;
  background: rgba(245, 158, 11, 0.16);
}
.confirm-icon.danger {
  color: var(--accent-3, #b91c1c);
  background: rgba(185, 28, 28, 0.12);
}
.confirm-icon svg {
  width: 30px;
  height: 30px;
}

.confirm-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: var(--ink);
}

.confirm-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-soft);
}
.confirm-text strong {
  color: var(--ink);
}
.confirm-emph {
  font-weight: 600;
  color: var(--ink);
}

.confirm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  margin-top: 4px;
}

/* Pop-in transition */
.confirm-pop-enter-active,
.confirm-pop-leave-active {
  transition: opacity 0.18s ease;
}
.confirm-pop-enter-from,
.confirm-pop-leave-to {
  opacity: 0;
}
.confirm-pop-enter-active .confirm-modal,
.confirm-pop-leave-active .confirm-modal {
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.confirm-pop-enter-from .confirm-modal,
.confirm-pop-leave-to .confirm-modal {
  transform: scale(0.94) translateY(8px);
}
</style>
