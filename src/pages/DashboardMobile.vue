<template>
  <div class="dm">

    <!-- ── Session Card ───────────────────────────────────────── -->
    <div class="session-card" :class="session?.status === 'open' ? 'sc-open' : 'sc-closed'">
      <div class="sc-top">
        <div class="sc-info">
          <div class="sc-eyebrow">Active Session</div>
          <div class="sc-name">{{ session?.name || "No session" }}</div>
        </div>
        <span class="sc-badge" :class="session?.status === 'open' ? 'scb-open' : 'scb-off'">
          {{ session?.status || "none" }}
        </span>
      </div>
      <div class="sc-actions">
        <button class="sc-btn sc-btn-solid" @click="openCreateSession">+ New</button>
        <button v-if="session" class="sc-btn sc-btn-ghost" @click="openEditSession">Edit</button>
        <button v-if="session && session.status !== 'open'" class="sc-btn sc-btn-green" @click="openSession">Open</button>
        <button v-if="session && session.status === 'open'" class="sc-btn sc-btn-ghost" @click="closeSession">Close</button>
      </div>
    </div>

    <!-- ── Courts ──────────────────────────────────────────────── -->
    <div class="section">
      <div class="section-row">
        <span class="section-title">Courts</span>
        <div class="section-row-actions">
          <button class="pill-btn" @click="createInviteLink">
            <svg viewBox="0 0 24 24" width="13" height="13"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Join Link
          </button>
          <button class="pill-btn pill-btn-accent" @click="showAddCourt = true">+ Add</button>
        </div>
      </div>

      <div v-if="courts.length" class="courts-stack">
        <div
          v-for="court in courts"
          :key="court.id"
          class="court-card"
          :class="{
            'cc-active': court.currentMatchId,
            'cc-maintenance': court.status === 'maintenance'
          }"
        >
          <!-- Court header -->
          <div class="cc-head">
            <div class="cc-id">
              <span class="cc-dot" :class="courtDotClass(court)"></span>
              <span class="cc-name">{{ court.court?.name || court.name }}</span>
            </div>
            <div class="cc-head-right">
              <span class="cc-status-tag" :class="courtTagClass(court)">
                {{ courtStatusLabel(court.status) }}
              </span>
              <button class="ic-btn" @click="openEditCourt(court)" aria-label="Edit">
                <svg viewBox="0 0 24 24"><path d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5z"/></svg>
              </button>
              <button class="ic-btn ic-danger" @click="deleteCourt(court)" aria-label="Delete">
                <svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7zm3-3h6l1 2H8l1-2z"/></svg>
              </button>
            </div>
          </div>

          <!-- Match info -->
          <div v-if="court.currentMatch" class="cc-match">
            <div class="cc-teams">
              <span class="cc-team cc-team-a">{{ teamNames(court.currentMatch, 1) || "—" }}</span>
              <span class="cc-vs">vs</span>
              <span class="cc-team cc-team-b">{{ teamNames(court.currentMatch, 2) || "—" }}</span>
            </div>
            <div class="cc-time">
              <span class="cc-time-start">{{ formatTime(court.currentMatch?.startedAt) }}</span>
              <span class="cc-divider">·</span>
              <span class="cc-elapsed">{{ elapsedTime(court.currentMatch?.startedAt) }}</span>
            </div>
          </div>
          <div v-else class="cc-idle">No match in progress</div>

          <!-- Actions -->
          <div class="cc-footer">
            <button
              v-if="court.status === 'available'"
              class="cc-action-btn cc-action-outline"
              @click="goToPlayers"
            >
              Add Players
            </button>
            <template v-else>
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
            </template>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🏸</div>
        <div class="empty-text">No courts yet. Add one to get started.</div>
      </div>
      <div v-if="error" class="error-bar">{{ error }}</div>
    </div>

    <!-- ── Past Sessions ───────────────────────────────────────── -->
    <div class="section section-last">
      <button class="section-row collapse-btn" @click="togglePastSessions" type="button">
        <span class="section-title">Past Sessions</span>
        <span class="collapse-meta">
          <span class="collapse-count">{{ pastSessions.length }}</span>
          <span class="chevron" :class="{ open: showPastSessions }">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </span>
      </button>

      <div v-if="showPastSessions" class="past-list">
        <div v-if="pastSessions.length === 0" class="empty-state" style="padding: 16px 0">
          <div class="empty-text">No closed sessions yet.</div>
        </div>
        <div v-for="s in pastSessions" :key="s.id" class="past-item">
          <div class="past-info">
            <div class="past-name">{{ s.name }}</div>
            <div class="past-meta">{{ formatDateTime(s.closedAt) }}</div>
          </div>
          <div class="past-actions">
            <button class="pill-btn" @click="viewRoster(s)">Roster</button>
            <button class="pill-btn pill-btn-accent" @click="reopenSession(s)">Reopen</button>
            <button class="pill-btn pill-btn-danger" @click="openDeleteSession(s)">Delete</button>
          </div>
        </div>
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
      <div class="subtitle">Select the winner or mark as draw.</div>
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
          <button class="button button-compact" @click="setWinner(1)">{{ endMatchTeams.teamAName }} Wins</button>
        </div>
        <div class="winner-card team-b">
          <div class="winner-row">
            <div class="winner-info">
              <div class="subtitle">{{ endMatchTeams.teamBName }}</div>
              <strong>{{ endMatchTeams.teamBPlayers }}</strong>
            </div>
            <input class="input winner-score-input" type="number" min="0" v-model="endMatchScoreB" placeholder="Score" />
          </div>
          <button class="button button-compact secondary" @click="setWinner(2)">{{ endMatchTeams.teamBName }} Wins</button>
        </div>
      </div>
      <div class="match-modal-actions">
        <button class="button ghost button-compact draw-button" @click="setWinner(null)">Draw</button>
        <button class="button ghost button-compact" @click="closeEndMatch">Cancel</button>
      </div>
    </div>
  </div>
  <div v-if="showEditFee" class="modal-backdrop">
    <div class="modal-card">
      <h3>Edit Session Fee</h3>
      <div class="subtitle">{{ session?.name }}</div>
      <div class="field">
        <label class="field-label">Fee amount</label>
        <input class="input" v-model.number="editFeeAmount" type="number" min="0" />
      </div>
      <div v-if="editFeeError" class="notice">{{ editFeeError }}</div>
      <div class="grid two">
        <button class="button" @click="saveEditFee">Save</button>
        <button class="button ghost" @click="closeEditFee">Cancel</button>
      </div>
    </div>
  </div>
  <div v-if="showInviteLink" class="modal-backdrop">
    <div class="modal-card">
      <h3>Session Join Link</h3>
      <div class="subtitle">Share this link so players can register.</div>
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
      <div class="subtitle">Create and open a session before generating a join link.</div>
      <button class="button" @click="closeInviteWarning">OK</button>
    </div>
  </div>
  <div v-if="showRoster" class="modal-backdrop">
    <div class="modal-card">
      <h3>Session Roster</h3>
      <div class="subtitle">{{ rosterSession?.name }}</div>
      <div v-if="rosterPlayers.length === 0" class="subtitle">No players recorded.</div>
      <div v-else class="roster-list">
        <div v-for="sp in rosterPlayers" :key="sp.id" class="roster-item">
          <div class="roster-name">{{ sp.player.nickname || sp.player.fullName }}</div>
          <span class="badge neutral">{{ sp.status }}</span>
          <div class="roster-meta">GP {{ sp.gamesPlayed }}</div>
        </div>
      </div>
      <button class="button ghost" @click="closeRoster">Close</button>
    </div>
  </div>
  <div v-if="showDeleteSession" class="modal-backdrop">
    <div class="modal-card">
      <h3>Delete Session</h3>
      <div class="subtitle">Permanently delete <strong>{{ deleteSessionTarget?.name }}</strong> and its data?</div>
      <div v-if="deleteSessionError" class="notice">{{ deleteSessionError }}</div>
      <div class="grid two">
        <button class="button ghost" @click="closeDeleteSession">Cancel</button>
        <button class="button danger button-compact" @click="confirmDeleteSession">Delete</button>
      </div>
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
      <div class="field">
        <label class="field-label">Fee amount</label>
        <input class="input" v-model.number="feeAmount" type="number" min="0" />
      </div>
      <div class="join-limits-row">
        <div class="field field-inline">
          <label class="field-label">Regular</label>
          <input class="input" type="number" min="0" v-model.number="regularJoinLimit" />
        </div>
        <div class="field field-inline">
          <label class="field-label">New joiner</label>
          <input class="input" type="number" min="0" v-model.number="newJoinerLimit" />
        </div>
      </div>
      <div v-if="createError" class="notice">{{ createError }}</div>
      <div class="grid two">
        <button class="button ghost" @click="closeCreateSession">Cancel</button>
        <button class="button" @click="createSession">Create Session</button>
      </div>
    </div>
  </div>
  <div v-if="showEditSession" class="modal-backdrop">
    <div class="modal-card session-create">
      <h3>Edit Session</h3>
      <div class="field">
        <label class="field-label">Session name</label>
        <input class="input" v-model="editSessionName" />
      </div>
      <div class="field">
        <label class="field-label">Game type</label>
        <select class="input" v-model="editGameType">
          <option value="doubles">Doubles</option>
          <option value="singles">Singles</option>
        </select>
      </div>
      <div class="field">
        <label class="field-label">Session mode</label>
        <select class="input" v-model="editSessionMode">
          <option value="usual">Usual</option>
          <option value="tournament">Tournament</option>
        </select>
      </div>
      <div class="field">
        <label class="field-label">Fee amount</label>
        <input class="input" v-model.number="editSessionFeeAmount" type="number" min="0" />
      </div>
      <div class="join-limits-row">
        <div class="field field-inline">
          <label class="field-label">Regular</label>
          <input class="input" type="number" min="0" v-model.number="editRegularJoinLimit" />
        </div>
        <div class="field field-inline">
          <label class="field-label">New joiner</label>
          <input class="input" type="number" min="0" v-model.number="editNewJoinerLimit" />
        </div>
      </div>
      <div v-if="editSessionError" class="notice">{{ editSessionError }}</div>
      <div class="grid two">
        <button class="button ghost" @click="closeEditSession">Cancel</button>
        <button class="button" @click="saveEditSession">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDashboard } from "../composables/useDashboard.js";

