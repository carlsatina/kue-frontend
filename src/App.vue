<template>
  <div class="app-shell" :class="{ 'bracket-shell': route.path === '/tournament' || route.path === '/pairing' }">
    <header v-if="!route.meta.hideHeader" class="header">
      <div class="brand">
        <img src="./assets/KuePro.png" alt="KuePro" class="brand-logo" />
        <span v-if="showProfile" class="brand-session">{{ brandSessionLabel }}</span>
      </div>
      <!-- Desktop nav lives inside the header -->
      <div v-if="showNav" class="header-center">
        <nav class="desktop-nav" :class="navClass">
          <router-link to="/" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M4 10.5l8-6 8 6v7a2 2 0 0 1-2 2h-4.5v-6h-3v6H6a2 2 0 0 1-2-2v-7z"/></svg></span>
            <span class="nav-label">Home</span>
          </router-link>
          <router-link to="/players" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13.5 19c.3-2.1 1.9-3.8 4.1-3.8 2.2 0 3.9 1.7 4.1 3.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            <span class="nav-label">Players</span>
          </router-link>
          <router-link v-if="showTeamsNav" to="/teams" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><circle cx="7.5" cy="9" r="2.5"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M11.5 19c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            <span class="nav-label">Teams</span>
          </router-link>
          <router-link to="/rankings" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M4 20h4V9H4v11zm6 0h4V4h-4v16zm6 0h4v-7h-4v7z"/></svg></span>
            <span class="nav-label">Rank</span>
          </router-link>
          <router-link to="/tournament" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M5 4h6v4H9v4h6v-4h-2V4h6v6h-4v4h-6v-4H5V4z"/></svg></span>
            <span class="nav-label">Bracket</span>
          </router-link>
          <router-link to="/fees" class="nav-item">
            <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M6 12h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16.5" cy="12" r="2.5"/></svg></span>
            <span class="nav-label">Fees</span>
          </router-link>
        </nav>
      </div>
      <div v-if="showProfile" class="profile-menu" ref="profileMenuRef">
        <button
          class="profile-button"
          type="button"
          :class="{ open: showProfileMenu }"
          :aria-expanded="showProfileMenu"
          aria-haspopup="menu"
          @click="toggleProfileMenu"
        >
          <span class="profile-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <circle cx="12" cy="8" r="3.5"/>
              <path d="M4.5 19c0-3.2 3.2-5.5 7.5-5.5S19.5 15.8 19.5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="profile-label">Profile</span>
        </button>

        <transition name="menu-pop">
          <div v-if="showProfileMenu" class="profile-popup" role="menu">
            <div class="profile-popup-head">
              <div class="profile-popup-avatar">{{ userInitials }}</div>
              <div class="profile-popup-meta">
                <div class="profile-popup-email">{{ userEmail || "Signed in" }}</div>
                <div class="profile-popup-sub">{{ activeSession ? activeSession.name : "No active session" }}</div>
              </div>
            </div>

            <div v-if="workspaces.length" class="profile-popup-workspaces">
              <div class="ppw-label">Workspace</div>
              <button
                v-for="w in workspaces"
                :key="w.id"
                class="ppw-item"
                :class="{ active: w.id === activeWorkspaceId }"
                type="button"
                role="menuitemradio"
                :aria-checked="w.id === activeWorkspaceId"
                :disabled="workspaceSwitching"
                @click="switchToWorkspace(w.id)"
              >
                <span class="ppw-avatar">{{ (w.name || "?").trim().charAt(0).toUpperCase() }}</span>
                <span class="ppw-meta">
                  <span class="ppw-name">{{ w.name }}</span>
                  <span class="ppw-role">{{ w.role === "owner" ? "Your workspace" : "Collaborator" }}</span>
                </span>
                <span v-if="w.id === activeWorkspaceId" class="ppw-check" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.55 17.05 4.5 12l1.4-1.4 3.65 3.6 8.15-8.15L19.1 7.5z"/></svg>
                </span>
              </button>
              <button class="ppw-manage" type="button" @click="openWorkspaces">
                <span class="ppw-plus" aria-hidden="true">+</span> Create or manage workspaces
              </button>
            </div>

            <div class="profile-popup-items">
              <button class="profile-popup-item" type="button" role="menuitem" @click="openSwitchSession">
                <span class="ppi-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img"><path d="M7 7h11l-3-3M17 17H6l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                <span class="ppi-text">
                  <span class="ppi-title">Switch Session</span>
                  <span class="ppi-sub">Jump to another active session</span>
                </span>
              </button>
              <button class="profile-popup-item" type="button" role="menuitem" @click="goManageSessions">
                <span class="ppi-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img"><rect x="4" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                </span>
                <span class="ppi-text">
                  <span class="ppi-title">Manage Session</span>
                  <span class="ppi-sub">Active &amp; past sessions</span>
                </span>
              </button>
              <button class="profile-popup-item" type="button" role="menuitem" @click="openAssistants">
                <span class="ppi-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img"><circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 19c0-2.8 2.5-4.8 5.5-4.8s5.5 2 5.5 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 8.2a2.6 2.6 0 1 1 0 5.2M17 19c0-2.4-1-4.3-3-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </span>
                <span class="ppi-text">
                  <span class="ppi-title">Collaborators</span>
                  <span class="ppi-sub">Invite people to collaborate</span>
                </span>
              </button>
              <button class="profile-popup-item" type="button" role="menuitem" @click="goProfile">
                <span class="ppi-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 19c0-3.2 3.2-5.5 7.5-5.5S19.5 15.8 19.5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </span>
                <span class="ppi-text">
                  <span class="ppi-title">Profile</span>
                  <span class="ppi-sub">Account &amp; access details</span>
                </span>
              </button>
            </div>

            <div class="profile-popup-foot">
              <button class="profile-popup-logout" type="button" @click="logout">Log out</button>
            </div>
          </div>
        </transition>
      </div>
    </header>

    <router-view v-slot="{ Component }">
      <transition :name="transitionName">
        <component v-if="Component" :is="Component" :key="route.path" />
      </transition>
    </router-view>

    <!-- Mobile bottom nav lives OUTSIDE the header — no sticky/backdrop-filter interference -->
    <nav v-if="showNav" class="mobile-nav" :class="navClass">
      <router-link to="/" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M4 10.5l8-6 8 6v7a2 2 0 0 1-2 2h-4.5v-6h-3v6H6a2 2 0 0 1-2-2v-7z"/></svg></span>
        <span class="nav-label">Home</span>
      </router-link>
      <router-link to="/players" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13.5 19c.3-2.1 1.9-3.8 4.1-3.8 2.2 0 3.9 1.7 4.1 3.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
        <span class="nav-label">Players</span>
      </router-link>
      <router-link v-if="showTeamsNav" to="/teams" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><circle cx="7.5" cy="9" r="2.5"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M11.5 19c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
        <span class="nav-label">Teams</span>
      </router-link>
      <router-link to="/rankings" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M4 20h4V9H4v11zm6 0h4V4h-4v16zm6 0h4v-7h-4v7z"/></svg></span>
        <span class="nav-label">Rank</span>
      </router-link>
      <router-link to="/tournament" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M5 4h6v4H9v4h6v-4h-2V4h6v6h-4v4h-6v-4H5V4z"/></svg></span>
        <span class="nav-label">Bracket</span>
      </router-link>
      <router-link to="/fees" class="nav-item">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M6 12h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16.5" cy="12" r="2.5"/></svg></span>
        <span class="nav-label">Fees</span>
      </router-link>
    </nav>

    <GameLoadingModal
      v-if="showGlobalLoadingModal"
      title="Loading Match Data"
      message="Fetching the latest courts, queues, and rankings."
    />

    <div v-if="showSwitchSession" class="modal-backdrop" @click.self="closeSwitchSession">
      <div class="modal-card switch-session">
        <div class="switch-head">
          <div>
            <h3>Switch Session</h3>
            <div class="subtitle compact">Choose an active session to work in.</div>
          </div>
          <button class="switch-close" type="button" aria-label="Close" @click="closeSwitchSession">×</button>
        </div>

        <div v-if="liveSessions.length === 0" class="switch-empty">
          No active sessions yet. Create one to get started.
        </div>
        <div v-else class="switch-list">
          <button
            v-for="s in liveSessions"
            :key="s.id"
            class="switch-item"
            :class="{ active: s.id === selectedSessionId }"
            type="button"
            @click="chooseSession(s.id)"
          >
            <span class="switch-dot" aria-hidden="true"></span>
            <span class="switch-info">
              <span class="switch-name">{{ s.name }}<span v-if="s.location?.trim()" class="switch-location"> @ 📍{{ s.location.trim() }}</span></span>
              <span class="switch-sub">{{ s.mode }} · {{ s.gameType }}</span>
            </span>
            <span v-if="s.id === selectedSessionId" class="switch-current">Current</span>
            <svg v-else class="switch-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

        <button class="button ghost switch-create" type="button" @click="createFromSwitch">+ Create Session</button>
      </div>
    </div>

    <!-- Assistants (workspace collaborators) -->
    <div v-if="showAssistants" class="modal-backdrop" @click.self="closeAssistants">
      <div class="modal-card assistants-card">
        <div class="assistants-head">
          <h3>Collaborators</h3>
          <p class="subtitle compact">Invite people to collaborate. Collaborators share your workspace — they can view, create, and manage all of your sessions.</p>
        </div>

        <form class="assistant-invite-form" @submit.prevent="sendInvite">
          <label class="field-label" for="assistant-email">Invite by email</label>
          <div class="assistant-invite-row">
            <input
              id="assistant-email"
              class="input"
              type="email"
              inputmode="email"
              autocomplete="off"
              placeholder="name@email.com"
              v-model="inviteEmail"
              :disabled="inviting"
            />
            <button class="button" type="submit" :disabled="inviting || !inviteEmail.trim()">
              {{ inviting ? "Sending…" : "Send" }}
            </button>
          </div>
          <div v-if="assistantError" class="notice danger">{{ assistantError }}</div>
          <div v-if="inviteNotice" class="notice success">{{ inviteNotice }}</div>
        </form>

        <div v-if="assistantLoading" class="assistants-empty">Loading…</div>
        <template v-else>
          <div class="assistant-group">
            <div class="assistant-group-label">Members</div>
            <ul class="assistant-list">
              <li v-for="m in members" :key="m.userId" class="assistant-row">
                <div class="assistant-avatar">{{ initialsFor(m) }}</div>
                <div class="assistant-row-meta">
                  <div class="assistant-row-name">{{ m.fullName || m.email }}</div>
                  <div class="assistant-row-sub">{{ m.email }}</div>
                </div>
                <span v-if="m.role === 'owner'" class="assistant-tag owner">Owner</span>
                <button
                  v-else
                  class="assistant-remove"
                  type="button"
                  aria-label="Remove collaborator"
                  :disabled="assistantBusy"
                  @click="removeMember(m)"
                >
                  ✕
                </button>
              </li>
            </ul>
          </div>

          <div v-if="pending.length" class="assistant-group">
            <div class="assistant-group-label">Pending invites</div>
            <ul class="assistant-list">
              <li v-for="inv in pending" :key="inv.id" class="assistant-row">
                <div class="assistant-avatar pending">✉</div>
                <div class="assistant-row-meta">
                  <div class="assistant-row-name">{{ inv.email }}</div>
                  <div class="assistant-row-sub">Invited · awaiting acceptance</div>
                </div>
                <button
                  class="assistant-remove"
                  type="button"
                  aria-label="Revoke invite"
                  :disabled="assistantBusy"
                  @click="revokeInvite(inv)"
                >
                  ✕
                </button>
              </li>
            </ul>
          </div>
        </template>

        <button class="button ghost" type="button" @click="closeAssistants">Done</button>
      </div>
    </div>

    <!-- Workspaces (create / switch / rename / delete) -->
    <div v-if="showWorkspaces" class="modal-backdrop" @click.self="closeWorkspaces">
      <div class="modal-card assistants-card workspaces-card">
        <div class="assistants-head">
          <h3>Workspaces</h3>
          <p class="subtitle compact">Each workspace has its own sessions, courts, players, and teams. Switch between them, or create a new one.</p>
        </div>

        <form class="assistant-invite-form" @submit.prevent="submitCreateWorkspace">
          <label class="field-label" for="new-workspace">Create a workspace</label>
          <div class="assistant-invite-row">
            <input
              id="new-workspace"
              class="input"
              type="text"
              placeholder="e.g. Tuesday League"
              v-model="newWorkspaceName"
              :disabled="workspaceBusy"
            />
            <button class="button" type="submit" :disabled="workspaceBusy || !newWorkspaceName.trim()">
              {{ workspaceBusy ? "Working…" : "Create" }}
            </button>
          </div>
          <div v-if="workspaceError" class="notice danger">{{ workspaceError }}</div>
        </form>

        <div class="assistant-group">
          <div class="assistant-group-label">Your workspaces</div>
          <ul class="assistant-list">
            <li v-for="w in workspaces" :key="w.id" class="assistant-row">
              <div class="assistant-avatar">{{ (w.name || "?").trim().charAt(0).toUpperCase() }}</div>
              <div v-if="renamingId === w.id" class="assistant-row-meta">
                <input class="input compact" v-model="renameName" :disabled="workspaceBusy" @keyup.enter="submitRename" />
              </div>
              <div v-else class="assistant-row-meta">
                <div class="assistant-row-name">
                  {{ w.name }}
                  <span v-if="w.id === activeWorkspaceId" class="ws-active-dot" title="Active">●</span>
                </div>
                <div class="assistant-row-sub">{{ w.role === "owner" ? "Owner" : "Collaborator" }}</div>
              </div>

              <div class="ws-actions">
                <template v-if="renamingId === w.id">
                  <button class="ws-icon" type="button" :disabled="workspaceBusy" @click="submitRename" title="Save">✓</button>
                  <button class="ws-icon" type="button" :disabled="workspaceBusy" @click="renamingId = ''" title="Cancel">✕</button>
                </template>
                <template v-else>
                  <button
                    v-if="w.id !== activeWorkspaceId"
                    class="ws-switch"
                    type="button"
                    :disabled="workspaceSwitching || workspaceBusy"
                    @click="switchToWorkspace(w.id)"
                  >
                    Switch
                  </button>
                  <button v-if="w.role === 'owner'" class="ws-icon" type="button" :disabled="workspaceBusy" @click="startRename(w)" title="Rename">✎</button>
                  <button v-if="w.role === 'owner'" class="ws-icon danger" type="button" :disabled="workspaceBusy" @click="confirmDeleteWorkspace(w)" title="Delete">🗑</button>
                </template>
              </div>
            </li>
          </ul>
        </div>

        <button class="button ghost" type="button" @click="closeWorkspaces">Done</button>
      </div>
    </div>

    <div v-if="showCreateSession" class="modal-backdrop">
      <div class="modal-card session-create">
        <h3>Create Session</h3>
        <div class="field">
          <label class="field-label">Session name</label>
          <input class="input" v-model="newSessionName" />
        </div>
        <div class="field">
          <label class="field-label">Location</label>
          <input class="input" v-model="newLocation" placeholder="e.g. Court 1 Sports Hall" />
        </div>
        <div class="field-grid two">
          <div class="field">
            <label class="field-label">Start time</label>
            <input class="input" v-model="newStartsAt" type="datetime-local" />
          </div>
          <div class="field">
            <label class="field-label">End time</label>
            <input class="input" v-model="newEndsAt" type="datetime-local" />
          </div>
        </div>
        <div class="field-grid two">
          <div class="field">
            <label class="field-label">Game type</label>
            <select class="input" v-model="newGameType">
              <option value="doubles">Doubles</option>
              <option value="singles">Singles</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Session mode</label>
            <select class="input" v-model="newSessionMode">
              <option value="usual">Usual</option>
              <option value="tournament">Tournament</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Fee amount</label>
          <input class="input" v-model.number="newFeeAmount" type="number" min="0" />
        </div>
        <label class="radio-row">
          <input type="checkbox" v-model="newRequirePayment" />
          Require payment to join
        </label>
        <div v-if="newRequirePayment" class="field">
          <label class="field-label">Payment deadline</label>
          <input class="input" v-model="newPaymentDeadline" type="datetime-local" />
        </div>
        <div class="field">
          <label class="field-label">Join limits</label>
          <p class="field-hint">Max players allowed to join via the share link. <strong>Regular</strong> = returning players, <strong>New joiner</strong> = first-timers. Set 0 for no limit.</p>
        </div>
        <div class="join-limits-row">
          <div class="field field-inline">
            <label class="field-label">Regular</label>
            <input class="input" type="number" min="0" v-model.number="newRegularJoinLimit" />
          </div>
          <div class="field field-inline">
            <label class="field-label">New joiner</label>
            <input class="input" type="number" min="0" v-model.number="newJoinerLimit" />
          </div>
        </div>
        <div v-if="createError" class="notice">{{ createError }}</div>
        <div class="field-grid two create-actions">
          <button class="button ghost" @click="closeCreateSession">Cancel</button>
          <button class="button" @click="submitCreateSession">Create Session</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, isReadingFromBackend } from "./api.js";
