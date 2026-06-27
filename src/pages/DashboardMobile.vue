<template>
  <div @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
  <div class="pull-indicator" :class="{ active: isPulling || refreshing }">
    <span v-if="!refreshing">↓ Pull to refresh</span>
    <span v-else>Refreshing…</span>
  </div>
  <div class="dm">

    <!-- ── Session meta ─────────────────────────────────────────── -->
    <div v-if="sessionLocation || sessionSchedule" class="session-meta">
      <div v-if="sessionLocation" class="session-meta-row">
        <svg class="session-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-10.2A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.8C18.5 15.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10.5" r="2.3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        <span>{{ sessionLocation }}</span>
      </div>
      <div v-if="sessionSchedule" class="session-meta-row">
        <svg class="session-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9.5V13l2.5 2M9 2.5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span>{{ sessionSchedule }}</span>
      </div>
    </div>

    <!-- ── Courts ──────────────────────────────────────────────── -->
    <div class="section">
      <div class="section-row">
        <span class="section-title">Courts</span>
        <div class="section-row-actions">
          <button class="pill-btn" :class="{ 'pill-btn-copied': inviteCopied }" @click="createInviteLink">
            <svg v-if="inviteCopied" viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <svg v-else viewBox="0 0 24 24" width="13" height="13"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            {{ inviteCopied ? "Link Copied!" : "Share Link" }}
          </button>
          <button class="pill-btn pill-btn-accent" @click="showAddCourt = true">+ Add</button>
        </div>
      </div>

      <div v-if="courts.length" class="courts-stack">
        <div
          v-for="court in courts"
          :key="court.id"
          class="court-card"
          :class="{ live: court.currentMatchId, maintenance: court.status === 'maintenance' }"
        >
          <!-- Top bar -->
          <div class="cc-bar">
            <div class="cc-id">
              <span class="cc-dot" :class="courtDotClass(court)"></span>
              <span class="cc-name">{{ court.court?.name || court.name }}</span>
            </div>
            <div class="cc-controls">
              <span class="cc-status" :class="courtTagClass(court)">
                {{ courtStatusLabel(court.status) }}
              </span>
              <button class="ic-btn" @click="openEditCourt(court)" aria-label="Edit court">
                <svg viewBox="0 0 24 24"><path d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5z"/></svg>
              </button>
              <button class="ic-btn ic-danger" @click="deleteCourt(court)" aria-label="Delete court">
                <svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7zm3-3h6l1 2H8l1-2z"/></svg>
              </button>
            </div>
          </div>

          <!-- The court -->
          <CourtFloor
            :name="court.court?.name || court.name"
            :state="courtState(court)"
            :team-a="teamNames(court.currentMatch, 1)"
            :team-b="teamNames(court.currentMatch, 2)"
            :empty-text="court.status === 'maintenance' ? 'Under maintenance' : 'Open court — no match yet'"
          />

          <!-- Actions (only for occupied / maintenance courts) -->
          <div v-if="court.status !== 'available'" class="cc-footer">
            <span v-if="court.currentMatch" class="cc-timer">
              <svg class="cc-timer-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9.5V13l2.5 2M9 2.5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              {{ elapsedTime(court.currentMatch?.startedAt) }}
            </span>
            <div class="cc-actions">
              <button
                class="cc-action-btn cc-action-danger"
                @click="cancelMatch(court)"
                :disabled="!court.currentMatchId"
              >
                Cancel
              </button>
              <button
                class="cc-action-btn cc-action-primary"
                @click="openEndMatch(court)"
                :disabled="!court.currentMatchId"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🏸</div>
        <div class="empty-text">No courts yet. Add one to get started.</div>
      </div>
      <div v-if="error" class="error-bar">{{ error }}</div>
    </div>
  </div>

  <!-- ── Modals ────────────────────────────────────────────────── -->
  <div v-if="showAddCourt" class="modal-backdrop">
    <div class="modal-card">
      <h3>Add Court</h3>
      <input class="input" v-model="newCourtName" placeholder="Court name" />
      <input class="input" v-model="newCourtNotes" placeholder="Notes (optional)" />
      <div v-if="addCourtError" class="notice">{{ addCourtError }}</div>
      <div class="grid two">
        <button class="button" @click="createCourt">Create</button>
        <button class="button ghost" @click="closeAddCourt">Cancel</button>
      </div>
    </div>
  </div>
  <div v-if="showEditCourt" class="modal-backdrop">
    <div class="modal-card">
      <h3>Edit Court</h3>
      <input class="input" v-model="editCourtName" placeholder="Court name" />
      <input class="input" v-model="editCourtNotes" placeholder="Notes (optional)" />
      <div v-if="editCourtError" class="notice">{{ editCourtError }}</div>
      <div class="grid two">
        <button class="button" @click="updateCourt">Save</button>
        <button class="button ghost" @click="closeEditCourt">Cancel</button>
      </div>
    </div>
  </div>
  <div v-if="showDeleteCourt" class="modal-backdrop">
    <div class="modal-card">
      <h3>Delete Court</h3>
      <div class="subtitle">Are you sure you want to delete <strong>{{ deleteCourtName }}</strong>?</div>
      <div v-if="deleteCourtError" class="notice">{{ deleteCourtError }}</div>
      <div class="grid two">
        <button class="button ghost" @click="closeDeleteCourt">Cancel</button>
        <button class="button danger button-compact" @click="confirmDeleteCourt">Delete</button>
      </div>
    </div>
  </div>
  <div v-if="showEndMatch" class="modal-backdrop">
    <div class="modal-card match-modal compact">
      <div class="match-modal-head">
        <div>
          <div class="subtitle">Finish the game</div>
          <h3>Complete Match</h3>
        </div>
        <span class="match-burst">🏸</span>
      </div>
      <div class="subtitle">Enter the score — the winner will be decided automatically.</div>
      <div v-if="endMatchError" class="notice">{{ endMatchError }}</div>
      <div class="winner-grid">
        <div class="winner-card team-a">
          <div class="winner-row">
            <div class="winner-info">
              <div class="subtitle">{{ endMatchTeams.teamAName }}</div>
              <strong>{{ endMatchTeams.teamAPlayers }}</strong>
            </div>
            <input class="input winner-score-input" type="number" min="0" v-model="endMatchScoreA" placeholder="Score" />
          </div>
        </div>
        <div class="winner-card team-b">
          <div class="winner-row">
            <div class="winner-info">
              <div class="subtitle">{{ endMatchTeams.teamBName }}</div>
              <strong>{{ endMatchTeams.teamBPlayers }}</strong>
            </div>
            <input class="input winner-score-input" type="number" min="0" v-model="endMatchScoreB" placeholder="Score" />
          </div>
        </div>
      </div>
      <div class="match-modal-actions">
        <button class="button button-compact" @click="finishMatch">Finish</button>
        <button class="button ghost button-compact" @click="closeEndMatch">Cancel</button>
      </div>
    </div>
  </div>
  <div v-if="showInviteLink" class="modal-backdrop">
    <div class="modal-card">
      <h3>Session Share Link</h3>
      <div class="subtitle">Share this link so players can view the live queue and games.</div>
      <div class="share-link">
        <input class="input" readonly :value="inviteLink" />
        <button class="button ghost button-compact" :class="{ active: inviteCopied }" @click="copyInviteLink">
          {{ inviteCopied ? "Copied" : "Copy" }}
        </button>
      </div>
      <button class="button ghost" @click="closeInviteLink">Close</button>
    </div>
  </div>
  <div v-if="showInviteWarning" class="modal-backdrop">
    <div class="modal-card">
      <h3>Session needed</h3>
      <div class="subtitle">Create and open a session before generating a share link.</div>
      <button class="button" @click="closeInviteWarning">OK</button>
    </div>
  </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDashboard } from "../composables/useDashboard.js";
