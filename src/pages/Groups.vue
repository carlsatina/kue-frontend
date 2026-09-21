<template>
  <div>
    <div class="groups-page">
      <div class="groups-header">
        <div>
          <h1 class="groups-title">Groups</h1>
          <p class="text-muted">Rosters that play together. Pick from a group to fill a session.</p>
        </div>
        <p v-if="!loading" class="text-muted">{{ groups.length }} group{{ groups.length === 1 ? '' : 's' }}</p>
      </div>

      <div v-if="!loading" class="groups-list-section">
        <div class="groups-toolbar">
          <input class="input" v-model="groupSearch" placeholder="Search groups" />
          <button class="button button-compact" @click="openCreateGroup">Create Group</button>
        </div>

        <p v-if="filteredGroups.length === 0" class="empty-hint">
          {{ groups.length ? 'No groups match that search.' : 'No groups yet. Create one to get started.' }}
        </p>
        <div v-else class="group-list">
          <button
            v-for="group in filteredGroups"
            :key="group.id"
            class="group-card"
            type="button"
            @click="$router.push(`/groups/${group.id}`)"
          >
            <div class="group-card-info">
              <strong>{{ group.name }}</strong>
              <p v-if="group.description" class="group-card-sub">{{ group.description }}</p>
              <p class="group-card-meta">{{ group.memberCount }} member{{ group.memberCount === 1 ? '' : 's' }}</p>
            </div>
            <svg class="group-card-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        <div v-if="listError" class="notice">{{ listError }}</div>
      </div>
    </div>

    <div v-if="showCreateGroup" class="modal-backdrop">
      <div class="modal-card">
        <h3>Create group</h3>
        <div class="field">
          <label class="field-label">Name</label>
          <input ref="newGroupNameInput" class="input" v-model="newGroupName" placeholder="e.g. Tuesday Open Play" />
        </div>
        <div class="field">
          <label class="field-label">Description <span class="field-hint">optional</span></label>
          <input class="input" v-model="newGroupDescription" placeholder="Who plays in this group?" />
        </div>
        <div v-if="createError" class="notice">{{ createError }}</div>
        <div class="grid two">
          <button class="button ghost" @click="closeCreateGroup">Cancel</button>
          <button class="button" @click="createGroup">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api.js";

const router = useRouter();

const groups = ref([]);
const loading = ref(true);
const listError = ref("");
const groupSearch = ref("");

const showCreateGroup = ref(false);
const newGroupNameInput = ref(null);
const newGroupName = ref("");
const newGroupDescription = ref("");
const createError = ref("");

const filteredGroups = computed(() => {
  const term = groupSearch.value.trim().toLowerCase();
  if (!term) return groups.value;
  return groups.value.filter((g) => (g.name || "").toLowerCase().includes(term));
});

async function load() {
  listError.value = "";
  loading.value = true;
  try {
    groups.value = await api.listGroups();
  } catch (err) {
    listError.value = err.message || "Unable to load groups";
  } finally {
    loading.value = false;
  }
}

function openCreateGroup() {
  createError.value = "";
  newGroupName.value = "";
  newGroupDescription.value = "";
  showCreateGroup.value = true;
  // Wait for the modal to render before the field exists to focus.
  nextTick(() => newGroupNameInput.value?.focus());
}

function closeCreateGroup() {
  showCreateGroup.value = false;
  createError.value = "";
}

async function createGroup() {
  createError.value = "";
  const name = newGroupName.value.trim();
  if (!name) {
    createError.value = "Group name is required.";
    return;
  }
  try {
    const group = await api.createGroup({
      name,
      description: newGroupDescription.value.trim() || undefined
    });
    showCreateGroup.value = false;
    router.push(`/groups/${group.id}`);
  } catch (err) {
    createError.value = err.message || "Unable to create group";
  }
}

onMounted(load);
</script>

<style scoped>
.groups-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.groups-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.groups-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 4px;
  color: var(--ink);
}

.text-muted {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 0;
}

.groups-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;
}

.groups-toolbar .input {
  flex: 1;
}

.empty-hint {
  font-size: 15px;
  color: var(--ink-soft);
  margin: 0;
  padding: 20px 0;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  width: 100%;
}

.group-card:hover {
  box-shadow: var(--shadow);
}

.group-card-info {
  flex: 1;
  min-width: 0;
}

.group-card-info strong {
  font-size: 16px;
  display: block;
}

.group-card-sub {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-card-meta {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 4px 0 0;
}

.group-card-chevron {
  width: 18px;
  height: 18px;
  stroke: var(--ink-soft);
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}
</style>