import { track } from "./utils/analytics.js";
import { pendingSessionId, selectedSessionId, setPendingSessionId, setSelectedSessionId } from "./state/sessionStore.js";
import {
  workspaces,
  activeWorkspaceId,
  loadWorkspaces,
  switchWorkspace,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  resetWorkspaces
} from "./state/workspaceStore.js";
import GameLoadingModal from "./components/GameLoadingModal.vue";

// Create session modal state
const showCreateSession = ref(false);
const newSessionName = ref("Evening Open Play");
const newLocation = ref("");
const newStartsAt = ref("");
const newEndsAt = ref("");
const newGameType = ref("doubles");
const newSessionMode = ref("usual");
const newFeeAmount = ref(100);
const newRequirePayment = ref(false);
const newPaymentDeadline = ref("");
const newRegularJoinLimit = ref(0);
const newJoinerLimit = ref(0);
const createError = ref("");

const route = useRoute();
const router = useRouter();

// Profile popup menu + switch-session modal state
const showProfileMenu = ref(false);
const profileMenuRef = ref(null);
const showSwitchSession = ref(false);

// Assistants (workspace collaborators) modal
const showAssistants = ref(false);
const assistantLoading = ref(false);
const assistantBusy = ref(false);
const assistantError = ref("");
const members = ref([]);
const pending = ref([]);
const inviteEmail = ref("");
const inviting = ref(false);
const inviteNotice = ref("");

