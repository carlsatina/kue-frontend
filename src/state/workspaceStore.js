import { ref } from "vue";
import { api } from "../api.js";
import { setSelectedSessionId } from "./sessionStore.js";

// The active workspace lives server-side (User.activeWorkspaceId); this store is
// a client-side cache of the list plus the active id for rendering the picker.
const workspaces = ref([]);
const activeWorkspaceId = ref("");

async function loadWorkspaces() {
  const { workspaces: list } = await api.listWorkspaces();
  workspaces.value = list || [];
  const active = workspaces.value.find((w) => w.active);
  activeWorkspaceId.value = active ? active.id : "";
  return workspaces.value;
}

function markActive(id) {
  activeWorkspaceId.value = id;
  workspaces.value = workspaces.value.map((w) => ({ ...w, active: w.id === id }));
  // Sessions belong to a workspace, so the previous selection no longer applies.
  setSelectedSessionId("");
}

async function switchWorkspace(id) {
  if (!id || id === activeWorkspaceId.value) return;
  await api.switchWorkspace(id);
  markActive(id);
}

async function createWorkspace(name) {
  const ws = await api.createWorkspace(name); // server auto-switches into it
  await loadWorkspaces();
  markActive(ws.id);
  return ws;
}

async function renameWorkspace(id, name) {
  await api.renameWorkspace(id, name);
  workspaces.value = workspaces.value.map((w) => (w.id === id ? { ...w, name } : w));
}

async function deleteWorkspace(id) {
  const res = await api.deleteWorkspace(id); // returns the fallback active workspace
  await loadWorkspaces();
  if (res?.activeWorkspaceId) markActive(res.activeWorkspaceId);
  return res;
}

function resetWorkspaces() {
  workspaces.value = [];
  activeWorkspaceId.value = "";
}

export {
  workspaces,
  activeWorkspaceId,
  loadWorkspaces,
  switchWorkspace,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  resetWorkspaces
};
