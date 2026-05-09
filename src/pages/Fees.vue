<template>
  <div>
  <div class="fees-page">
    <!-- Page header -->
    <div class="fees-header">
      <div>
        <h1 class="fees-title">Fees</h1>
        <p class="text-muted" v-if="session">{{ session.name }}</p>
        <p class="text-muted" v-else>Open a session to manage fees.</p>
      </div>
      <div v-if="session" class="fees-header-right">
        <div class="fees-summary-chips">
          <span class="info-chip">{{ balances.length }} players</span>
          <span class="info-chip outstanding" v-if="totalDue > 0">{{ formatAmount(totalDue) }} outstanding</span>
          <span class="info-chip paid" v-else-if="balances.length > 0">All paid</span>
          <span class="info-chip pending" v-if="pendingCount > 0">{{ pendingCount }} pending</span>
        </div>
        <button
          class="button ghost button-compact"
          :class="{ copied: linkCopied }"
          @click="shareSessionFeeLink"
        >{{ linkCopied ? 'Link Copied!' : 'Share Fee Link' }}</button>
        <button
          v-if="session.status === 'open'"
          class="button ghost button-compact"
          @click="openEditFee"
        >Edit Fee</button>
      </div>
    </div>

    <div v-if="error" class="notice">{{ error }}</div>

    <!-- Empty state -->
    <div v-if="!session && !error" class="empty-state">
      No active session. Start one from the home screen.
    </div>
    <div v-else-if="balances.length === 0 && session" class="empty-state">
      No players with fees yet.
    </div>

    <!-- Balance list -->
    <div v-else class="balance-list">
      <div
        v-for="b in balances"
        :key="b.playerId"
        class="balance-row"
        :class="{ 'is-paid': b.remaining <= 0 }"
      >
        <div class="balance-info">
          <span class="balance-name">{{ b.player.nickname || b.player.fullName }}</span>
          <span class="balance-due">Due: {{ b.due }}</span>
        </div>
        <div class="balance-actions">
          <!-- Pending proof from player -->
          <button
            v-if="b.pendingPayment"
            class="pill-button pending-proof"
            @click="openPendingModal(b)"
          >Proof Pending</button>
          <!-- Rejected proof -->
          <button
            v-else-if="b.rejectedPayment && b.remaining > 0"
            class="pill-button rejected-proof"
            @click="openPendingModal(b, true)"
          >Rejected</button>
          <!-- Paid: show proof link if available -->
          <button
            v-else-if="b.remaining <= 0 && b.proofImageUrl"
            class="pill-button proof"
            @click="viewProof(b.proofImageUrl)"
          >View Proof</button>
          <!-- Outstanding or paid (no proof) -->
          <button
            v-else
            class="pill-button"
            :class="b.remaining > 0 ? 'warn' : 'paid'"
            @click="openPayment(b)"
            :disabled="b.remaining <= 0"
          >
            {{
              b.remaining > 0
                ? 'Set Paid'
                : b.method
                ? `Paid via ${formatMethod(b.method)}`
                : 'Paid'
            }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit fee modal -->
  <div v-if="showEditFee" class="modal-backdrop">
    <div class="modal-card">
      <h3>Edit Session Fee</h3>
      <div class="subtitle">{{ session?.name }}</div>
      <div class="field">
        <label class="field-label">Fee amount</label>
        <input class="input" v-model.number="editFeeAmount" type="number" min="0" />
      </div>
      <div v-if="editFeeError" class="notice">{{ editFeeError }}</div>
      <div class="grid two">
        <button class="button" @click="saveEditFee">Save</button>
        <button class="button ghost" @click="closeEditFee">Cancel</button>
      </div>
    </div>
  </div>

  <!-- Record payment modal (admin) -->
  <div v-if="showPayment" class="modal-backdrop">
    <div class="modal-card">
      <h3>Record Payment</h3>
      <div class="subtitle">{{ paymentTarget?.player?.nickname || paymentTarget?.player?.fullName }}</div>
      <div class="subtitle">Remaining: {{ paymentTarget?.remaining }}</div>

      <div class="proof-attach-area">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden-file-input"
          @change="onFileChange"
        />
        <div v-if="proofPreview" class="proof-preview-wrap">
          <img :src="proofPreview" class="proof-preview-img" />
          <button class="proof-remove-btn" @click="removeProof">Remove</button>
        </div>
        <button v-else class="button ghost button-compact attach-btn" @click="fileInput.click()">
          Attach Proof
        </button>
      </div>

      <div class="grid two">
        <button class="button" @click="record('cash')">Cash</button>
        <button class="button secondary" @click="record('e-wallet')">E‑wallet</button>
      </div>
      <button class="button ghost" @click="closePayment">Cancel</button>
    </div>
  </div>

  <!-- Pending / rejected proof review modal (admin) -->
  <div v-if="showPendingModal" class="modal-backdrop">
    <div class="modal-card">
      <h3>{{ viewingRejected ? 'Rejected Proof' : 'Review Proof' }}</h3>
      <div class="subtitle">{{ pendingTarget?.player?.nickname || pendingTarget?.player?.fullName }}</div>
      <div class="subtitle">Method: {{ formatMethod(activeProof?.method) }}</div>
      <div class="subtitle">Submitted: {{ formatDate(activeProof?.createdAt) }}</div>

      <div v-if="activeProof?.proofImageUrl" class="proof-preview-wrap" style="margin: 12px 0">
        <img
          :src="absoluteUrl(activeProof.proofImageUrl)"
          class="proof-preview-img"
          style="cursor:pointer"
          @click="viewProof(activeProof.proofImageUrl)"
        />
      </div>
      <div v-else class="text-muted" style="margin: 12px 0; font-size:13px">No image attached.</div>

      <div v-if="pendingError" class="notice">{{ pendingError }}</div>

      <template v-if="!viewingRejected">
        <div class="grid two">
          <button class="button" @click="confirmPayment">Confirm</button>
          <button class="button btn-reject" @click="rejectPayment">Reject</button>
        </div>
      </template>
      <button class="button ghost" @click="closePendingModal">Close</button>
    </div>
  </div>

  <!-- Proof image lightbox -->
  <div v-if="proofLightbox" class="modal-backdrop" @click.self="closeLightbox">
    <div class="proof-lightbox">
      <div class="proof-lightbox-viewport">
        <img
          :src="proofLightboxUrl"
          class="proof-lightbox-img"
          :style="{ transform: `scale(${imgScale})`, transition: isPinching ? 'none' : 'transform 0.2s ease' }"
          @touchstart.prevent="onPinchStart"
          @touchmove.prevent="onPinchMove"
          @touchend="onPinchEnd"
          @dblclick="imgScale = 1"
        />
      </div>
      <div class="proof-lightbox-hint">Pinch to zoom · Double-tap to reset</div>
      <button class="button ghost button-compact" @click="closeLightbox">Close</button>
    </div>
  </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { api } from "../api.js";
import { selectedSessionId, setSelectedSessionId } from "../state/sessionStore.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const BASE_URL = API_URL.replace(/\/api$/, "");
const FRONTEND_BASE = window.location.origin;

const balances = ref([]);
const session = ref(null);
const error = ref("");
const showPayment = ref(false);
const paymentTarget = ref(null);
const showEditFee = ref(false);
const editFeeAmount = ref(0);
const editFeeError = ref("");
const proofFile = ref(null);
const proofPreview = ref(null);
const fileInput = ref(null);
const proofLightbox = ref(null);
const proofLightboxUrl = ref(null);
const imgScale = ref(1);
const isPinching = ref(false);
let pinchStartDist = 0;
let pinchStartScale = 1;
const linkCopied = ref(false);

// Pending modal
const showPendingModal = ref(false);
const pendingTarget = ref(null);
const pendingError = ref("");
const viewingRejected = ref(false);
const activeProof = computed(() =>
  viewingRejected.value ? pendingTarget.value?.rejectedPayment : pendingTarget.value?.pendingPayment
);

const totalDue = computed(() =>
  balances.value.reduce((sum, b) => sum + Number(b.remaining || 0), 0)
);
const pendingCount = computed(() =>
  balances.value.filter((b) => b.pendingPayment).length
);

function absoluteUrl(url) {
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

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
      balances.value = [];
      return;
    }
    session.value = currentSession;
    const data = await api.balances(session.value.id);
    balances.value = data.balances || [];
  } catch (err) {
    error.value = err.message || "No active session";
    balances.value = [];
  }
}