// Workspace switcher + management (owned workspaces + ones they collaborate in)
const workspaceSwitching = ref(false);
const showWorkspaces = ref(false);
const workspaceBusy = ref(false);
const workspaceError = ref("");
const newWorkspaceName = ref("");
const renamingId = ref("");
const renameName = ref("");

const transitionName = ref("page-fade");
router.beforeEach((to, from) => {
  const toDepth = to.meta.depth ?? 1;
  const fromDepth = from.meta.depth ?? 1;
  if (toDepth > fromDepth) transitionName.value = "slide-left";
  else if (toDepth < fromDepth) transitionName.value = "slide-right";
  else transitionName.value = "page-fade";
});

const authTick = ref(0);
const authed = computed(() => {
  authTick.value;
  return Boolean(localStorage.getItem("token"));
});
const showProfile = computed(() => authed.value && !route.meta.public);

function decodeTokenPayload(token) {
  if (!token) return null;
  try {
    const base64 = token.split(".")[1];
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}
const userEmail = computed(() => {
  authTick.value;
  return decodeTokenPayload(localStorage.getItem("token"))?.email || "";
});
const userInitials = computed(() => {
  const email = userEmail.value;
  return email ? email.trim().charAt(0).toUpperCase() : "U";
});
const showNav = computed(() => !route.meta.public && authed.value);
const sessions = ref([]);
const liveSessions = computed(() => sessions.value.filter((s) => s.status === "open"));
const showGlobalLoadingModal = ref(false);
let loadingTimer = null;
let hideLoadingTimer = null;
const activeSession = computed(() => {
  const selected = liveSessions.value.find((session) => session.id === selectedSessionId.value);
  return selected || liveSessions.value[0] || null;
});
const brandSessionLabel = computed(() => {
  if (!activeSession.value) return "No active session";
  const location = activeSession.value.location?.trim();
  return location ? `${activeSession.value.name} @ 📍${location}` : activeSession.value.name;
});
const showTeamsNav = computed(() => {
  if (!activeSession.value) return true;
  return activeSession.value.mode === "tournament";
});
const navClass = computed(() => (showTeamsNav.value ? "nav-6" : "nav-5"));

function openCreateSession() {
  createError.value = "";
  newSessionName.value = "Evening Open Play";
  newGameType.value = "doubles";
  newSessionMode.value = "usual";
  newFeeAmount.value = 100;
  newRequirePayment.value = false;
  newPaymentDeadline.value = "";
  newRegularJoinLimit.value = 0;
  newJoinerLimit.value = 0;
  showCreateSession.value = true;
}

function closeCreateSession() {
  showCreateSession.value = false;
  createError.value = "";
}

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
}
function closeProfileMenu() {
  showProfileMenu.value = false;
}

