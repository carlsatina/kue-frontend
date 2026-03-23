<template>
  <div class="app-shell" :class="{ 'bracket-shell': route.path === '/tournament' || route.path === '/pairing' }">
    <header class="header">
      <div class="brand">
        <h1 class="title">Kue</h1>
        <div class="brand-subtitle">Court control. Fast queues.</div>
      </div>
      <!-- Desktop nav lives inside the header -->
      <div v-if="showNav" class="header-center">
        <nav class="desktop-nav" :class="navClass">
          <router-link to="/" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M4 10.5l8-6 8 6v7a2 2 0 0 1-2 2h-4.5v-6h-3v6H6a2 2 0 0 1-2-2v-7z"/></svg></span>
            <span class="nav-label">Home</span>
          </router-link>
          <router-link to="/players" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13.5 19c.3-2.1 1.9-3.8 4.1-3.8 2.2 0 3.9 1.7 4.1 3.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            <span class="nav-label">Players</span>
          </router-link>
          <router-link v-if="showTeamsNav" to="/teams" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><circle cx="7.5" cy="9" r="2.5"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M11.5 19c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            <span class="nav-label">Teams</span>
          </router-link>
          <router-link to="/rankings" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M4 20h4V9H4v11zm6 0h4V4h-4v16zm6 0h4v-7h-4v7z"/></svg></span>
            <span class="nav-label">Rank</span>
          </router-link>
          <router-link to="/tournament" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M5 4h6v4H9v4h6v-4h-2V4h6v6h-4v4h-6v-4H5V4z"/></svg></span>
            <span class="nav-label">Bracket</span>
          </router-link>
          <router-link to="/fees" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M6 12h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16.5" cy="12" r="2.5"/></svg></span>
            <span class="nav-label">Fees</span>
          </router-link>
        </nav>
        <div class="session-switcher">
          <div class="session-label">Session</div>
          <select class="session-select" v-model="sessionSelection" :disabled="liveSessions.length === 0">
            <option v-if="liveSessions.length === 0" value="">No sessions</option>
            <option v-for="s in liveSessions" :key="s.id" :value="s.id">
              {{ s.name }} · {{ s.status === "open" ? "Active" : s.status }}
            </option>
          </select>
        </div>
      </div>
      <router-link v-if="showProfile" class="profile-button" to="/profile">
        <span class="profile-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <circle cx="12" cy="8" r="3.5"/>
            <path d="M4.5 19c0-3.2 3.2-5.5 7.5-5.5S19.5 15.8 19.5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="profile-label">Profile</span>
      </router-link>
    </header>

    <router-view v-slot="{ Component }">
      <transition :name="transitionName">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>

    <!-- Mobile bottom nav lives OUTSIDE the header — no sticky/backdrop-filter interference -->
    <nav v-if="showNav" class="mobile-nav" :class="navClass">
      <router-link to="/" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M4 10.5l8-6 8 6v7a2 2 0 0 1-2 2h-4.5v-6h-3v6H6a2 2 0 0 1-2-2v-7z"/></svg></span>
        <span class="nav-label">Home</span>
      </router-link>
      <router-link to="/players" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13.5 19c.3-2.1 1.9-3.8 4.1-3.8 2.2 0 3.9 1.7 4.1 3.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
        <span class="nav-label">Players</span>
      </router-link>
      <router-link v-if="showTeamsNav" to="/teams" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><circle cx="7.5" cy="9" r="2.5"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M11.5 19c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
        <span class="nav-label">Teams</span>
      </router-link>
      <router-link to="/rankings" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M4 20h4V9H4v11zm6 0h4V4h-4v16zm6 0h4v-7h-4v7z"/></svg></span>
        <span class="nav-label">Rank</span>
      </router-link>
      <router-link to="/tournament" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M5 4h6v4H9v4h6v-4h-2V4h6v6h-4v4h-6v-4H5V4z"/></svg></span>
        <span class="nav-label">Bracket</span>
      </router-link>
      <router-link to="/fees" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M6 12h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16.5" cy="12" r="2.5"/></svg></span>
        <span class="nav-label">Fees</span>
      </router-link>
    </nav>

    <GameLoadingModal
      v-if="showGlobalLoadingModal"
      title="Loading Match Data"
      message="Fetching the latest courts, queues, and rankings."
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, isReadingFromBackend } from "./api.js";
import { pendingSessionId, selectedSessionId, setPendingSessionId, setSelectedSessionId } from "./state/sessionStore.js";
import GameLoadingModal from "./components/GameLoadingModal.vue";

