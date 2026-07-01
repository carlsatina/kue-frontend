<template>
  <div class="card auth-card stack verify-email">
    <div class="verify-badge" :class="{ success: status === 'success', error: status === 'error' }">
      <span v-if="status === 'loading'">Verifying…</span>
      <span v-else-if="status === 'success'">Verified</span>
      <span v-else>Invalid link</span>
    </div>
    <h2>{{ headline }}</h2>
    <p class="subtitle">{{ message }}</p>
    <router-link class="button" :class="status === 'error' ? 'ghost' : ''" :to="{ path: '/login', query: loginQuery }">
      Go to login
    </router-link>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api.js";

const route = useRoute();
const router = useRouter();
const status = ref("loading");
const next = computed(() => {
  const n = route.query.next ? String(route.query.next) : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "";
});
const loginQuery = computed(() => (next.value ? { redirect: next.value } : {}));
const redirecting = ref(false);
const headline = computed(() => {
  if (status.value === "success") return "Email verified!";
  if (status.value === "error") return "Verification failed";
  return "Finishing up";
});
const message = computed(() => {
  if (status.value === "success") {
    return redirecting.value
      ? "You're signed in — taking you where you were headed…"
      : "You can now log in and manage your sessions.";
  }
  if (status.value === "error") {
    return "This verification link is invalid or expired.";
  }
  return "Hold tight while we validate your link.";
});

onMounted(async () => {
  const token = route.query.token ? String(route.query.token) : "";
  if (!token) {
    status.value = "error";
    return;
  }
  try {
    const data = await api.verifyEmail(token);
    status.value = "success";
    // Auto-login: the verify endpoint hands back a session token. Store it and
    // continue to wherever the user was headed (e.g. an assistant invite).
    if (data?.token) {
      localStorage.setItem("token", data.token);
      window.dispatchEvent(new Event("auth:changed"));
      redirecting.value = true;
      setTimeout(() => router.push(next.value || "/"), 900);
    }
  } catch {
    status.value = "error";
  }
});
</script>
