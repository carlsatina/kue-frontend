<template>
  <div class="pf-wrap">
    <div class="pf-card">
      <div v-if="loading" class="pf-loading">Loading…</div>
      <div v-else-if="error" class="notice">{{ error }}</div>
      <template v-else>
        <!-- Header -->
        <div class="pf-header">
          <button
            class="pf-refresh-btn"
            type="button"
            :class="{ spinning: refreshing }"
            :disabled="refreshing"
            aria-label="Refresh"
            @click="refresh"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
          <div class="pf-session">{{ data.session.name }}</div>
          <h2 class="pf-title">Session Fees</h2>
          <div class="pf-chips">
            <span class="pf-chip outstanding" v-if="outstandingCount > 0">{{ outstandingCount }} outstanding</span>
            <span class="pf-chip waitlisted" v-if="waitlistedCount > 0">{{ waitlistedCount }} waitlisted</span>
            <span class="pf-chip full" v-if="fullCount > 0">{{ fullCount }} session full</span>
            <span class="pf-chip pending" v-if="pendingCount > 0">{{ pendingCount }} pending review</span>
            <span class="pf-chip paid" v-if="paidCount > 0">{{ paidCount }} paid</span>
          </div>
        </div>

        <!-- Payment-required notice -->
        <div
          v-if="data.session.requirePaymentToJoin"
          class="pf-gate-banner"
          :class="{ passed: data.session.deadlinePassed }"
        >
          <span class="pf-gate-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a1 1 0 0 1 1 1v5a1 1 0 0 1-2 0V8a1 1 0 0 1 1-1zm0 9.25a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3z"/></svg>
          </span>
          <div class="pf-gate-text">
            <template v-if="data.session.deadlinePassed">
              <strong>The payment deadline has passed.</strong>
              <span>Unpaid slots have been released to the waitlist. You can still submit payment, but a spot is only confirmed if one is open.</span>
              <span v-if="data.session.paymentDeadline" class="pf-gate-deadline">
                Deadline was {{ formatDate(data.session.paymentDeadline) }}.
              </span>
            </template>
            <template v-else>
              <strong>Payment is required to join this session.</strong>
              <span>Your slot is confirmed only after your payment is approved.</span>
              <span v-if="data.session.paymentDeadline" class="pf-gate-deadline">
                Pay before {{ formatDate(data.session.paymentDeadline) }}.
              </span>
            </template>
          </div>
        </div>

        <p class="pf-hint">Tap your name below to submit proof of online payment.</p>

        <!-- Player list -->
        <div class="pf-list">
          <div
            v-for="b in data.balances"
            :key="b.playerId"
            class="pf-row"
            :class="[rowClass(b), { 'row-locked': isLocked(b) }]"
            @click="onRowClick(b)"
          >
            <div class="pf-row-main">
              <div class="pf-player-info">
                <span class="pf-player-name">{{ b.player.nickname || b.player.fullName }}</span>
                <span class="pf-player-due" v-if="dueLabel(b)">{{ dueLabel(b) }}</span>
              </div>
              <div class="pf-status-badge" :class="badgeClass(b)">
                {{ badgeLabel(b) }}
              </div>
            </div>
            <div v-if="b.rejectedPayment && !b.pendingPayment && b.remaining > 0" class="pf-rejected-notice">
              Proof rejected — tap to resubmit
            </div>
          </div>
        </div>

      </template>
    </div>

    <!-- Upload proof modal -->
    <div v-if="selected" class="pf-backdrop">
      <div class="pf-modal">
        <h3 class="pf-modal-title">{{ selected?.rejectedPayment ? 'Resubmit Payment Proof' : 'Submit Payment Proof' }}</h3>
        <div class="pf-modal-sub">{{ selected.player.nickname || selected.player.fullName }}</div>
        <div class="pf-modal-amount">Amount due: {{ selected.remaining }}</div>

        <div class="pf-field">
          <label class="pf-label">Payment method</label>
          <select class="input" v-model="method">
            <option value="gcash">GCash</option>
            <option value="maya">Maya</option>
            <option value="bank-transfer">Bank Transfer</option>
            <option value="online">Other Online</option>
          </select>
        </div>

        <div class="pf-field">
          <label class="pf-label">Screenshot / proof (required)</label>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden-input"
            @change="onFileChange"
          />
          <div v-if="proofPreview" class="pf-preview-wrap">
            <img :src="proofPreview" class="pf-preview-img" @click="lightbox = proofPreview" />
            <button class="pf-remove-btn" @click="removeProof">Remove</button>
          </div>
          <button v-else class="button ghost" style="width:100%" @click="fileInput.click()">
            Attach Screenshot
          </button>
          <p v-if="proofLargeFile" class="pf-large-hint">Large file detected — will be auto-compressed to 200 KB.</p>
        </div>

        <div v-if="submitError" class="notice">{{ submitError }}</div>

        <div class="pf-modal-actions">
          <button
            class="button"
            style="flex:1"
            :disabled="!proofFile || submitting"
            @click="submitProof"
          >{{ submitting ? 'Submitting…' : 'Submit' }}</button>
          <button class="button ghost" style="flex:1" @click="closeModal">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div v-if="lightbox" class="pf-backdrop" @click.self="lightbox = null">
      <div class="pf-lightbox">
        <img :src="lightbox" class="pf-lightbox-img" />
        <button class="button ghost button-compact" @click="lightbox = null">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api.js";