const route = useRoute();
const router = useRouter();

const transitionName = ref("page-fade");
router.beforeEach((to, from) => {
  const toDepth = to.meta.depth ?? 1;
  const fromDepth = from.meta.depth ?? 1;
  if (toDepth > fromDepth) transitionName.value = "slide-left";
  else if (toDepth < fromDepth) transitionName.value = "slide-right";
  else transitionName.value = "page-fade";
});

const authTick = ref(0);
const authed = computed(() => {
  authTick.value;
  return Boolean(localStorage.getItem("token"));
});
const showProfile = computed(() => authed.value && !route.meta.public);
const showNav = computed(() => !route.meta.public && authed.value);
const sessions = ref([]);
const liveSessions = computed(() => sessions.value.filter((s) => s.status === "open"));
const showGlobalLoadingModal = ref(false);
let loadingTimer = null;
const activeSession = computed(() => {
  const selected = liveSessions.value.find((session) => session.id === selectedSessionId.value);
  return selected || liveSessions.value[0] || null;
});
const showTeamsNav = computed(() => {
  if (!activeSession.value) return true;
  return activeSession.value.mode === "tournament";
});
const navClass = computed(() => (showTeamsNav.value ? "nav-6" : "nav-5"));

const sessionSelection = computed({
  get: () => selectedSessionId.value,
  set: (value) => setSelectedSessionId(value)
});

const activeSessionId = computed(() => liveSessions.value[0]?.id || "");

async function loadSessions() {
  if (!authed.value || route.meta.public) return;
  try {
    const list = await api.listSessions();
    sessions.value = list || [];
  } catch {
    sessions.value = [];
  }

  if (!liveSessions.value.length) {
    setSelectedSessionId("");
    return;
  }
  if (pendingSessionId.value) {
    const pending = liveSessions.value.find((s) => s.id === pendingSessionId.value);
    if (pending) {
      setSelectedSessionId(pending.id);
      setPendingSessionId("");
      return;
    }
  }
  const exists = liveSessions.value.some((s) => s.id === selectedSessionId.value);
  if (!exists) {
    setSelectedSessionId(activeSessionId.value || liveSessions.value[0].id);
  }
}

function handleSessionsUpdated() {
  loadSessions();
}

function handleAuthChanged() {
  authTick.value += 1;
}

watch(
  () => route.fullPath,
  () => {
    loadSessions();
  }
);

watch(authed, (isAuthed) => {
  if (isAuthed) {
    loadSessions();
  } else {
    sessions.value = [];
    setSelectedSessionId("");
  }
});

watch(
  isReadingFromBackend,
  (isLoading) => {
    if (isLoading) {
      if (loadingTimer || showGlobalLoadingModal.value) return;
      loadingTimer = window.setTimeout(() => {
        showGlobalLoadingModal.value = true;
        loadingTimer = null;
      }, 180);
      return;
    }
    if (loadingTimer) {
      window.clearTimeout(loadingTimer);
      loadingTimer = null;
    }
    showGlobalLoadingModal.value = false;
  },
  { immediate: true }
);

onMounted(() => {
  loadSessions();
  document.addEventListener("sessions:updated", handleSessionsUpdated);
  window.addEventListener("auth:changed", handleAuthChanged);
  window.addEventListener("storage", handleAuthChanged);
});

onUnmounted(() => {
  if (loadingTimer) {
    window.clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  document.removeEventListener("sessions:updated", handleSessionsUpdated);
  window.removeEventListener("auth:changed", handleAuthChanged);
  window.removeEventListener("storage", handleAuthChanged);
});
</script>
