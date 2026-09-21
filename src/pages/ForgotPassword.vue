<template>
  <div class="auth-page">
    <!-- Ambient Background Lighting -->
    <div class="glow-orb orb-1" aria-hidden="true"></div>
    <div class="glow-orb orb-2" aria-hidden="true"></div>
    <div class="grid-overlay" aria-hidden="true"></div>

    <div class="auth-wrapper">
      <!-- Top Navigation -->
      <div class="auth-top-bar">
        <router-link to="/login" class="back-link">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Back to Sign In</span>
        </router-link>
      </div>

      <!-- Main Card -->
      <div class="auth-card">
        <div class="card-edge-highlight"></div>

        <div class="card-brand-header">
          <router-link to="/landing" class="brand-emblem-link" title="KuePro Home">
            <img src="../assets/Kue-logo.png" alt="Kue" class="brand-emblem-img" />
          </router-link>
          <div class="portal-badge">
            <span class="pulse-indicator"></span>
            <span>Password Recovery</span>
          </div>
          <h1 class="card-title">Reset your password</h1>
          <p class="card-subtitle">Enter your account email and we’ll send you a recovery link.</p>
        </div>

        <form class="auth-form" @submit.prevent="handleRequest">
          <div class="field-block">
            <label class="field-label" for="reset-email">Account Email</label>
            <div class="input-container">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                id="reset-email"
                class="styled-input"
                v-model="email"
                type="email"
                placeholder="name@club.com"
                autocomplete="email"
                required
                :disabled="loading"
              />
            </div>
          </div>

          <transition name="fade">
            <div v-if="sent" class="success-banner">
              <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>If an account exists for that email, a password reset link has been dispatched!</span>
            </div>
          </transition>

          <button class="submit-btn" type="submit" :disabled="loading || sent">
            <span v-if="loading" class="btn-spinner"></span>
            <span>{{ loading ? "Sending Link..." : "Send Reset Link" }}</span>
            <svg v-if="!loading" class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>

        <div class="card-footer">
          <div class="switch-row">
            <span>Remembered your password?</span>
            <router-link to="/login" class="login-cta-link">Back to Sign In →</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { api } from "../api.js";

const email = ref("");
const loading = ref(false);
const sent = ref(false);

async function handleRequest() {
  if (loading.value) return;
  loading.value = true;
  sent.value = false;
  try {
    await api.requestPasswordReset({ email: email.value });
    sent.value = true;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
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

.auth-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

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

.auth-card {
  position: relative;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 36px 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
.styled-input:focus {
  border-color: #10b981;
  background: rgba(2, 6, 23, 0.9);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #10b981;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}
.success-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

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
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
  transition: all 0.25s;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(16, 185, 129, 0.5);
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-arrow {
  width: 16px;
  height: 16px;
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
}
.login-cta-link:hover {
  text-decoration: underline;
}
</style>
