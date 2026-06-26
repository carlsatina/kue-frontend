<template>
  <div class="profile-page">
    <header class="profile-head">
      <div class="profile-avatar">{{ initials }}</div>
      <div class="profile-id">
        <h2>{{ profile.fullName || "Your account" }}</h2>
        <div class="muted">{{ profile.email || "—" }}</div>
      </div>
    </header>

    <section class="profile-section">
      <div class="section-title">Account</div>
      <dl class="info-list">
        <div class="info-row">
          <dt>Name</dt>
          <dd>{{ profile.fullName || "—" }}</dd>
        </div>
        <div class="info-row">
          <dt>Email</dt>
          <dd>{{ profile.email || "—" }}</dd>
        </div>
        <div class="info-row">
          <dt>Email status</dt>
          <dd>
            <span v-if="profile.emailVerifiedAt" class="pill success">Verified</span>
            <span v-else class="pill neutral">Unverified</span>
          </dd>
        </div>
        <div class="info-row">
          <dt>Roles</dt>
          <dd class="profile-pills">
            <span v-if="!profile.roles.length" class="pill neutral">None</span>
            <span v-for="role in profile.roles" :key="role" class="pill">{{ role }}</span>
          </dd>
        </div>
        <div class="info-row">
          <dt>Member since</dt>
          <dd>{{ memberSince }}</dd>
        </div>
      </dl>
    </section>

    <section class="profile-section">
      <div class="section-title">Change password</div>
      <form class="profile-form" @submit.prevent="submitPassword">
        <input
          class="input"
          type="password"
          v-model="currentPassword"
          placeholder="Current password"
          autocomplete="current-password"
        />
        <input
          class="input"
          type="password"
          v-model="newPassword"
          placeholder="New password (min 6 characters)"
          autocomplete="new-password"
        />
        <input
          class="input"
          type="password"
          v-model="confirmPassword"
          placeholder="Confirm new password"
          autocomplete="new-password"
        />
        <div v-if="passwordError" class="notice">{{ passwordError }}</div>
        <div v-if="passwordSuccess" class="notice ok">{{ passwordSuccess }}</div>
        <button class="button" type="submit" :disabled="savingPassword">
          {{ savingPassword ? "Updating…" : "Update password" }}
        </button>
      </form>
    </section>

    <section class="profile-section">
      <div class="section-title">Session</div>
      <div class="muted profile-logout-hint">Sign out when you're done managing courts.</div>
      <button class="button danger" @click="logout">Logout</button>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api.js";

const router = useRouter();

function decodeTokenPayload(token) {
  if (!token) return null;
  try {
    const base64 = token.split(".")[1];
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const tokenPayload = decodeTokenPayload(localStorage.getItem("token"));
const profile = ref({
  id: tokenPayload?.id || "",
  email: tokenPayload?.email || "",
  fullName: "",
  roles: Array.isArray(tokenPayload?.roles) ? tokenPayload.roles : [],
  emailVerifiedAt: null,
  createdAt: null
});

onMounted(async () => {
  try {
    const me = await api.me();
    profile.value = {
      id: me.id || profile.value.id,
      email: me.email || profile.value.email,
      fullName: me.fullName || "",
      roles: Array.isArray(me.roles) ? me.roles : profile.value.roles,
      emailVerifiedAt: me.emailVerifiedAt || null,
      createdAt: me.createdAt || null
    };
  } catch {
    // Fall back to the token-derived details already in `profile`.
  }
});

const initials = computed(() => {
  const name = profile.value.fullName.trim();
  if (name) {
    const parts = name.split(/\s+/);
    const first = parts[0]?.charAt(0) || "";
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase() || "U";
  }
  const email = profile.value.email || "";
  return email ? email.trim().charAt(0).toUpperCase() : "U";
});

const memberSince = computed(() => {
  if (!profile.value.createdAt) return "—";
  const date = new Date(profile.value.createdAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
});

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const savingPassword = ref(false);
const passwordError = ref("");
const passwordSuccess = ref("");

async function submitPassword() {
  passwordError.value = "";
  passwordSuccess.value = "";
  if (!currentPassword.value) {
    passwordError.value = "Enter your current password.";
    return;
  }
  if (newPassword.value.length < 6) {
    passwordError.value = "New password must be at least 6 characters.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "New passwords do not match.";
    return;
  }
  savingPassword.value = true;
  try {
    const result = await api.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    });
    // The server rotates the token on change; keep this session signed in
    // (all other sessions are invalidated server-side).
    if (result?.token) {
      localStorage.setItem("token", result.token);
      window.dispatchEvent(new Event("auth:changed"));
    }
    passwordSuccess.value = "Your password has been updated.";
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
  } catch (err) {
    passwordError.value = err.message || "Unable to update password.";
  } finally {
    savingPassword.value = false;
  }
}

function logout() {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("auth:changed"));
  router.push("/login");
}
</script>

<style scoped>
.profile-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 16px;
}
.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent, #1565c0);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  flex-shrink: 0;
}
.profile-id h2 {
  margin: 0;
  font-size: 20px;
}
.muted {
  color: #6b7280;
  font-size: 14px;
}

.profile-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
}

.info-list {
  margin: 0;
  display: flex;
  flex-direction: column;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
}
.info-row:first-child {
  border-top: none;
}
.info-row dt {
  color: #6b7280;
  font-size: 14px;
}
.info-row dd {
  margin: 0;
  font-size: 16px;
  text-align: right;
  word-break: break-word;
}

.profile-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}
.pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  background: #e0e7ff;
  color: #3730a3;
  text-transform: capitalize;
}
.pill.neutral {
  background: #f3f4f6;
  color: #6b7280;
}
.pill.success {
  background: #dcfce7;
  color: #166534;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice {
  font-size: 14px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
}
.notice.ok {
  background: #dcfce7;
  color: #166534;
}

.profile-logout-hint {
  margin-bottom: 2px;
}
.button.danger {
  align-self: flex-start;
}
</style>
