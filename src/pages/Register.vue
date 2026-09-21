<template>
  <div class="auth-page">
    <!-- Ambient Background Lighting -->
    <div class="glow-orb orb-1" aria-hidden="true"></div>
    <div class="glow-orb orb-2" aria-hidden="true"></div>
    <div class="grid-overlay" aria-hidden="true"></div>

    <div class="auth-wrapper">
      <!-- Top Navigation: Back to Home -->
      <div class="auth-top-bar">
        <router-link to="/landing" class="back-link">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Back to Home</span>
        </router-link>
      </div>

      <!-- Main Auth Card -->
      <div class="auth-card">
        <div class="card-edge-highlight"></div>

        <!-- Brand Emblem & Headers -->
        <div class="card-brand-header">
          <router-link to="/landing" class="brand-emblem-link" title="KuePro Home">
            <img src="../assets/Kue-logo.png" alt="Kue" class="brand-emblem-img" />
          </router-link>
          <div class="portal-badge">
            <span class="pulse-indicator"></span>
            <span>Organizer Registration</span>
          </div>
          <h1 class="card-title">Create Organizer Account</h1>
          <p class="card-subtitle">Set up your club sessions with automated queues and live boards.</p>
        </div>

        <!-- Register Form -->
        <form class="auth-form" @submit.prevent="handleRegister">
          <!-- Full Name Field -->
          <div class="field-block">
            <label class="field-label" for="reg-fullname">Full Name</label>
            <div class="input-container">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                id="reg-fullname"
                class="styled-input"
                v-model="fullName"
                type="text"
                placeholder="e.g. Coach Alex Rivera"
                autocomplete="name"
                required
                :disabled="isRegistering"
              />
            </div>
          </div>

          <!-- Email Field -->
          <div class="field-block">
            <label class="field-label" for="reg-email">Email Address</label>
            <div class="input-container">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                id="reg-email"
                class="styled-input"
                v-model="email"
                type="email"
                placeholder="name@club.com"
                autocomplete="email"
                required
                :disabled="isRegistering"
                :readonly="Boolean(invitedEmail)"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div class="field-block">
            <label class="field-label" for="reg-password">Password</label>
            <div class="input-container">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                id="reg-password"
                class="styled-input has-toggle"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="At least 6 characters"
                autocomplete="new-password"
                required
                minlength="6"
                :disabled="isRegistering"
              />
              <button
                class="toggle-password-btn"
                type="button"
                @click="showPassword = !showPassword"
                :disabled="isRegistering"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div class="field-block">
            <div class="label-row">
              <label class="field-label" for="reg-confirm">Confirm Password</label>
              <span v-if="confirmPassword && passwordsMatch" class="match-indicator success">✓ Match</span>
              <span v-else-if="confirmPassword && !passwordsMatch" class="match-indicator mismatch">Does not match</span>
            </div>
            <div class="input-container">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                id="reg-confirm"
                class="styled-input has-toggle"
                v-model="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                placeholder="Re-enter password"
                autocomplete="new-password"
                required
                :disabled="isRegistering"
              />
              <button
                class="toggle-password-btn"
                type="button"
                @click="showConfirm = !showConfirm"
                :disabled="isRegistering"
                :aria-label="showConfirm ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showConfirm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <transition name="fade">
            <div v-if="error" class="error-banner">
              <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ error }}</span>
            </div>
          </transition>

          <!-- Submit Action Button -->
          <button class="submit-btn" type="submit" :disabled="isRegistering">
            <span v-if="isRegistering" class="btn-spinner"></span>
            <span>{{ isRegistering ? "Setting Up Account..." : "Create Account &amp; Start" }}</span>
            <svg v-if="!isRegistering" class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>

        <!-- Card Footer / Switcher -->
        <div class="card-footer">
          <div class="switch-row">
            <span>Already have an account?</span>
            <router-link :to="{ path: '/login', query: authLinkQuery }" class="login-cta-link">
              Sign in →
            </router-link>
          </div>
        </div>

        <!-- Trust Badges -->
        <div class="trust-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Free Organizer Account · Unlimited Sessions</span>
        </div>
      </div>
    </div>

    <!-- Registration Loading Modal -->
    <GameLoadingModal
      v-if="isRegistering"
      title="Creating Your Team Pass"
      message="Saving your account and preparing your first session."
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { api } from "../api.js";
import { track } from "../utils/analytics.js";
import GameLoadingModal from "../components/GameLoadingModal.vue";

const router = useRouter();
const route = useRoute();
const invitedEmail = typeof route.query.email === "string" ? route.query.email : "";
const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "";
const authLinkQuery = {};
if (invitedEmail) authLinkQuery.email = invitedEmail;
if (redirect) authLinkQuery.redirect = redirect;