function openSwitchSession() {
  closeProfileMenu();
  showSwitchSession.value = true;
}
function closeSwitchSession() {
  showSwitchSession.value = false;
}
function chooseSession(id) {
  setSelectedSessionId(id);
  closeSwitchSession();
}
function createFromSwitch() {
  closeSwitchSession();
  openCreateSession();
}

// ── Assistants ─────────────────────────────────────────────────────
function initialsFor(m) {
  return (m.fullName || m.email || "?").trim().slice(0, 1).toUpperCase();
}
function openAssistants() {
  closeProfileMenu();
  showAssistants.value = true;
  assistantError.value = "";
  inviteNotice.value = "";
  inviteEmail.value = "";
  members.value = [];
  pending.value = [];
  loadAssistants();
}
async function loadAssistants() {
  assistantLoading.value = true;
  assistantError.value = "";
  try {
    const data = await api.listAssistants();
    members.value = data.members || [];
    pending.value = data.pending || [];
  } catch (err) {
    assistantError.value = err.message || "Unable to load assistants";
  } finally {
    assistantLoading.value = false;
  }
}
async function sendInvite() {
  const email = inviteEmail.value.trim();
  if (!email) return;
  inviting.value = true;
  assistantError.value = "";
  inviteNotice.value = "";
  try {
    await api.inviteAssistant(email);
    track("assistant-invited");
    inviteNotice.value = `Invite sent to ${email}.`;
    inviteEmail.value = "";
    await loadAssistants();
  } catch (err) {
    assistantError.value = err.message || "Unable to send invite";
  } finally {
    inviting.value = false;
  }
}
async function revokeInvite(inv) {
  assistantBusy.value = true;
  assistantError.value = "";
  try {
    await api.revokeAssistantInvite(inv.id);
    await loadAssistants();
  } catch (err) {
    assistantError.value = err.message || "Unable to revoke invite";
  } finally {
    assistantBusy.value = false;
  }
}
async function removeMember(m) {
  assistantBusy.value = true;
  assistantError.value = "";
  try {
    await api.removeAssistant(m.userId);
    await loadAssistants();
  } catch (err) {
    assistantError.value = err.message || "Unable to remove assistant";
  } finally {
    assistantBusy.value = false;
  }
}
function closeAssistants() {
  showAssistants.value = false;
  members.value = [];
  pending.value = [];
  inviteEmail.value = "";
  inviteNotice.value = "";
  assistantError.value = "";
}

