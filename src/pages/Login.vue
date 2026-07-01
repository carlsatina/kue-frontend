<template>
  <div class="auth-page">
    <div class="auth-hero">
      <img src="../assets/KuePro.png" alt="KuePro" class="auth-logo" />
      <p class="auth-tagline">Run your best session.</p>
    </div>

    <div class="auth-body">
      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="auth-form-head">
          <h2 class="auth-title">Sign In</h2>
          <p class="auth-sub">Queue Master — manage courts, queue, and fees.</p>
        </div>

        <div class="auth-fields">
          <input
            class="input"
            v-model="email"
            type="email"
            placeholder="Email"
            autocomplete="email"
            :disabled="isLoggingIn"
          />
          <div class="input-wrap">
            <input
              class="input"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              autocomplete="current-password"
              :disabled="isLoggingIn"
            />
            <button
              class="icon-toggle"
              type="button"
              @click="showPassword = !showPassword"
              :disabled="isLoggingIn"
              aria-label="Toggle password"
            >
              <svg viewBox="0 0 24 24" role="img">
                <path d="M12 5c-5 0-9.3 3.1-11 7 1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"></path>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="error" class="notice">{{ error }}</div>

        <button class="button" type="submit" :disabled="isLoggingIn">
          {{ isLoggingIn ? "Entering Court..." : "Login" }}
        </button>

        <div class="auth-links">
          <span>New here? <router-link :to="{ path: '/register', query: authLinkQuery }">Create an account</router-link></span>
          <span>Forgot password? <router-link to="/forgot-password">Reset it</router-link></span>
          <span>Haven't verified yet? <router-link to="/check-email">Check email</router-link></span>
        </div>
      </form>
    </div>

    <GameLoadingModal
      v-if="isLoggingIn"
      title="Starting the Match"
      message="Warming up the court and syncing your queue."
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { api } from "../api.js";
import { track } from "../utils/analytics.js";
import GameLoadingModal from "../components/GameLoadingModal.vue";

const router = useRouter();
const route = useRoute();
const email = ref(typeof route.query.email === "string" ? route.query.email : "");
const authLinkQuery = {};
if (typeof route.query.email === "string") authLinkQuery.email = route.query.email;
if (typeof route.query.redirect === "string") authLinkQuery.redirect = route.query.redirect;
const password = ref("");
const showPassword = ref(false);
const error = ref("");
const isLoggingIn = ref(false);

async function handleLogin() {
  if (isLoggingIn.value) return;
  error.value = "";
  isLoggingIn.value = true;
  try {
    const data = await api.login({ email: email.value, password: password.value });
    localStorage.setItem("token", data.token);
    track("login");
    window.dispatchEvent(new Event("auth:changed"));
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    router.push(redirect);
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoggingIn.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  margin: 0 -16px -80px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ── Gradient hero ───────────────────────────────────────────────── */
.auth-hero {
  background: linear-gradient(135deg, #1a237e 0%, #1565c0 55%, #00695c 100%);
  padding: 52px 24px 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.auth-logo {
  height: 56px;
  width: auto;
  filter: brightness(0) invert(1);
  opacity: 0.95;
}

.auth-tagline {
  color: rgba(255, 255, 255, 0.72);
  font-size: 15px;
  margin: 0;
  letter-spacing: 0.01em;
}

/* ── Form body ───────────────────────────────────────────────────── */
.auth-body {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 36px 16px 48px;
  background: var(--bg-0);
}

.auth-form {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-form-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.auth-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--ink);
}

.auth-sub {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 0;
}

/* ── Fields ──────────────────────────────────────────────────────── */
.auth-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Footer links ────────────────────────────────────────────────── */
.auth-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: var(--ink-soft);
}

.auth-links a {
  color: var(--accent);
  font-weight: 600;
}
</style>
