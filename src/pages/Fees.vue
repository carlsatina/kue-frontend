<template>
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
        </div>
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
        <button
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

  <!-- Record payment modal -->
  <div v-if="showPayment" class="modal-backdrop">
    <div class="modal-card">
      <h3>Record Payment</h3>
      <div class="subtitle">{{ paymentTarget?.player?.nickname || paymentTarget?.player?.fullName }}</div>
      <div class="subtitle">Remaining: {{ paymentTarget?.remaining }}</div>
      <div class="grid two">
        <button class="button" @click="record('cash')">Cash</button>
        <button class="button secondary" @click="record('e-wallet')">E‑wallet</button>
      </div>
      <button class="button ghost" @click="closePayment">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { api } from "../api.js";
import { selectedSessionId, setSelectedSessionId } from "../state/sessionStore.js";

const balances = ref([]);
const session = ref(null);
const error = ref("");
const showPayment = ref(false);
const paymentTarget = ref(null);
const showEditFee = ref(false);
const editFeeAmount = ref(0);
const editFeeError = ref("");
const totalDue = computed(() =>
  balances.value.reduce((sum, balance) => sum + Number(balance.remaining || 0), 0)
);

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

function openPayment(balance) {
  if (!session.value || balance.remaining <= 0) return;
  paymentTarget.value = balance;
  showPayment.value = true;
}

function closePayment() {
  showPayment.value = false;
  paymentTarget.value = null;
}

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

function formatMethod(method) {
  if (!method) return "";
  if (method.toLowerCase() === "cash") return "Cash";
  if (method.toLowerCase() === "e-wallet") return "E‑wallet";
  return method;
}

function formatAmount(value) {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString();
}

async function record(method) {
  if (!session.value || !paymentTarget.value) return;
  await api.recordPayment(session.value.id, {
    playerId: paymentTarget.value.playerId,
    amount: Number(paymentTarget.value.remaining),
    method
  });
  closePayment();
  await load();
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
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
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

.balance-row:last-child {
  border-bottom: none;
}

.balance-row.is-paid {
  background: #f8fffe;
}

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
</style>