import { formatSessionSchedule, formatSessionLocation } from "../utils/sessionSchedule.js";
import CourtFloor from "../components/CourtFloor.vue";

const {
  refresh,
  session, courts, error,
  showAddCourt, newCourtName, newCourtNotes, addCourtError,
  showEditCourt, editCourtName, editCourtNotes, editCourtError,
  showDeleteCourt, deleteCourtName, deleteCourtError,
  showEndMatch, endMatchError, endMatchTeams, endMatchScoreA, endMatchScoreB,
  showInviteLink, inviteLink, inviteCopied, showInviteWarning,
  createCourt, closeAddCourt,
  openEditCourt, updateCourt, closeEditCourt,
  deleteCourt, confirmDeleteCourt, closeDeleteCourt,
  openEndMatch, closeEndMatch, finishMatch,
  cancelMatch,
  createInviteLink, copyInviteLink, closeInviteLink, closeInviteWarning,
  teamNames, elapsedTime,
  courtStatusLabel, courtDotClass,
} = useDashboard();

const sessionLocation = computed(() => formatSessionLocation(session.value));
const sessionSchedule = computed(() => formatSessionSchedule(session.value));

// Pull-to-refresh (mobile)
const refreshing = ref(false);
const startY = ref(0);
const isPulling = ref(false);

async function pullRefresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await refresh();
  } finally {
    refreshing.value = false;
  }
}
function onTouchStart(e) {
  if (window.scrollY === 0) startY.value = e.touches[0].clientY;
}
function onTouchMove(e) {
  if (window.scrollY !== 0) return;
  if (e.touches[0].clientY - startY.value > 30) isPulling.value = true;
}
async function onTouchEnd(e) {
  const delta = e.changedTouches[0].clientY - startY.value;
  if (delta > 60) await pullRefresh();
  isPulling.value = false;
}