async function loadUserWorkspaces() {
  if (!authed.value || route.meta.public) return;
  try {
    await loadWorkspaces();
  } catch {
    // Non-fatal: the picker just stays hidden if this fails.
  }
}

async function switchToWorkspace(id) {
  if (!id || id === activeWorkspaceId.value || workspaceSwitching.value) {
    closeProfileMenu();
    return;
  }
  workspaceSwitching.value = true;
  try {
    await switchWorkspace(id); // clears the selected session for us
    await loadSessions();
    track("workspace-switched");
    closeProfileMenu();
    closeWorkspaces();
    if (route.path !== "/") router.push("/");
  } catch (err) {
    workspaceError.value = err.message || "Unable to switch workspace";
  } finally {
    workspaceSwitching.value = false;
  }
}

function openWorkspaces() {
  closeProfileMenu();
  workspaceError.value = "";
  newWorkspaceName.value = "";
  renamingId.value = "";
  renameName.value = "";
  showWorkspaces.value = true;
  loadUserWorkspaces();
}
function closeWorkspaces() {
  showWorkspaces.value = false;
  renamingId.value = "";
}
async function submitCreateWorkspace() {
  const name = newWorkspaceName.value.trim();
  if (!name || workspaceBusy.value) return;
  workspaceBusy.value = true;
  workspaceError.value = "";
  try {
    await createWorkspace(name); // server auto-switches into the new workspace
    newWorkspaceName.value = "";
    await loadSessions();
    track("workspace-created");
    closeWorkspaces();
    if (route.path !== "/") router.push("/");
  } catch (err) {
    workspaceError.value = err.message || "Unable to create workspace";
  } finally {
    workspaceBusy.value = false;
  }
}
function startRename(w) {
  renamingId.value = w.id;
  renameName.value = w.name;
  workspaceError.value = "";
}
async function submitRename() {
  const name = renameName.value.trim();
  if (!name || workspaceBusy.value) return;
  workspaceBusy.value = true;
  workspaceError.value = "";
  try {
    await renameWorkspace(renamingId.value, name);
    renamingId.value = "";
  } catch (err) {
    workspaceError.value = err.message || "Unable to rename workspace";
  } finally {
    workspaceBusy.value = false;
  }
}
async function confirmDeleteWorkspace(w) {
  if (workspaceBusy.value) return;
  if (!window.confirm(`Delete "${w.name}"? This permanently removes its sessions, courts, players, and teams.`)) {
    return;
  }
  workspaceBusy.value = true;
  workspaceError.value = "";
  try {
    await deleteWorkspace(w.id);
    await loadSessions();
    if (route.path !== "/") router.push("/");
  } catch (err) {
    workspaceError.value = err.message || "Unable to delete workspace";
  } finally {
    workspaceBusy.value = false;
  }
}