// ── Share session fee link ───────────────────────────────────────────────────

async function shareSessionFeeLink() {
  if (!session.value) return;
  try {
    const link = await api.createSessionShareLink(session.value.id);
    const url = `${FRONTEND_BASE}/fees/${link.token}`;
    await navigator.clipboard.writeText(url);
    linkCopied.value = true;
    setTimeout(() => { linkCopied.value = false; }, 2500);
  } catch {
    /* clipboard denied */
  }
}

// ── Record payment (admin) ───────────────────────────────────────────────────

function openPayment(balance) {
  if (!session.value || balance.remaining <= 0) return;
  paymentTarget.value = balance;
  proofFile.value = null;
  proofPreview.value = null;
  showPayment.value = true;
}

function closePayment() {
  showPayment.value = false;
  paymentTarget.value = null;
  proofFile.value = null;
  proofPreview.value = null;
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    alert("Photo must be under 10 MB.");
    e.target.value = "";
    return;
  }
  proofFile.value = file;
  proofPreview.value = URL.createObjectURL(file);
}

function removeProof() {
  proofFile.value = null;
  proofPreview.value = null;
  if (fileInput.value) fileInput.value.value = "";
}

async function record(method) {
  if (!session.value || !paymentTarget.value) return;
  await api.recordPayment(
    session.value.id,
    {
      playerId: paymentTarget.value.playerId,
      amount: Number(paymentTarget.value.remaining),
      method
    },
    proofFile.value || undefined
  );
  closePayment();
  await load();
}