function courtTagClass(court) {
  if (court.status === "maintenance") return "tag-warn";
  if (court.currentMatchId || court.status === "in_match") return "tag-live";
  return "tag-idle";
}

function courtState(court) {
  if (court.currentMatch) return "live";
  if (court.status === "maintenance") return "maintenance";
  return "idle";
}
</script>

<style scoped>
/* ── Pull-to-refresh ──────────────────────────────── */
.pull-indicator {
  text-align: center;
  font-size: 13px;
  color: #ffffff;
  background: #1565c0;
  padding: 6px;
  border-radius: 8px;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.2s, opacity 0.2s, padding 0.2s;
}
.pull-indicator.active {
  max-height: 40px;
  opacity: 1;
  margin-bottom: 12px;
}

/* ── Tokens ───────────────────────────────────────── */
.dm {
  --blue: #1565c0;
  --blue-soft: #dbeafe;
  --teal: #00897b;
  --teal-soft: #ccfbf1;
  --green: #10b981;
  --text: #0f172a;
  --text-2: #334155;
  --text-3: #64748b;
  --border: #e2e8f0;
  --surface: #ffffff;
  --danger: #b91c1c;
  --r: 16px;
  --r-sm: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Session meta ─────────────────────────────────── */
.session-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
}

.session-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
}

.session-meta-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--blue);
}

/* ── Section ──────────────────────────────────────── */
.section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 14px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-3);
}

.section-row-actions { display: flex; gap: 6px; }

/* ── Pill buttons ─────────────────────────────────── */
.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: white;
  color: var(--text-2);
  transition: opacity 0.15s;
  line-height: 1;
}
.pill-btn:active { opacity: 0.75; }
.pill-btn-accent { background: var(--blue); color: white; border-color: var(--blue); }
.pill-btn-danger { color: var(--danger); border-color: rgba(185, 28, 28, 0.3); }
.pill-btn-copied {
  color: #047857;
  border-color: rgba(16, 185, 129, 0.45);
  background: rgba(16, 185, 129, 0.12);
}
.pill-btn-copied:active { opacity: 1; }

/* ── Court cards ──────────────────────────────────── */
.courts-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.court-card {
  position: relative;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 18px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.court-card.live {
  border-color: rgba(13, 148, 136, 0.5);
  box-shadow: 0 0 0 1px rgba(13, 148, 136, 0.15), 0 8px 26px rgba(13, 148, 136, 0.16);
}
.court-card.maintenance { border-color: rgba(245, 158, 11, 0.45); }

/* Top bar */
.cc-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cc-id {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  flex: 1;
}
.cc-dot {
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #cbd5e1;
}
.cc-dot.dot-active {
  background: var(--green);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: pulse 1.8s ease-in-out infinite;
}
.cc-dot.dot-maintenance { background: #f59e0b; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  50%       { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
}

.cc-name {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}
.cc-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.tag-live { background: rgba(16, 185, 129, 0.14); color: #065f46; }
.tag-idle { background: #f1f5f9; color: var(--text-3); }
.tag-warn { background: rgba(245, 158, 11, 0.16); color: #78350f; }

.ic-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: #f8fafc;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s;
}
.ic-btn:active { background: var(--border); }
.ic-btn svg { width: 14px; height: 14px; fill: var(--text-3); }
.ic-btn.ic-danger { border-color: rgba(185, 28, 28, 0.25); }
.ic-btn.ic-danger svg { fill: var(--danger); }

/* ── Footer ───────────────────────────────────────── */
.cc-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cc-timer {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 800;
  color: var(--teal);
}
.cc-timer-icon { width: 15px; height: 15px; }
.cc-actions { display: flex; gap: 8px; margin-left: auto; }

.cc-action-btn {
  display: inline-flex;
  align-items: center;
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, transform 0.1s;
  line-height: 1;
}
.cc-action-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.cc-action-btn:not(:disabled):active { opacity: 0.8; transform: scale(0.97); }

.cc-action-primary { background: var(--teal); color: white; }
.cc-action-danger   { background: transparent; border: 1.5px solid rgba(185,28,28,0.28); color: var(--danger); }

@media (prefers-reduced-motion: reduce) {
  .cc-dot.dot-active { animation: none; }
}

/* ── Empty state ──────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
}
.empty-icon { font-size: 32px; }
.empty-text { font-size: 14px; color: var(--text-3); text-align: center; }

.error-bar {
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: var(--r-sm);
  background: rgba(185, 28, 28, 0.07);
  color: var(--danger);
  font-size: 13px;
}

</style>
