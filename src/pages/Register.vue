<template>
  <div class="card auth-card stack">
    <h2>Create Queue Master Account</h2>
    <p class="subtitle">Open registration for organizers and staff.</p>
    <input class="input" v-model="fullName" type="text" placeholder="Full name" :disabled="isRegistering" />
    <input class="input" v-model="email" type="email" placeholder="Email" :disabled="isRegistering" />
    <div class="input-wrap">
      <input
        class="input"
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        placeholder="Password"
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
          <path
            d="M12 5c-5 0-9.3 3.1-11 7 1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
          ></path>
        </svg>
      </button>
    </div>
    <div class="input-wrap">
      <input
        class="input"
        v-model="confirmPassword"
        :type="showConfirm ? 'text' : 'password'"
        placeholder="Confirm password"
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
          <path
            d="M12 5c-5 0-9.3 3.1-11 7 1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
          ></path>
        </svg>
      </button>
    </div>
    <button class="button" :disabled="isRegistering" @click="handleRegister">
      {{ isRegistering ? "Setting Up..." : "Register" }}
    </button>
    <div class="subtitle">
      Already have an account? <router-link to="/login">Login</router-link>
    </div>
    <div v-if="error" class="notice">{{ error }}</div>
  </div>
  <GameLoadingModal
    v-if="isRegistering"
    title="Creating Your Team Pass"
    message="Saving your account and preparing your first session."
  />
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api.js";
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
    router.push({ path: "/check-email", query: { email: data.email || email.value } });
  } catch (err) {
    error.value = err.message;
  } finally {
    isRegistering.value = false;
  }
}
</script>