// ── Pending proof confirm/reject ─────────────────────────────────────────────

function openPendingModal(balance, isRejected = false) {
  pendingTarget.value = balance;
  pendingError.value = "";
  viewingRejected.value = isRejected;
  showPendingModal.value = true;
}

function closePendingModal() {
  showPendingModal.value = false;
  pendingTarget.value = null;
  pendingError.value = "";
  viewingRejected.value = false;
}

async function confirmPayment() {
  if (!session.value || !pendingTarget.value?.pendingPayment) return;
  pendingError.value = "";
  try {
    await api.confirmPayment(session.value.id, pendingTarget.value.pendingPayment.id);
    closePendingModal();
    await load();
  } catch (err) {
    pendingError.value = err.message || "Failed to confirm";
  }
}

async function rejectPayment() {
  if (!session.value || !pendingTarget.value?.pendingPayment) return;
  pendingError.value = "";
  try {
    await api.rejectPayment(session.value.id, pendingTarget.value.pendingPayment.id);
    closePendingModal();
    await load();
  } catch (err) {
    pendingError.value = err.message || "Failed to reject";
  }
}

// ── Edit fee ─────────────────────────────────────────────────────────────────

function openEditFee() {
  if (!session.value || session.value.status !== "open") return;
  editFeeAmount.value = Number(session.value.feeAmount || 0);
  editFeeError.value = "";
  showEditFee.value = true;
}

function closeEditFee() {
  showEditFee.value = false;
  editFeeError.value = "";
}

async function saveEditFee() {
  if (!session.value || session.value.status !== "open") return;
  editFeeError.value = "";
  try {
    await api.updateSessionFee(session.value.id, {
      feeMode: "flat",
      feeAmount: Number(editFeeAmount.value || 0)
    });
    showEditFee.value = false;
    await load();
  } catch (err) {
    editFeeError.value = err.message || "Unable to update fee";
  }
}

// ── Proof lightbox ────────────────────────────────────────────────────────────

function viewProof(url) {
  proofLightboxUrl.value = absoluteUrl(url);
  imgScale.value = 1;
  proofLightbox.value = true;
}

