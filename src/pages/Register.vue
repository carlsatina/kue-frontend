<template>
  <div class="auth-page">
    <div class="auth-hero">
      <img src="../assets/KuePro.png" alt="KuePro" class="auth-logo" />
      <p class="auth-tagline">Set up your organizer account.</p>
    </div>

    <div class="auth-body">
      <div class="auth-form">
        <div class="auth-form-head">
          <h2 class="auth-title">Create Account</h2>
          <p class="auth-sub">Open registration for organizers and staff.</p>
        </div>

        <div class="auth-fields">
          <input
            class="input"
            v-model="fullName"
            type="text"
            placeholder="Full name"
            autocomplete="name"
            :disabled="isRegistering"
          />
          <input
            class="input"
            v-model="email"
            type="email"
            placeholder="Email"
            autocomplete="email"
            :disabled="isRegistering"
          />
          <div class="input-wrap">
            <input
              class="input"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              autocomplete="new-password"
              :disabled="isRegistering"
            />
            <button
              class="icon-toggle"
              type="button"
              @click="showPassword = !showPassword"
              :disabled="isRegistering"
              aria-label="Toggle password"
            >
              <svg viewBox="0 0 24 24" role="img">
                <path d="M12 5c-5 0-9.3 3.1-11 7 1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"></path>
              </svg>
            </button>
          </div>
          <div class="input-wrap">
            <input
              class="input"
              v-model="confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Confirm password"
              autocomplete="new-password"
              :disabled="isRegistering"
            />
            <button
              class="icon-toggle"
              type="button"
              @click="showConfirm = !showConfirm"
              :disabled="isRegistering"
              aria-label="Toggle confirm password"
            >
              <svg viewBox="0 0 24 24" role="img">
                <path d="M12 5c-5 0-9.3 3.1-11 7 1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"></path>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="error" class="notice">{{ error }}</div>

        <button class="button" :disabled="isRegistering" @click="handleRegister">
          {{ isRegistering ? "Setting Up..." : "Register" }}
        </button>

        <div class="auth-links">
          <span>Already have an account? <router-link to="/login">Sign in</router-link></span>
        </div>
      </div>
    </div>

    <GameLoadingModal
      v-if="isRegistering"
      title="Creating Your Team Pass"
      message="Saving your account and preparing your first session."
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api.js";
import { track } from "../utils/analytics.js";
import GameLoadingModal from "../components/GameLoadingModal.vue";

const router = useRouter();
const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirm = ref(false);
const error = ref("");
const isRegistering = ref(false);

async function handleRegister() {
  if (isRegistering.value) return;
  error.value = "";
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match";
    return;
  }
  isRegistering.value = true;
  try {
    const data = await api.register({
      email: email.value,
      password: password.value,
      fullName: fullName.value
    });
    track("register");
    router.push({ path: "/check-email", query: { email: data.email || email.value } });
  } catch (err) {
    error.value = err.message;
  } finally {
    isRegistering.value = false;
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
