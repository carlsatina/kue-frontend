<template>
  <div>
  <div class="desk">

    <!-- ── Body ───────────────────────────────────────────────── -->
    <div class="desk-body">

      <!-- Courts grid -->
      <div class="desk-main">
        <div v-if="sessionLocation || sessionSchedule" class="session-meta">
          <span v-if="sessionLocation" class="session-meta-row">
            <svg class="session-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-10.2A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.8C18.5 15.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10.5" r="2.3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            {{ sessionLocation }}
          </span>
          <span v-if="sessionSchedule" class="session-meta-row">
            <svg class="session-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9.5V13l2.5 2M9 2.5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            {{ sessionSchedule }}
          </span>
        </div>
        <div class="panel-head">
          <span class="panel-title">Courts</span>
          <button class="link-btn" @click="showAddCourt = true">+ Add court</button>
        </div>

        <div v-if="courts.length" class="courts-grid">
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
                <strong class="cc-name">{{ court.court?.name || court.name }}</strong>
              </div>
              <div class="cc-controls">
                <span class="cc-status" :class="courtBadgeClass(court)">{{ courtStatusLabel(court.status) }}</span>
                <button class="icon-btn" @click="openEditCourt(court)" aria-label="Edit court">
                  <svg viewBox="0 0 24 24"><path d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5z"/></svg>
                </button>
                <button class="icon-btn icon-danger" @click="deleteCourt(court)" aria-label="Delete court">
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

            <!-- Footer -->
            <div class="cc-footer">
              <span v-if="court.currentMatch" class="cc-timer">
                <svg class="cc-timer-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9.5V13l2.5 2M9 2.5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                {{ elapsedTime(court.currentMatch?.startedAt) }}
              </span>
              <div class="cc-actions">
                <button v-if="court.status === 'available'" class="desk-btn desk-btn-primary" @click="goToPlayers">Add Players</button>
                <template v-else>
                  <button class="desk-btn desk-btn-danger" @click="cancelMatch(court)" :disabled="!court.currentMatchId">Cancel</button>
                  <button class="desk-btn desk-btn-primary" @click="openEndMatch(court)" :disabled="!court.currentMatchId">Complete Match</button>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-hint">No courts added yet.</div>
        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>
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
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDashboard } from "../composables/useDashboard.js";
import { formatSessionSchedule, formatSessionLocation } from "../utils/sessionSchedule.js";
import CourtFloor from "../components/CourtFloor.vue";

const {
  session, courts, error,
  showAddCourt, newCourtName, newCourtNotes, addCourtError,
  showEditCourt, editCourtName, editCourtNotes, editCourtError,
  showDeleteCourt, deleteCourtName, deleteCourtError,
  showEndMatch, endMatchError, endMatchTeams, endMatchScoreA, endMatchScoreB,
  createCourt, closeAddCourt,
  openEditCourt, updateCourt, closeEditCourt,
  deleteCourt, confirmDeleteCourt, closeDeleteCourt,
  openEndMatch, closeEndMatch, finishMatch,
  cancelMatch,
  goToPlayers,
  teamNames, elapsedTime,
  courtStatusLabel, courtDotClass,
} = useDashboard();

const sessionLocation = computed(() => formatSessionLocation(session.value));
const sessionSchedule = computed(() => formatSessionSchedule(session.value));

function courtBadgeClass(court) {
  if (court.status === "maintenance") return "badge-warning";
  if (court.currentMatchId || court.status === "in_match") return "badge-live";
  return "badge-idle";
}

function courtState(court) {
  if (court.currentMatch) return "live";
  if (court.status === "maintenance") return "maintenance";
  return "idle";
}
</script>

<style scoped>
/* ── Variables ────────────────────────────────────── */
.desk {
  --blue: #1565c0;
  --teal: #00897b;
  --teal-light: #ccfbf1;
  --text: #0f172a;
  --text-soft: #475569;
  --danger: #b91c1c;
  --border: #cbd5e1;
  --radius: 14px;
  --radius-sm: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Body layout ──────────────────────────────────── */
.desk-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

/* ── Session meta ─────────────────────────────────── */
.session-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.session-meta-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-soft);
}
.session-meta-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--blue);
}

/* ── Panel head ───────────────────────────────────── */
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}
.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--blue);
  padding: 0;
  text-decoration: none;
}
.link-btn:hover { text-decoration: underline; }

/* ── Courts grid ──────────────────────────────────── */
.courts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.court-card {
  position: relative;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 18px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.court-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
}
.court-card.live {
  border-color: rgba(13, 148, 136, 0.55);
  box-shadow: 0 12px 32px rgba(13, 148, 136, 0.18);
}
.court-card.maintenance { border-color: rgba(245, 158, 11, 0.5); }

/* Top bar */
.cc-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cc-id { display: flex; align-items: center; gap: 8px; min-width: 0; }

.cc-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #94a3b8;
}
.cc-dot.dot-active {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: dotPulse 1.6s ease-in-out infinite;
}
.cc-dot.dot-maintenance { background: #f59e0b; }

@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45); }
  50%       { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
}

.cc-name {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cc-controls {
  display: flex;
  align-items: center;
  gap: 6px;
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
.badge-live { background: rgba(16, 185, 129, 0.16); color: #065f46; }
.badge-idle { background: #f1f5f9; color: var(--text-soft); }
.badge-warning { background: rgba(245, 158, 11, 0.18); color: #92400e; }

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: white;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}
.icon-btn svg { width: 14px; height: 14px; fill: var(--text-soft); }
.icon-btn.icon-danger { border-color: rgba(185, 28, 28, 0.28); }
.icon-btn.icon-danger svg { fill: var(--danger); }

/* ── Footer ───────────────────────────────────────── */
.cc-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}
.cc-timer {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 800;
  color: var(--teal);
  font-variant-numeric: tabular-nums;
}
.cc-timer-icon { width: 15px; height: 15px; }
.cc-actions { display: flex; gap: 8px; margin-left: auto; }

@media (prefers-reduced-motion: reduce) {
  .court-card { transition: none; }
  .court-card:hover { transform: none; }
  .cc-dot.dot-active { animation: none; }
}

.desk-btn {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
  line-height: 1;
}
.desk-btn:disabled { opacity: 0.38; cursor: not-allowed; }
.desk-btn:not(:disabled):active { opacity: 0.8; }

.desk-btn-primary { background: var(--teal); color: white; }
.desk-btn-danger {
  background: transparent;
  border: 1.5px solid rgba(185, 28, 28, 0.3);
  color: var(--danger);
}

/* ── Empty / error ────────────────────────────────── */
.empty-hint {
  font-size: 14px;
  color: var(--text-soft);
  padding: 20px 0;
  text-align: center;
}
.error-msg {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(185, 28, 28, 0.07);
  border-radius: var(--radius-sm);
  color: var(--danger);
  font-size: 13px;
}
</style>