const route = useRoute();
const data = ref(null);
const loading = ref(true);
const refreshing = ref(false);
const error = ref("");
const selected = ref(null);
const method = ref("gcash");
const proofFile = ref(null);
const proofPreview = ref(null);
const fileInput = ref(null);
const proofLargeFile = ref(false);
const submitting = ref(false);
const submitError = ref("");
const lightbox = ref(null);

const totalRemaining = computed(() =>
  (data.value?.balances || []).reduce((s, b) => s + b.remaining, 0)
);
const outstandingCount = computed(() =>
  (data.value?.balances || []).filter((b) => effectiveState(b) === "outstanding").length
);
const waitlistedCount = computed(() =>
  (data.value?.balances || []).filter((b) => effectiveState(b) === "waitlisted").length
);
const fullCount = computed(() =>
  (data.value?.balances || []).filter((b) => effectiveState(b) === "full").length
);
const pendingCount = computed(() =>
  (data.value?.balances || []).filter((b) => b.pendingPayment).length
);
const paidCount = computed(() =>
  (data.value?.balances || []).filter((b) => b.remaining <= 0).length
);
const hasOpenSlot = computed(() => Boolean(data.value?.session?.hasOpenSlot));

// A waitlisted player can't pay until a slot frees up — their row is locked.
function isLocked(b) {
  return b.waitlisted && !b.pendingPayment && b.remaining > 0 && !hasOpenSlot.value;
}

const deadlinePassed = computed(() => Boolean(data.value?.session?.deadlinePassed));

// Resolve the display state for a player's balance.
// Once the deadline passes, the reserved-slot/waitlist distinction collapses:
// every unpaid player is simply "outstanding" and may pay first-come until the
// seat limit fills, after which the rest read "full".
function effectiveState(b) {
  if (b.remaining <= 0) return "paid";
  if (b.pendingPayment) return "pending";
  if (b.rejectedPayment) return "rejected";
  if (b.waitlisted) {
    // If a seat is actually open, they can pay now — treat as outstanding.
    if (hasOpenSlot.value) return "outstanding";
    // No seat: "full" once the deadline has passed, otherwise still waitlisted.
    return deadlinePassed.value ? "full" : "waitlisted";
  }
  return "outstanding";
}

function rowClass(b) {
  const s = effectiveState(b);
  if (s === "paid") return "row-paid";
  if (s === "pending") return "row-pending";
  if (s === "rejected") return "row-rejected";
  if (s === "waitlisted" || s === "full") return "row-waitlisted";
  return "row-outstanding";
}

function badgeClass(b) {
  const s = effectiveState(b);
  if (s === "paid") return "badge-paid";
  if (s === "pending") return "badge-pending";
  if (s === "rejected") return "badge-rejected";
  if (s === "waitlisted") return "badge-pending";
  if (s === "full") return "badge-full";
  return "badge-outstanding";
}