function goManageSessions() {
  closeProfileMenu();
  router.push("/sessions");
}
function goProfile() {
  closeProfileMenu();
  router.push("/profile");
}
function logout() {
  closeProfileMenu();
  localStorage.removeItem("token");
  resetWorkspaces();
  window.dispatchEvent(new Event("auth:changed"));
  router.push("/login");
}

function handleDocPointer(e) {
  if (!showProfileMenu.value) return;
  if (profileMenuRef.value && !profileMenuRef.value.contains(e.target)) {
    closeProfileMenu();
  }
}
function handleKeydown(e) {
  if (e.key === "Escape") {
    closeProfileMenu();
    closeSwitchSession();
    closeAssistants();
    closeWorkspaces();
  }
}

async function submitCreateSession() {
  createError.value = "";
  try {
    const created = await api.createSession({
      name: newSessionName.value,
      location: newLocation.value.trim() || undefined,
      startsAt: newStartsAt.value ? new Date(newStartsAt.value).toISOString() : undefined,
      endsAt: newEndsAt.value ? new Date(newEndsAt.value).toISOString() : undefined,
      gameType: newGameType.value,
      mode: newSessionMode.value,
      feeMode: "flat",
      feeAmount: Number(newFeeAmount.value),
      requirePaymentToJoin: Boolean(newRequirePayment.value),
      paymentDeadline: newPaymentDeadline.value ? new Date(newPaymentDeadline.value).toISOString() : null,
      regularJoinLimit: Math.max(0, Number(newRegularJoinLimit.value) || 0),
      newJoinerLimit: Math.max(0, Number(newJoinerLimit.value) || 0),
    });
    await api.openSession(created.id);
    track("session-created", { mode: newSessionMode.value, gameType: newGameType.value });
    setPendingSessionId(created.id);
    showCreateSession.value = false;
    await loadSessions();
    setSelectedSessionId(created.id);
    // Take the user to the dashboard to start working with the new session
    // (also avoids leaving stale lists like Manage Sessions on screen).
    if (route.path !== "/") router.push("/");
  } catch (err) {
    createError.value = err.message || "Unable to create session";
  }
}

const activeSessionId = computed(() => liveSessions.value[0]?.id || "");

async function loadSessions() {
  if (!authed.value || route.meta.public) return;
  try {
    const list = await api.listSessions();
    sessions.value = list || [];
  } catch {
    sessions.value = [];
  }

  if (!liveSessions.value.length) {
    setSelectedSessionId("");
    return;
  }
  if (pendingSessionId.value) {
    const pending = liveSessions.value.find((s) => s.id === pendingSessionId.value);
    if (pending) {
      setSelectedSessionId(pending.id);
      setPendingSessionId("");
      return;
    }
  }
  const exists = liveSessions.value.some((s) => s.id === selectedSessionId.value);
  if (!exists) {
    setSelectedSessionId(activeSessionId.value || liveSessions.value[0].id);
  }
}

function handleSessionsUpdated() {
  loadSessions();
}

function handleAuthChanged() {
  authTick.value += 1;
}

watch(
  () => route.fullPath,
  () => {
    closeProfileMenu();
    loadSessions();
  }
);

watch(authed, (isAuthed) => {
  if (isAuthed) {
    loadSessions();
    loadUserWorkspaces();
  } else {
    sessions.value = [];
    setSelectedSessionId("");
    resetWorkspaces();
  }
});

