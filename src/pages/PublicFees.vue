<template>
  <div class="pf-wrap">
    <div class="pf-card">
      <div v-if="loading" class="pf-loading">Loading…</div>
      <div v-else-if="error" class="notice">{{ error }}</div>
      <template v-else>
        <!-- Header -->
        <div class="pf-header">
          <div class="pf-session">{{ data.session.name }}</div>
          <h2 class="pf-title">Session Fees</h2>
          <div class="pf-chips">
            <span class="pf-chip outstanding" v-if="totalRemaining > 0">{{ outstandingCount }} outstanding</span>
            <span class="pf-chip pending" v-if="pendingCount > 0">{{ pendingCount }} pending review</span>
            <span class="pf-chip paid" v-if="paidCount > 0">{{ paidCount }} paid</span>
          </div>
        </div>

        <p class="pf-hint">Tap your name below to submit proof of online payment.</p>

        <!-- Player list -->
        <div class="pf-list">
          <div
            v-for="b in data.balances"
            :key="b.playerId"
            class="pf-row"
            :class="rowClass(b)"
            @click="onRowClick(b)"
          >
            <div class="pf-row-main">
              <div class="pf-player-info">
                <span class="pf-player-name">{{ b.player.nickname || b.player.fullName }}</span>
                <span class="pf-player-due" v-if="b.remaining > 0 && !b.pendingPayment && !b.rejectedPayment">
                  Outstanding: {{ b.remaining }}
                </span>
                <span class="pf-player-due" v-else-if="b.pendingPayment">
                  Submitted {{ formatDate(b.pendingPayment.createdAt) }}
                </span>
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
const error = ref("");
const selected = ref(null);
const method = ref("gcash");
const proofFile = ref(null);
const proofPreview = ref(null);
const fileInput = ref(null);
const submitting = ref(false);
const submitError = ref("");
const lightbox = ref(null);

const totalRemaining = computed(() =>
  (data.value?.balances || []).reduce((s, b) => s + b.remaining, 0)
);
const outstandingCount = computed(() =>
  (data.value?.balances || []).filter((b) => b.remaining > 0 && !b.pendingPayment).length
);
const pendingCount = computed(() =>
  (data.value?.balances || []).filter((b) => b.pendingPayment).length
);
const paidCount = computed(() =>
  (data.value?.balances || []).filter((b) => b.remaining <= 0).length
);

function rowClass(b) {
  if (b.remaining <= 0) return "row-paid";
  if (b.pendingPayment) return "row-pending";
  if (b.rejectedPayment) return "row-rejected";
  return "row-outstanding";
}

function badgeClass(b) {
  if (b.remaining <= 0) return "badge-paid";
  if (b.pendingPayment) return "badge-pending";
  if (b.rejectedPayment) return "badge-rejected";
  return "badge-outstanding";
}

function badgeLabel(b) {
  if (b.remaining <= 0) return "Paid";
  if (b.pendingPayment) return "Pending";
  if (b.rejectedPayment) return "Rejected";
  return "Outstanding";
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

function onRowClick(b) {
  // Open for outstanding or rejected (allow resubmit); block if paid or pending
  if (b.remaining <= 0 || b.pendingPayment) return;
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
.pf-header { display: flex; flex-direction: column; gap: 6px; }

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
.pf-chip.pending     { background: rgba(245, 158, 11, 0.12); color: #92400e; }
.pf-chip.paid        { background: rgba(0, 137, 123, 0.1); color: #00897b; }

/* Player list */
.pf-list {
  background: #fff;
  border: 1px solid var(--border, #e0e0e0);
  border-radius: var(--radius-sm, 12px);
  overflow: hidden;
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
.pf-row.row-rejected { cursor: pointer; }
.pf-row.row-outstanding:active { background: rgba(21,101,192,0.04); }
.pf-row.row-rejected:active  { background: rgba(180,95,95,0.04); }
.pf-row.row-paid { background: #f8fffe; }

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

/* Hint */
.pf-hint {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 0;
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