function badgeLabel(b) {
  const s = effectiveState(b);
  if (s === "paid") return "Paid";
  if (s === "pending") return "Pending";
  if (s === "rejected") return "Rejected";
  if (s === "waitlisted") return "Waitlisted";
  if (s === "full") return "Session Full";
  return "Outstanding";
}

function dueLabel(b) {
  const s = effectiveState(b);
  if (s === "pending") return `Submitted ${formatDate(b.pendingPayment.createdAt)}`;
  if (s === "outstanding") return `Outstanding: ${b.remaining}`;
  if (s === "full") return "Session is full — no open slot";
  if (s === "waitlisted") return "Waitlisted — waiting for an open slot";
  return "";
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function load() {
  try {
    data.value = await api.publicFeesSession(route.params.token);
  } catch (err) {
    error.value = err.message || "Unable to load";
  } finally {
    loading.value = false;
  }
}

async function refresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await load();
  } finally {
    refreshing.value = false;
  }
}

function onRowClick(b) {
  // Open for outstanding or rejected (allow resubmit); block if paid or pending
  if (b.remaining <= 0 || b.pendingPayment) return;
  // Waitlisted players can only pay once a slot opens up.
  if (isLocked(b)) return;
  selected.value = b;
  method.value = "gcash";
  proofFile.value = null;
  proofPreview.value = null;
  submitError.value = "";
}

function closeModal() {
  selected.value = null;
  proofFile.value = null;
  proofPreview.value = null;
  submitError.value = "";
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 50 * 1024 * 1024) {
    alert("Photo must be under 50 MB.");
    e.target.value = "";
    return;
  }
  proofLargeFile.value = file.size > 10 * 1024 * 1024;
  proofFile.value = file;
  proofPreview.value = URL.createObjectURL(file);
}

function removeProof() {
  proofFile.value = null;
  proofPreview.value = null;
  proofLargeFile.value = false;
  if (fileInput.value) fileInput.value.value = "";
}

