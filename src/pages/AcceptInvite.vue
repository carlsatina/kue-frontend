<template>
  <div class="invite-page">
    <div class="invite-card">
      <div class="invite-logo" aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>
      </div>

      <div v-if="loading" class="invite-state">Loading invitation…</div>

      <template v-else-if="loadError">
        <h1 class="invite-title">Invitation unavailable</h1>
        <p class="invite-text">{{ loadError }}</p>
        <button class="button" type="button" @click="goHome">Go to Kue</button>
      </template>

      <template v-else-if="invalidState">
        <h1 class="invite-title">{{ invalidState.title }}</h1>
        <p class="invite-text">{{ invalidState.text }}</p>
        <button class="button" type="button" @click="goHome">Go to Kue</button>
      </template>

      <template v-else-if="!isAuthed">
        <h1 class="invite-title">Join as a collaborator</h1>
        <p class="invite-text">
          <strong>{{ info.ownerName }}</strong> invited <strong>{{ info.email }}</strong> to collaborate. Create an
          account (or sign in) with that email to share their workspace.
        </p>
        <button class="button" type="button" @click="goRegister">Create account</button>
        <button class="button ghost" type="button" @click="goSignIn">I already have an account</button>
      </template>

      <template v-else-if="!info.emailMatches">
        <h1 class="invite-title">Wrong account</h1>
        <p class="invite-text">
          This invitation was sent to <strong>{{ info.email }}</strong>, but you're signed in as
          <strong>{{ currentEmail }}</strong>. Sign in with the invited email to accept.
        </p>
        <button class="button" type="button" @click="switchAccount">Sign in with another account</button>
      </template>

      <template v-else-if="accepted">
        <div class="invite-check" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.55 17.05 4.5 12l1.4-1.4 3.65 3.6 8.15-8.15L19.1 7.5z"/></svg>
        </div>
        <h1 class="invite-title">You're in!</h1>
        <p class="invite-text">You now share this workspace. You can view, create, and manage all of its sessions.</p>
        <button class="button" type="button" @click="goToSession">Open workspace</button>
      </template>

      <template v-else>
        <h1 class="invite-title">Join as a collaborator</h1>
        <p class="invite-text">
          <strong>{{ info.ownerName }}</strong> invited you to collaborate. As a collaborator you'll share their
          workspace — you can view, create, and manage all of their sessions.
        </p>
        <div v-if="acceptError" class="notice danger">{{ acceptError }}</div>
        <button class="button" type="button" :disabled="accepting" @click="accept">
          {{ accepting ? "Joining…" : "Accept invitation" }}
        </button>
        <button class="button ghost" type="button" @click="goHome">Not now</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api.js";
import { track } from "../utils/analytics.js";
import { setSelectedSessionId } from "../state/sessionStore.js";

const route = useRoute();
const router = useRouter();

const token = computed(() => String(route.params.token || ""));
const loading = ref(true);
const loadError = ref("");
const info = ref(null);
const accepting = ref(false);
const acceptError = ref("");
const accepted = ref(false);
const joinedSessionId = ref("");

const isAuthed = ref(Boolean(localStorage.getItem("token")));

const currentEmail = computed(() => {
  const token = localStorage.getItem("token");
  if (!token) return "";
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)).email || "";
  } catch {
    return "";
  }
});

const invalidState = computed(() => {
  if (!info.value) return null;
  if (info.value.expired) {
    return { title: "Invitation expired", text: "This invitation is no longer valid. Ask the organizer to send a new one." };
  }
  if (info.value.status === "revoked") {
    return { title: "Invitation revoked", text: "This invitation was cancelled by the organizer." };
  }
  return null;
});

async function load() {
  loading.value = true;
  loadError.value = "";
  try {
    info.value = isAuthed.value
      ? await api.assistantInvite(token.value)
      : await api.publicAssistantInvite(token.value);
  } catch (err) {
    loadError.value = err.message || "We couldn't find this invitation.";
  } finally {
    loading.value = false;
  }
}

async function accept() {
  accepting.value = true;
  acceptError.value = "";
  try {
    const res = await api.acceptAssistantInvite(token.value);
    track("assistant-invite-accepted");
    joinedSessionId.value = res.sessionId || "";
    accepted.value = true;
  } catch (err) {
    acceptError.value = err.message || "Unable to accept this invitation.";
  } finally {
    accepting.value = false;
  }
}

function goToSession() {
  if (joinedSessionId.value) setSelectedSessionId(joinedSessionId.value);
  router.push("/");
}

function goHome() {
  router.push("/");
}

function goRegister() {
  router.push({ path: "/register", query: { email: info.value?.email || "", redirect: route.fullPath } });
}

function goSignIn() {
  router.push({ path: "/login", query: { email: info.value?.email || "", redirect: route.fullPath } });
}

function switchAccount() {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("auth:changed"));
  router.push({ path: "/login", query: { redirect: route.fullPath } });
}

onMounted(load);
</script>

<style scoped>
.invite-page {
  min-height: 100dvh;
  margin: 0 -16px -80px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: linear-gradient(160deg, #eaf1fb, #f6f8fc);
}
.invite-card {
  width: 100%;
  max-width: 380px;
  background: var(--card, #fff);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
  padding: 28px 22px;
  text-align: center;
  display: grid;
  gap: 14px;
  justify-items: center;
}
.invite-logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(21, 101, 192, 0.12);
  color: var(--accent);
}
.invite-logo svg {
  width: 28px;
  height: 28px;
  fill: currentColor;
}
.invite-check {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(16, 157, 138, 0.16);
  color: #0f9d8a;
}
.invite-check svg {
  width: 32px;
  height: 32px;
}
.invite-title {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  color: var(--ink);
}
.invite-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--ink-soft, #64748b);
}
.invite-state {
  font-size: 14px;
  color: var(--ink-soft, #64748b);
  padding: 16px 0;
}
.invite-card .button {
  width: 100%;
}
</style>