const {
  session, courts, error,
  newSessionName, newGameType, newSessionMode, feeAmount, regularJoinLimit, newJoinerLimit,
  showCreateSession, createError,
  showEditSession, editSessionName, editGameType, editSessionMode,
  editSessionFeeAmount, editRegularJoinLimit, editNewJoinerLimit, editSessionError,
  showAddCourt, newCourtName, newCourtNotes, addCourtError,
  showEditCourt, editCourtName, editCourtNotes, editCourtError,
  showDeleteCourt, deleteCourtName, deleteCourtError,
  showEndMatch, endMatchError, endMatchTeams, endMatchScoreA, endMatchScoreB,
  showInviteLink, inviteLink, inviteCopied, showInviteWarning,
  pastSessions, showPastSessions, showRoster, rosterPlayers, rosterSession,
  showEditFee, editFeeAmount, editFeeError,
  showDeleteSession, deleteSessionTarget, deleteSessionError,
  openCreateSession, closeCreateSession, createSession,
  openEditSession, closeEditSession, saveEditSession,
  openSession, closeSession,
  openDeleteSession, closeDeleteSession, confirmDeleteSession,
  reopenSession,
  saveEditFee, closeEditFee,
  createCourt, closeAddCourt,
  openEditCourt, updateCourt, closeEditCourt,
  deleteCourt, confirmDeleteCourt, closeDeleteCourt,
  openEndMatch, closeEndMatch, setWinner,
  cancelMatch,
  createInviteLink, copyInviteLink, closeInviteLink, closeInviteWarning,
  viewRoster, closeRoster,
  togglePastSessions, goToPlayers,
  teamNames, formatTime, elapsedTime,
  courtStatusLabel, courtDotClass, formatDateTime,
} = useDashboard();