function closeLightbox() {
  proofLightbox.value = null;
  imgScale.value = 1;
}

function pinchDist(touches) {
  return Math.hypot(
    touches[1].clientX - touches[0].clientX,
    touches[1].clientY - touches[0].clientY
  );
}

function onPinchStart(e) {
  if (e.touches.length === 2) {
    isPinching.value = true;
    pinchStartDist = pinchDist(e.touches);
    pinchStartScale = imgScale.value;
  }
}

function onPinchMove(e) {
  if (e.touches.length === 2) {
    const ratio = pinchDist(e.touches) / pinchStartDist;
    imgScale.value = Math.min(Math.max(pinchStartScale * ratio, 1), 5);
  }
}

function onPinchEnd() {
  isPinching.value = false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMethod(method) {
  if (!method) return "";
  const map = { cash: "Cash", "e-wallet": "E‑wallet", gcash: "GCash", maya: "Maya", "bank-transfer": "Bank Transfer", online: "Online" };
  return map[method.toLowerCase()] ?? method;
}

function formatAmount(value) {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString();
}

onMounted(load);
watch(selectedSessionId, load);
</script>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────────── */
.fees-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ──────────────────────────────────────────────────────── */
.fees-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.fees-title {
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

.fees-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

@media (max-width: 480px) {
  .fees-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .fees-header-right {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
  }

  .fees-header-right .button {
    flex: 1 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.fees-summary-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.info-chip.outstanding {
  background: rgba(180, 95, 95, 0.1);
  color: #b45f5f;
}

.info-chip.paid {
  background: rgba(0, 137, 123, 0.1);
  color: #00897b;
}

.info-chip.pending {
  background: rgba(245, 158, 11, 0.12);
  color: #92400e;
}

.button.copied {
  background: rgba(0, 137, 123, 0.1);
  color: #00897b;
  border-color: rgba(0, 137, 123, 0.3);
}

/* ── Empty state ─────────────────────────────────────────────────── */
.empty-state {
  font-size: 15px;
  color: var(--ink-soft);
  padding: 24px 0;
}

/* ── Balance list ────────────────────────────────────────────────── */
.balance-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.balance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}

.balance-row:last-child { border-bottom: none; }
.balance-row.is-paid { background: #f8fffe; }

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.balance-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.balance-due {
  font-size: 13px;
  color: var(--ink-soft);
}

.balance-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Pill variants ───────────────────────────────────────────────── */
.pill-button.proof {
  background: rgba(21, 101, 192, 0.08);
  color: var(--accent);
  border: 1px solid rgba(21, 101, 192, 0.2);
}

.pill-button.pending-proof {
  background: rgba(245, 158, 11, 0.12);
  color: #92400e;
  border: 1px solid rgba(245, 158, 11, 0.3);
  animation: pulse-pending 2s ease-in-out infinite;
}

.pill-button.rejected-proof {
  background: rgba(180, 95, 95, 0.1);
  color: #b45f5f;
  border: 1px solid rgba(180, 95, 95, 0.25);
}

@keyframes pulse-pending {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}

.btn-reject {
  background: #b45f5f;
  color: #fff;
}


/* ── Proof attach area in admin modal ────────────────────────────── */
.hidden-file-input { display: none; }

.proof-attach-area { margin: 4px 0 12px; }

.attach-btn { width: 100%; }

.proof-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.proof-preview-img {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.proof-remove-btn {
  font-size: 12px;
  color: #b45f5f;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

/* ── Proof lightbox ──────────────────────────────────────────────── */
.proof-lightbox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: var(--radius-sm);
  padding: 16px;
  max-width: 92vw;
  width: 92vw;
}

.proof-lightbox-viewport {
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  min-height: 200px;
  max-height: 70vh;
}

.proof-lightbox-img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  display: block;
  transform-origin: center center;
  user-select: none;
  -webkit-user-drag: none;
}

.proof-lightbox-hint {
  font-size: 11px;
  color: var(--ink-soft);
}
</style>