watch(
  isReadingFromBackend,
  (isLoading) => {
    if (isLoading) {
      // A new request started — cancel any pending hide so brief gaps
      // between sequential requests don't flicker the modal off and on.
      if (hideLoadingTimer) {
        window.clearTimeout(hideLoadingTimer);
        hideLoadingTimer = null;
      }
      if (loadingTimer || showGlobalLoadingModal.value) return;
      loadingTimer = window.setTimeout(() => {
        showGlobalLoadingModal.value = true;
        loadingTimer = null;
      }, 180);
      return;
    }
    // No active requests. If the modal never showed, just cancel the pending show.
    if (loadingTimer) {
      window.clearTimeout(loadingTimer);
      loadingTimer = null;
    }
    if (!showGlobalLoadingModal.value || hideLoadingTimer) return;
    // Debounce the hide so the counter momentarily reaching 0 between
    // back-to-back requests keeps the modal up instead of flickering.
    hideLoadingTimer = window.setTimeout(() => {
      showGlobalLoadingModal.value = false;
      hideLoadingTimer = null;
    }, 220);
  },
  { immediate: true }
);

// Lock background scrolling whenever any modal (.modal-backdrop) is open.
let modalObserver = null;
function syncModalScrollLock() {
  const open = Boolean(document.querySelector(".modal-backdrop"));
  document.documentElement.classList.toggle("modal-open", open);
}

onMounted(() => {
  loadSessions();
  loadUserWorkspaces();
  document.addEventListener("sessions:updated", handleSessionsUpdated);
  document.addEventListener("createSession:open", openCreateSession);
  window.addEventListener("auth:changed", handleAuthChanged);
  window.addEventListener("storage", handleAuthChanged);
  document.addEventListener("pointerdown", handleDocPointer);
  window.addEventListener("keydown", handleKeydown);
  modalObserver = new MutationObserver(syncModalScrollLock);
  modalObserver.observe(document.body, { childList: true, subtree: true });
  syncModalScrollLock();
});

onUnmounted(() => {
  if (loadingTimer) {
    window.clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  if (hideLoadingTimer) {
    window.clearTimeout(hideLoadingTimer);
    hideLoadingTimer = null;
  }
  document.removeEventListener("sessions:updated", handleSessionsUpdated);
  document.removeEventListener("createSession:open", openCreateSession);
  window.removeEventListener("auth:changed", handleAuthChanged);
  window.removeEventListener("storage", handleAuthChanged);
  document.removeEventListener("pointerdown", handleDocPointer);
  window.removeEventListener("keydown", handleKeydown);
  if (modalObserver) {
    modalObserver.disconnect();
    modalObserver = null;
  }
  document.documentElement.classList.remove("modal-open");
});
</script>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.brand-logo {
  height: 44px;
  width: auto;
  display: block;
  flex-shrink: 0;
}
.brand-session {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(21, 101, 192, 0.1);
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Profile popup menu */
.profile-menu {
  position: relative;
  flex-shrink: 0;
}

.profile-button {
  cursor: pointer;
}
.profile-button.open {
  opacity: 0.92;
  box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.18);
}

.profile-popup {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 280px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  z-index: 120;
}

.profile-popup-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, var(--accent), #1e88e5);
  color: #fff;
}
.profile-popup-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.22);
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}
.profile-popup-meta {
  min-width: 0;
}
.profile-popup-email {
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-popup-sub {
  font-size: 12px;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-popup-workspaces {
  padding: 8px 8px 4px;
  display: grid;
  gap: 2px;
  border-bottom: 1px solid var(--border);
}
.ppw-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft, #64748b);
  padding: 2px 8px 4px;
}
.ppw-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.ppw-item:hover:not(:disabled) {
  background: var(--bg-1, rgba(21, 101, 192, 0.06));
}
.ppw-item.active {
  background: rgba(21, 101, 192, 0.1);
}
.ppw-item:disabled {
  opacity: 0.6;
  cursor: default;
}
.ppw-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(21, 101, 192, 0.14);
  color: var(--accent);
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.ppw-meta {
  min-width: 0;
  display: grid;
  flex: 1;
}
.ppw-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ppw-role {
  font-size: 12px;
  color: var(--ink-soft, #64748b);
}
.ppw-check {
  color: var(--accent);
  flex-shrink: 0;
}
.ppw-check svg {
  width: 18px;
  height: 18px;
}
.ppw-manage {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  margin-top: 2px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--accent);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.ppw-manage:hover {
  background: var(--bg-1, rgba(21, 101, 192, 0.06));
}
.ppw-plus {
  font-size: 16px;
  line-height: 1;
}

/* Workspaces modal rows */
.ws-active-dot {
  color: #0f9d8a;
  font-size: 10px;
  vertical-align: middle;
  margin-left: 4px;
}
.ws-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  /* When the row is too narrow, drop the actions onto their own line, aligned
     right, instead of overflowing the modal on mobile. */
  margin-left: auto;
}
/* Keep every workspace row inside the card on small screens: let the action
   cluster wrap to its own line rather than spilling past the right edge. */
.workspaces-card {
  overflow-x: hidden;
}
.workspaces-card .assistant-row {
  flex-wrap: wrap;
  row-gap: 8px;
}
.workspaces-card .assistant-row-meta {
  /* Ensure the name column can still shrink so short rows don't wrap needlessly. */
  flex: 1 1 120px;
}
.workspaces-card .assistant-invite-row {
  flex-wrap: wrap;
}
.workspaces-card .assistant-invite-row .input {
  flex: 1 1 160px;
}
.ws-switch {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--accent);
  font-weight: 600;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.ws-switch:hover:not(:disabled) {
  background: rgba(21, 101, 192, 0.08);
}
.ws-icon {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 5px;
  border-radius: 8px;
  color: var(--ink-soft, #64748b);
}
.ws-icon:hover:not(:disabled) {
  background: var(--bg-1, rgba(21, 101, 192, 0.06));
}
.ws-icon.danger:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.1);
}
.ws-icon:disabled,
.ws-switch:disabled {
  opacity: 0.5;
  cursor: default;
}
.input.compact {
  padding: 6px 8px;
  font-size: 14px;
}

