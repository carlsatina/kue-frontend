<template>
  <div>
  <div class="card stack">
    <div class="section-title">Join Session</div>
    <div v-if="loading" class="subtitle">Loading...</div>
    <div v-else-if="error" class="notice">{{ error }}</div>
    <div v-else class="stack">
      <div class="subtitle">Session</div>
      <strong>{{ session?.name }}</strong>
      <div class="subtitle">{{ session?.status }}</div>
      <div v-if="sessionLocation || sessionSchedule" class="join-meta">
        <span v-if="sessionLocation">📍 {{ sessionLocation }}</span>
        <span v-if="sessionSchedule">🕑 {{ sessionSchedule }}</span>
      </div>

      <!-- Step 1: name -->
      <template v-if="step === 'form'">
        <input class="input" v-model="fullName" placeholder="Full name" />

        <label class="radio-row">
          <input type="checkbox" v-model="newPlayer" />
          New Player
        </label>

        <button class="button" @click="submit">Submit</button>
        <button class="button ghost" @click="openPlayers">View Joined Players</button>
        <div v-if="success" class="notice">You're checked in!</div>
      </template>

      <!-- Step 2: payment proof -->
      <template v-else-if="step === 'proof'">
        <div class="notice">
          Payment is required to join this session.
          <template v-if="joinFee > 0"> Amount due: <strong>{{ joinFee }}</strong>.</template>
          Upload a screenshot of your payment to complete your registration.
          <template v-if="deadlineText"> Please pay before <strong>{{ deadlineText }}</strong> to keep your slot.</template>
        </div>
        <div class="field">
          <label class="field-label">Payment method</label>
          <select class="input" v-model="method">
            <option value="GCash">GCash</option>
            <option value="Maya">Maya</option>
            <option value="Bank transfer">Bank transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Proof of payment</label>
          <input class="input" type="file" accept="image/*" @change="onProofChange" />
        </div>
        <div v-if="proofError" class="notice">{{ proofError }}</div>
        <button class="button" :disabled="proofSubmitting" @click="submitProof">
          {{ proofSubmitting ? "Uploading..." : "Submit proof" }}
        </button>
        <div class="subtitle pay-later-note">
          Want to pay later? You can close this and submit your proof anytime using the
          payment link your organizer shares
          <template v-if="deadlineText">— just make sure it's before {{ deadlineText }}</template>.
        </div>
      </template>

      <!-- Waitlist: session full, must wait for the deadline -->
      <template v-else-if="step === 'waitlist'">
        <div class="notice">
          This session is currently full, so you've been added to the <strong>waitlist</strong>.
          <template v-if="deadlineText">
            If any slots open up after <strong>{{ deadlineText }}</strong>, you'll be able to
            pay and claim a spot. Please check back then.
          </template>
          <template v-else>
            You'll be able to pay and claim a spot if one opens up. Please check back later.
          </template>
        </div>
        <button class="button ghost" @click="openPlayers">View Joined Players</button>
      </template>

      <!-- Step 3: awaiting approval -->
      <template v-else-if="step === 'awaiting'">
        <div class="notice">
          Thanks! Your proof of payment was submitted and is awaiting approval from the
          organizer. You'll be added to the session once it's confirmed.
        </div>
        <button class="button ghost" @click="openPlayers">View Joined Players</button>
      </template>
    </div>
  </div>
  <div v-if="showPlayers" class="modal-backdrop">
    <div class="modal-card join-modal compact">
      <div class="kpi">
        <div>
          <div class="subtitle">Joined Players</div>
          <strong>{{ session?.name }}</strong>
        </div>
        <span class="badge neutral">{{ visibleJoinedPlayers.length }}</span>
      </div>
      <div v-if="playersError" class="notice">{{ playersError }}</div>
      <div v-else-if="playersLoading" class="subtitle">Loading...</div>
      <div v-else-if="visibleJoinedPlayers.length === 0" class="subtitle">No players yet.</div>
      <div v-else class="stack join-player-list">
        <div
          v-for="sp in joinedPlayersWithOrder"
          :key="sp.playerId"
          class="join-player-card"
          :class="{ 'new-player': sp.isNewPlayer, 'over-limit': sp.overLimit }"
        >
          <div class="join-player-row">
            <span class="join-player-order">{{ sp.orderLabel }}</span>
            <div>
              <div class="join-player-name">
                <strong>{{ sp.player.nickname || sp.player.fullName }}</strong>
                <span v-if="sp.isNewPlayer" class="new-player-pill">New</span>
              </div>
              <div class="subtitle">{{ sp.player.fullName }}</div>
            </div>
          </div>
        </div>
      </div>
      <button class="button" @click="closePlayers">Close</button>
    </div>
  </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api.js";