function courtTagClass(court) {
  if (court.status === "maintenance") return "tag-warn";
  if (court.currentMatchId || court.status === "in_match") return "tag-live";
  return "tag-idle";
}
</script>

<style scoped>
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

/* ── Session card ─────────────────────────────────── */
.session-card {
  border-radius: var(--r);
  padding: 20px;
  background: linear-gradient(135deg, #1a237e 0%, #1565c0 45%, #00695c 100%);
  color: white;
  box-shadow: 0 8px 32px rgba(21, 101, 192, 0.3), 0 2px 8px rgba(21, 101, 192, 0.2);
}

.session-card.sc-closed {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.18);
}

.sc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.sc-eyebrow {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.65;
  margin-bottom: 5px;
}

.sc-name {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.sc-badge {
  flex-shrink: 0;
  margin-top: 2px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.scb-open {
  background: rgba(16, 185, 129, 0.3);
  border-color: rgba(16, 185, 129, 0.5);
}

.sc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sc-btn {
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
.sc-btn:active { opacity: 0.8; transform: scale(0.97); }

.sc-btn-solid  { background: white; color: var(--blue); }
.sc-btn-ghost  { background: rgba(255,255,255,0.15); color: white; border: 1.5px solid rgba(255,255,255,0.35); }
.sc-btn-green  { background: rgba(16, 185, 129, 0.9); color: white; }

/* ── Section ──────────────────────────────────────── */
.section {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.section-last { padding-bottom: 8px; }

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

/* ── Court cards ──────────────────────────────────── */
.courts-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.court-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
  transition: box-shadow 0.2s;
}

.court-card.cc-active {
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow:
    0 0 0 1px rgba(16, 185, 129, 0.15),
    0 4px 20px rgba(16, 185, 129, 0.1);
}

.court-card.cc-maintenance {
  border-color: rgba(245, 158, 11, 0.35);
}

/* Court header */
.cc-head {
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
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-head-right {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.cc-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.tag-live { background: rgba(16, 185, 129, 0.12); color: #065f46; }
.tag-idle { background: #f1f5f9; color: var(--text-3); }
.tag-warn { background: rgba(245, 158, 11, 0.12); color: #78350f; }

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

/* Match block */
.cc-match {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 13px;
  background: linear-gradient(135deg, #eff6ff, #f0fdf4);
  border-radius: var(--r-sm);
  border: 1px solid rgba(21, 101, 192, 0.12);
}

.cc-teams {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cc-team {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}
.cc-team-a { background: rgba(21, 101, 192, 0.12); color: #1e3a6e; }
.cc-team-b { background: rgba(0, 137, 123, 0.12); color: #00443c; }

.cc-vs {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-3);
}

.cc-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-3);
}
.cc-elapsed { font-weight: 700; color: var(--blue); }
.cc-divider { opacity: 0.5; }

.cc-idle {
  font-size: 14px;
  color: var(--text-3);
  font-style: italic;
}

/* Court actions */
.cc-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

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
.cc-action-outline  { background: transparent; border: 1.5px solid var(--border); color: var(--text-2); }
.cc-action-danger   { background: transparent; border: 1.5px solid rgba(185,28,28,0.28); color: var(--danger); }

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

/* ── Past sessions ────────────────────────────────── */
.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
  padding: 0 0 12px;
}

.collapse-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.collapse-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-3);
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 999px;
}
.chevron {
  color: var(--text-3);
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}
.chevron.open { transform: rotate(180deg); }

.past-list {
  display: flex;
  flex-direction: column;
}

.past-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid var(--border);
}
.past-item:last-child { border-bottom: none; }

.past-info { flex: 1; min-width: 0; }
.past-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.past-meta { font-size: 12px; color: var(--text-3); margin-top: 2px; }

.past-actions {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}
</style>