async function submitProof() {
  if (!proofFile.value || submitting.value || !selected.value) return;
  submitting.value = true;
  submitError.value = "";
  try {
    await api.publicSubmitProof(route.params.token, selected.value.playerId, method.value, proofFile.value);
    closeModal();
    await load();
  } catch (err) {
    submitError.value = err.message || "Submission failed. Please try again.";
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.pf-wrap {
  min-height: 100vh;
  margin: 0 -16px;
  padding: 20px 16px 48px;
  background: var(--bg, #f5f5f5);
}

@media (min-width: 880px) {
  .pf-wrap {
    margin: 0 -24px;
    padding: 24px 24px 48px;
  }
}

.pf-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pf-loading { color: var(--ink-soft); font-size: 16px; }

/* Header */
.pf-header { position: relative; display: flex; flex-direction: column; gap: 6px; padding-right: 44px; }

.pf-refresh-btn {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--border, #e0e0e0);
  background: #fff;
  color: var(--ink-soft);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.pf-refresh-btn:hover { background: #f1f5f9; color: var(--ink); }
.pf-refresh-btn:disabled { cursor: default; }
.pf-refresh-btn svg { width: 18px; height: 18px; }
.pf-refresh-btn.spinning svg { animation: pf-spin 0.7s linear infinite; }
@keyframes pf-spin { to { transform: rotate(360deg); } }

.pf-session { font-size: 14px; color: var(--ink-soft); }

.pf-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--ink);
  margin: 0;
}

.pf-chips { display: flex; gap: 8px; flex-wrap: wrap; }

.pf-chip {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
}

.pf-chip.outstanding { background: rgba(180, 95, 95, 0.1); color: #b45f5f; }
.pf-chip.waitlisted  { background: rgba(148, 163, 184, 0.18); color: #475569; }
.pf-chip.pending     { background: rgba(245, 158, 11, 0.12); color: #92400e; }
.pf-chip.paid        { background: rgba(0, 137, 123, 0.1); color: #00897b; }
.pf-chip.full        { background: rgba(148, 163, 184, 0.18); color: #475569; }

/* Player list */
.pf-list {
  display: grid;
  grid-template-columns: 1fr;
  background: #fff;
  border: 1px solid var(--border, #e0e0e0);
  border-radius: var(--radius-sm, 12px);
  overflow: hidden;
}

@media (min-width: 768px) {
  .pf-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: var(--border, #e0e0e0);
  }
  .pf-row {
    background: #fff;
    border-bottom: none;
  }
  .pf-row.row-paid { background: #f8fffe; }
}

@media (min-width: 1080px) {
  .pf-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pf-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border, #e0e0e0);
  transition: background 0.1s;
}

.pf-row:last-child { border-bottom: none; }

.pf-row { flex-direction: column; gap: 0; }

.pf-row-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.pf-row.row-outstanding,
.pf-row.row-rejected,
.pf-row.row-waitlisted { cursor: pointer; }
.pf-row.row-outstanding:active { background: rgba(21,101,192,0.04); }
.pf-row.row-rejected:active  { background: rgba(180,95,95,0.04); }
.pf-row.row-waitlisted:active { background: rgba(245,158,11,0.05); }
.pf-row.row-paid { background: #f8fffe; }

/* Waitlisted with no open slot — not actionable */
.pf-row.row-locked { cursor: not-allowed; opacity: 0.6; }
.pf-row.row-locked:active { background: transparent; }

.pf-rejected-notice {
  font-size: 13px;
  font-weight: 600;
  color: #b45f5f;
  padding: 4px 0 2px;
}

.pf-player-info { display: flex; flex-direction: column; gap: 2px; }

.pf-player-name { font-size: 16px; font-weight: 600; color: var(--ink); }

.pf-player-due { font-size: 13px; color: var(--ink-soft); }

/* Status badge */
.pf-status-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-outstanding { background: rgba(180, 95, 95, 0.12);  color: #b45f5f; }
.badge-pending     { background: rgba(245, 158, 11, 0.12); color: #92400e; }
.badge-rejected    { background: rgba(180, 95, 95, 0.12);  color: #b45f5f; }
.badge-paid        { background: rgba(0, 137, 123, 0.12);  color: #00897b; }
.badge-full        { background: rgba(148, 163, 184, 0.2); color: #475569; }

/* Hint */
.pf-hint {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 0;
}

/* Payment-required banner */
.pf-gate-banner {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  margin: 4px 0 12px;
}
.pf-gate-icon {
  flex-shrink: 0;
  color: #b45309;
  line-height: 0;
}
.pf-gate-icon svg {
  width: 20px;
  height: 20px;
}
.pf-gate-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  line-height: 1.45;
  color: #92400e;
}
.pf-gate-text strong {
  font-size: 13.5px;
  color: #7c2d12;
}
.pf-gate-deadline {
  font-weight: 600;
}

/* Deadline-passed (red) variant */
.pf-gate-banner.passed {
  background: rgba(185, 28, 28, 0.1);
  border-color: rgba(185, 28, 28, 0.35);
}
.pf-gate-banner.passed .pf-gate-icon {
  color: #b91c1c;
}
.pf-gate-banner.passed .pf-gate-text {
  color: #991b1b;
}
.pf-gate-banner.passed .pf-gate-text strong {
  color: #7f1d1d;
}

/* Modal */
.pf-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.pf-modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px 20px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pf-modal-title { font-size: 18px; font-weight: 800; margin: 0; color: var(--ink); }
.pf-modal-sub   { font-size: 15px; font-weight: 600; color: var(--ink); margin-top: -6px; }
.pf-modal-amount { font-size: 14px; color: var(--ink-soft); margin-top: -6px; }

.pf-field { display: flex; flex-direction: column; gap: 6px; }

.pf-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
}

.hidden-input { display: none; }

.pf-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.pf-preview-img {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--border, #e0e0e0);
  cursor: pointer;
}

.pf-remove-btn {
  font-size: 12px;
  color: #b45f5f;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.pf-large-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #b45309;
  text-align: center;
}

.pf-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

/* Lightbox */
.pf-lightbox {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 90vw;
  max-height: 90vh;
}

.pf-lightbox-img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 6px;
}
</style>
