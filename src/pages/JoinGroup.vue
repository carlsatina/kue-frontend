<template>
  <div class="card stack">
    <div class="section-title">Join Group</div>

    <div v-if="loading" class="subtitle">Loading…</div>
    <div v-else-if="error" class="notice">{{ error }}</div>

    <template v-else-if="joined">
      <div class="notice success">
        <template v-if="alreadyMember">
          You're already on <strong>{{ group?.name }}</strong>.
        </template>
        <template v-else>
          You've joined <strong>{{ group?.name }}</strong>.
        </template>
      </div>
      <div class="subtitle">
        Your organizer can now add you to sessions for this group. Nothing else to do here.
      </div>
    </template>

    <template v-else>
      <div class="stack">
        <strong class="group-name">{{ group?.name }}</strong>
        <div v-if="group?.description" class="subtitle">{{ group.description }}</div>
        <div class="subtitle">
          {{ group?.memberCount || 0 }} member{{ group?.memberCount === 1 ? '' : 's' }}
        </div>
      </div>

      <div class="field">
        <label class="field-label">Full name</label>
        <input class="input" v-model="fullName" placeholder="Full name" />
      </div>
      <div class="field">
        <label class="field-label">Nickname <span class="field-hint">optional</span></label>
        <input class="input" v-model="nickname" placeholder="What everyone calls you" />
      </div>
      <div class="field">
        <label class="field-label">Mobile number <span class="field-hint">optional</span></label>
        <input class="input" v-model="contact" placeholder="09XX XXX XXXX" inputmode="tel" />
      </div>

      <div v-if="submitError" class="notice">{{ submitError }}</div>
      <button class="button" :disabled="submitting" @click="submit">
        {{ submitting ? 'Joining…' : 'Join group' }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api.js";

const route = useRoute();
const token = route.params.token;

const group = ref(null);
const loading = ref(true);
const error = ref("");

const fullName = ref("");
const nickname = ref("");
const contact = ref("");
const submitting = ref(false);
const submitError = ref("");
const joined = ref(false);
const alreadyMember = ref(false);

async function load() {
  try {
    const data = await api.publicGroupInvite(token);
    if (data.error) {
      error.value = data.error === "Link expired" ? "This invite link has expired." : "This invite link is no longer valid.";
      return;
    }
    group.value = data.group;
    document.title = `Join ${data.group.name} · Kue`;
  } catch {
    error.value = "Unable to load this invite link.";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  submitError.value = "";
  const name = fullName.value.trim();
  if (!name) {
    submitError.value = "Please enter your full name.";
    return;
  }
  submitting.value = true;
  try {
    const data = await api.publicJoinGroup(token, {
      fullName: name,
      nickname: nickname.value.trim() || undefined,
      contact: contact.value.trim() || undefined
    });
    if (data.error) {
      submitError.value = data.error;
      return;
    }
    alreadyMember.value = Boolean(data.alreadyMember);
    joined.value = true;
  } catch {
    submitError.value = "Unable to join right now. Please try again.";
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.group-name {
  font-size: 20px;
}
</style>