.profile-popup-items {
  padding: 8px;
  display: grid;
  gap: 2px;
}
.profile-popup-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 10px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.14s;
}
.profile-popup-item:hover {
  background: var(--bg-1);
}
.ppi-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--bg-1);
  color: var(--accent);
  flex-shrink: 0;
}
.ppi-icon svg {
  width: 20px;
  height: 20px;
}
.ppi-text {
  display: grid;
  gap: 1px;
  min-width: 0;
}
.ppi-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
}
.ppi-sub {
  font-size: 12px;
  color: var(--ink-soft);
}

.profile-popup-foot {
  padding: 8px;
  border-top: 1px solid var(--border);
}
.profile-popup-logout {
  width: 100%;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 10px;
  color: var(--accent-3);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.14s;
}
.profile-popup-logout:hover {
  background: rgba(185, 28, 28, 0.08);
}

/* Popup transition */
.menu-pop-enter-active,
.menu-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
  transform-origin: top right;
}
.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

/* Switch session modal */
.switch-session {
  width: min(440px, 100%);
}
.switch-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.switch-head h3 {
  margin: 0;
}
.switch-close {
  border: none;
  background: var(--bg-1);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: 20px;
  line-height: 1;
  color: var(--ink-soft);
  cursor: pointer;
  flex-shrink: 0;
}
.switch-close:hover {
  background: var(--bg-2);
}
.switch-empty {
  padding: 20px;
  text-align: center;
  color: var(--ink-soft);
  background: var(--bg-0);
  border-radius: 12px;
}
.switch-list {
  display: grid;
  gap: 8px;
  max-height: 46vh;
  overflow-y: auto;
}
.switch-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  background: var(--card);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.14s, background 0.14s;
}
.switch-item:hover {
  border-color: var(--accent);
  background: var(--bg-1);
}
.switch-item.active {
  border-color: var(--accent);
  background: var(--bg-1);
}
.switch-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-2);
  flex-shrink: 0;
  box-shadow: 0 0 0 4px rgba(0, 137, 123, 0.14);
}
.switch-info {
  display: grid;
  gap: 1px;
  flex: 1 1 auto;
  min-width: 0;
}
.switch-name {
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.switch-sub {
  font-size: 12px;
  color: var(--ink-soft);
  text-transform: capitalize;
}
.switch-location {
  font-weight: 400;
  color: var(--ink-soft);
}
.switch-current {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent);
  flex-shrink: 0;
}
.switch-go {
  width: 18px;
  height: 18px;
  color: var(--ink-soft);
  flex-shrink: 0;
}
.switch-create {
  width: 100%;
}

/* ── Assistants modal ────────────────────────────────────────────── */
.assistants-card {
  display: grid;
  gap: 16px;
  width: 100%;
  max-width: 440px;
}
.assistants-head h3 {
  margin: 0 0 4px;
}
.assistants-head .subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--ink-soft, #64748b);
  line-height: 1.45;
}
.assistant-invite-form {
  display: grid;
  gap: 8px;
}
.assistant-invite-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.assistant-invite-row .input {
  flex: 1 1 auto;
  min-width: 0;
}
/* Keep the action button proportional to the input rather than a chunky pill. */
.assistant-invite-row .button {
  flex: 0 0 auto;
  padding: 10px 16px;
  font-size: 14px;
}
.assistant-group {
  display: grid;
  gap: 8px;
}
.assistant-group-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-soft, #64748b);
}
.assistant-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.assistant-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-1, #f8fafc);
}
.assistant-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}
.assistant-avatar.pending {
  background: rgba(100, 116, 139, 0.18);
  color: var(--ink-soft, #64748b);
}
.assistant-row-meta {
  min-width: 0;
  flex: 1 1 auto;
}
.assistant-row-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.assistant-row-sub {
  font-size: 12px;
  color: var(--ink-soft, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.assistant-tag.owner {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--accent);
  background: rgba(21, 101, 192, 0.12);
  padding: 4px 8px;
  border-radius: 999px;
}
.assistant-remove {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-soft, #64748b);
  font-size: 15px;
  cursor: pointer;
}
.assistant-remove:hover {
  background: rgba(185, 28, 28, 0.1);
  color: var(--accent-3, #b91c1c);
}
.assistant-remove:disabled {
  opacity: 0.5;
  cursor: default;
}
.assistants-empty {
  font-size: 14px;
  color: var(--ink-soft, #64748b);
  text-align: center;
  padding: 8px 0;
}
</style>