import { track } from "../utils/analytics.js";
import { formatSessionSchedule, formatSessionLocation } from "../utils/sessionSchedule.js";

const route = useRoute();
const session = ref(null);
const sessionLocation = computed(() => formatSessionLocation(session.value));
const sessionSchedule = computed(() => formatSessionSchedule(session.value));
const loading = ref(true);
const error = ref("");
const success = ref(false);
const fullName = ref("");
const newPlayer = ref(false);
const step = ref("form");
const pendingPlayerId = ref("");
const joinFee = ref(0);
const method = ref("GCash");
const proofFile = ref(null);
const proofError = ref("");
const proofSubmitting = ref(false);
const deadlineText = ref("");

function formatDeadline(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit"
  });
}
const showPlayers = ref(false);
const joinedPlayers = ref([]);
const playersLoading = ref(false);
const playersError = ref("");
const regularJoinLimit = ref(0);
const newJoinerLimit = ref(0);

const visibleJoinedPlayers = computed(() =>
  joinedPlayers.value.filter((sp) => sp.status !== "done")
);

const joinedPlayersWithOrder = computed(() => {
  let regularIndex = 0;
  let newIndex = 0;
  return visibleJoinedPlayers.value.map((sp) => {
    if (sp.isNewPlayer) {
      newIndex += 1;
      return {
        ...sp,
        orderLabel: `n${newIndex}`,
        overLimit: newJoinerLimit.value > 0 && newIndex > newJoinerLimit.value
      };
    }
    regularIndex += 1;
    return {
      ...sp,
      orderLabel: `r${regularIndex}`,
      overLimit: regularJoinLimit.value > 0 && regularIndex > regularJoinLimit.value
    };
  });
});

function setPageTitle(name) {
  const title = name ? `Join Session • ${name}` : "Join Session";
  document.title = title;
  const og = document.querySelector('meta[property="og:title"]');
  if (og) og.setAttribute("content", title);
  const twitter = document.querySelector('meta[name="twitter:title"]');
  if (twitter) twitter.setAttribute("content", title);
}

async function load() {
  try {
    const data = await api.publicSessionInvite(route.params.token);
    session.value = data.session;
    setPageTitle(session.value?.name);
  } catch (err) {
    error.value = err.message || "Unable to load session";
    setPageTitle("");
  } finally {
    loading.value = false;
  }
}

async function submit() {
  error.value = "";
  success.value = false;
  if (!fullName.value.trim()) {
    error.value = "Full name is required";
    return;
  }
  try {
    const res = await api.publicSessionRegister(route.params.token, {
      fullName: fullName.value.trim(),
      newPlayer: newPlayer.value
    });
    track("join-session", { waitlisted: Boolean(res.waitlisted), needsPayment: Boolean(res.canPay) });
    pendingPlayerId.value = res.player.id;
    joinFee.value = Number(res.fee || 0);
    deadlineText.value = formatDeadline(res.paymentDeadline);
    if (res.canPay) {
      step.value = "proof";
    } else if (res.waitlisted) {
      step.value = "waitlist";
    } else {
      success.value = true;
      fullName.value = "";
      newPlayer.value = false;
    }
  } catch (err) {
    error.value = err.message || "Unable to register";
  }
}

function onProofChange(e) {
  proofFile.value = e.target.files?.[0] || null;
}

async function submitProof() {
  proofError.value = "";
  if (!proofFile.value) {
    proofError.value = "Please choose an image of your payment.";
    return;
  }
  proofSubmitting.value = true;
  try {
    await api.publicSubmitJoinProof(
      route.params.token,
      pendingPlayerId.value,
      method.value,
      proofFile.value
    );
    step.value = "awaiting";
  } catch (err) {
    proofError.value = err.message || "Unable to submit proof";
  } finally {
    proofSubmitting.value = false;
  }
}

async function openPlayers() {
  showPlayers.value = true;
  playersError.value = "";
  playersLoading.value = true;
  try {
    const data = await api.publicSessionInvitePlayers(route.params.token);
    joinedPlayers.value = data.players || [];
    regularJoinLimit.value = Number(data.session?.regularJoinLimit || 0);
    newJoinerLimit.value = Number(data.session?.newJoinerLimit || 0);
  } catch (err) {
    playersError.value = err.message || "Unable to load players";
    joinedPlayers.value = [];
    regularJoinLimit.value = 0;
    newJoinerLimit.value = 0;
  } finally {
    playersLoading.value = false;
  }
}

function closePlayers() {
  showPlayers.value = false;
}

onMounted(load);
</script>

<style scoped>
.join-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-soft);
}
</style>