const fullName = ref("");
const email = ref(invitedEmail);
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirm = ref(false);
const error = ref("");
const isRegistering = ref(false);

const passwordsMatch = computed(() => {
  return password.value && confirmPassword.value && password.value === confirmPassword.value;
});

async function handleRegister() {
  if (isRegistering.value) return;
  error.value = "";
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match. Please double-check.";
    return;
  }
  if (password.value.length < 6) {
    error.value = "Password must be at least 6 characters.";
    return;
  }

  isRegistering.value = true;
  try {
    const data = await api.register({
      email: email.value,
      password: password.value,
      fullName: fullName.value,
      ...(redirect ? { redirect } : {})
    });
    track("register");
    const query = { email: data.email || email.value };
    if (redirect) query.redirect = redirect;
    router.push({ path: "/check-email", query });
  } catch (err) {
    error.value = err.message || "Registration failed. Please try again.";
  } finally {
    isRegistering.value = false;
  }
}
</script>

<style scoped>
/* ── Container & Ambient Canvas ── */
.auth-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background-color: #070a12;
  color: #f1f5f9;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* ── Ambient Glow Lighting ── */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.35;
}
.orb-1 {
  width: 500px;
  height: 500px;
  top: -120px;
  left: 20%;
  background: radial-gradient(circle, #10b981 0%, rgba(16, 185, 129, 0) 70%);
}
.orb-2 {
  width: 550px;
  height: 550px;
  bottom: -100px;
  right: 15%;
  background: radial-gradient(circle, #2563eb 0%, rgba(37, 99, 235, 0) 70%);
}
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 85%);
}

/* ── Layout Wrapper ── */
.auth-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ── Top Bar ── */
.auth-top-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}
.back-link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
  transform: translateX(-2px);
}
.back-icon {
  width: 14px;
  height: 14px;
}

/* ── Glassmorphic Auth Card ── */
.auth-card {
  position: relative;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 36px 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7),
              0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
}
.card-edge-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%);
  opacity: 0.8;
}

/* ── Brand Header ── */
.card-brand-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
}
.brand-emblem-link {
  display: inline-block;
  text-decoration: none;
  margin-bottom: 12px;
  transition: transform 0.25s ease;
}
.brand-emblem-link:hover {
  transform: scale(1.05);
}
.brand-emblem-img {
  height: clamp(80px, 14vw, 96px);
  width: auto;
  max-width: 80vw;
  display: block;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.35));
}
.portal-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.25);
  margin-bottom: 14px;
}
.pulse-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 1.8s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.4; }
  100% { transform: scale(1); opacity: 1; }
}
.card-title {
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
}
.card-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

/* ── Form Inputs ── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.match-indicator {
  font-size: 11px;
  font-weight: 600;
}
.match-indicator.success {
  color: #10b981;
}
.match-indicator.mismatch {
  color: #f87171;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 14px;
  color: #64748b;
  display: flex;
  align-items: center;
  pointer-events: none;
  transition: color 0.2s;
}
.input-icon svg {
  width: 17px;
  height: 17px;
}
.input-container:focus-within .input-icon {
  color: #10b981;
}

.styled-input {
  width: 100%;
  background: rgba(2, 6, 23, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px 14px 12px 42px;
  font-size: 14px;
  color: #ffffff;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.styled-input::placeholder {
  color: #475569;
}
.styled-input:focus {
  border-color: #10b981;
  background: rgba(2, 6, 23, 0.9);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}
.styled-input.has-toggle {
  padding-right: 44px;
}

.toggle-password-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: color 0.2s;
}
.toggle-password-btn:hover {
  color: #cbd5e1;
}
.toggle-password-btn svg {
  width: 17px;
  height: 17px;
}

/* ── Error Banner ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #f87171;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}
.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* ── Primary Submit Button ── */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(16, 185, 129, 0.5);
}
.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}
.submit-btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(3px);
}
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Card Footer ── */
.card-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
}
.switch-row {
  font-size: 14px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.login-cta-link {
  color: #10b981;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s;
}
.login-cta-link:hover {
  color: #34d399;
  text-decoration: underline;
}

/* ── Trust Badge ── */
.trust-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: #475569;
  margin-top: 20px;
}
.trust-badge svg {
  width: 13px;
  height: 13px;
}

/* ── Mobile responsiveness ── */
@media (max-width: 480px) {
  .auth-card {
    padding: 28px 20px;
    border-radius: 20px;
  }
  .card-title {
    font-size: 22px;
  }
}
</style>
