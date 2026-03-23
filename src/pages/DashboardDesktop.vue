<template>
  <div class="desk">

    <!-- ── Top bar ─────────────────────────────────────────────── -->
    <div class="topbar" :class="session?.status === 'open' ? 'topbar-open' : 'topbar-closed'">
      <div class="topbar-session">
        <div class="topbar-label">Active Session</div>
        <div class="topbar-name">{{ session?.name || "No session" }}</div>
      </div>
      <span class="status-chip" :class="session?.status === 'open' ? 'chip-open' : 'chip-off'">
        {{ session?.status || "none" }}
      </span>
      <div class="topbar-actions">
        <button class="tb-btn tb-btn-ghost" @click="createInviteLink">Join Link</button>
        <button class="tb-btn tb-btn-ghost" @click="openCreateSession">+ New Session</button>
        <button v-if="session" class="tb-btn tb-btn-ghost" @click="openEditSession">Edit</button>
        <button v-if="session && session.status !== 'open'" class="tb-btn tb-btn-primary" @click="openSession">Open Session</button>
        <button v-if="session && session.status === 'open'" class="tb-btn tb-btn-ghost" @click="closeSession">Close Session</button>
      </div>
    </div>

    <!-- ── Body ───────────────────────────────────────────────── -->
    <div class="desk-body">

      <!-- Courts grid -->
      <div class="desk-main">
        <div class="panel-head">
          <span class="panel-title">Courts</span>
          <button class="link-btn" @click="showAddCourt = true">+ Add court</button>
        </div>

        <div v-if="courts.length" class="courts-grid">
          <div
            v-for="court in courts"
            :key="court.id"
            class="court-card"
            :class="{ 'court-card-active': court.currentMatchId, 'court-card-maintenance': court.status === 'maintenance' }"
          >
            <div class="cc-head">
              <div class="cc-title">
                <span class="cc-dot" :class="courtDotClass(court)"></span>
                <strong class="cc-name">{{ court.court?.name || court.name }}</strong>
              </div>
              <div class="cc-head-right">
                <span class="cc-status-badge" :class="courtBadgeClass(court)">{{ courtStatusLabel(court.status) }}</span>
                <button class="icon-btn" @click="openEditCourt(court)" aria-label="Edit">
                  <svg viewBox="0 0 24 24"><path d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5z"/></svg>
                </button>
                <button class="icon-btn icon-danger" @click="deleteCourt(court)" aria-label="Delete">
                  <svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7zm3-3h6l1 2H8l1-2z"/></svg>
                </button>
              </div>
            </div>

            <div v-if="court.currentMatch" class="cc-match">
              <div class="cc-teams">
                <span class="cc-team team-a">{{ teamNames(court.currentMatch, 1) || "—" }}</span>
                <span class="cc-vs">vs</span>
                <span class="cc-team team-b">{{ teamNames(court.currentMatch, 2) || "—" }}</span>
              </div>
              <div class="cc-meta">
                <span class="cc-meta-item">
                  <span class="cc-meta-label">Started</span>
                  {{ formatTime(court.currentMatch?.startedAt) }}
                </span>
                <span class="cc-meta-item cc-elapsed">
                  {{ elapsedTime(court.currentMatch?.startedAt) }}
                </span>
              </div>
            </div>
            <div v-else class="cc-idle">No match in progress</div>

            <div class="cc-footer">
              <button v-if="court.status === 'available'" class="desk-btn desk-btn-outline" @click="goToPlayers">Add Players</button>
              <template v-else>
                <button class="desk-btn desk-btn-danger" @click="cancelMatch(court)" :disabled="!court.currentMatchId">Cancel</button>
                <button class="desk-btn desk-btn-primary" @click="openEndMatch(court)" :disabled="!court.currentMatchId">Complete Match</button>
              </template>
            </div>
          </div>
        </div>
        <div v-else class="empty-hint">No courts added yet.</div>
        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>

      <!-- Sidebar: past sessions -->
      <div class="desk-side">
        <div class="panel-head">
          <span class="panel-title">Past Sessions</span>
          <span class="panel-count">{{ pastSessions.length }}</span>
        </div>
        <div class="past-list">
          <div v-if="pastSessions.length === 0" class="empty-hint">No closed sessions.</div>
          <div v-for="s in pastSessions" :key="s.id" class="past-item">
            <div class="past-item-info">
              <div class="past-item-name">{{ s.name }}</div>
              <div class="past-item-meta">{{ formatDateTime(s.closedAt) }}</div>
            </div>
            <div class="past-item-actions">
              <button class="link-btn" @click="viewRoster(s)">Roster</button>
              <button class="link-btn link-btn-green" @click="reopenSession(s)">Reopen</button>
              <button class="link-btn link-btn-danger" @click="openDeleteSession(s)">Delete</button>
            </div>
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
  pastSessions, showRoster, rosterPlayers, rosterSession,
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
  goToPlayers,
  teamNames, formatTime, elapsedTime,
  courtStatusLabel, courtDotClass, formatDateTime,
} = useDashboard();

function courtBadgeClass(court) {
  if (court.status === "maintenance") return "badge-warning";
  if (court.currentMatchId || court.status === "in_match") return "badge-live";
  return "badge-idle";
}
</script>

<style scoped>
/* ── Variables ────────────────────────────────────── */
.desk {
  --blue: #1565c0;
  --blue-mid: #1e88e5;
  --blue-light: #dbeafe;
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

/* ── Top bar ──────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius);
  background: linear-gradient(120deg, #1565c0 0%, #1e88e5 60%, #00897b 100%);
  color: white;
}

.topbar-closed {
  background: linear-gradient(120deg, #334155, #475569);
}

.topbar-session { flex: 1; min-width: 0; }

.topbar-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  opacity: 0.7;
  margin-bottom: 3px;
}

.topbar-name {
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
}
.chip-open {
  background: rgba(16, 185, 129, 0.35);
  border-color: rgba(16, 185, 129, 0.55);
}

.topbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  line-height: 1;
  border: none;
}
.tb-btn:active { opacity: 0.8; }

.tb-btn-ghost {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
}
.tb-btn-primary {
  background: white;
  color: var(--blue);
}

/* ── Body layout ──────────────────────────────────── */
.desk-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: start;
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
.panel-count {
  font-size: 13px;
  color: var(--text-soft);
  background: #f1f5f9;
  padding: 2px 9px;
  border-radius: 999px;
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
.link-btn-green { color: var(--teal); }
.link-btn-danger { color: var(--danger); }

/* ── Courts grid ──────────────────────────────────── */
.courts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.court-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s;
}

.court-card-active {
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.12);
}

.court-card-maintenance {
  border-color: rgba(245, 158, 11, 0.45);
}

.cc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cc-title { display: flex; align-items: center; gap: 8px; }

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
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.cc-head-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cc-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.badge-live {
  background: rgba(16, 185, 129, 0.15);
  color: #065f46;
}
.badge-idle {
  background: #f1f5f9;
  color: var(--text-soft);
}
.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #92400e;
}

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

/* Match */
.cc-match {
  padding: 10px 12px;
  background: var(--blue-light);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(30, 136, 229, 0.18);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cc-teams {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cc-team {
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
.team-a { background: rgba(21, 101, 192, 0.14); color: #1a3e8a; }
.team-b { background: rgba(0, 137, 123, 0.15); color: #004d40; }
.cc-vs {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-soft);
}
.cc-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-soft);
}
.cc-meta-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 3px;
}
.cc-elapsed { font-weight: 700; color: var(--blue-mid); }

.cc-idle { font-size: 13px; color: var(--text-soft); }

.cc-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: auto;
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
.desk-btn-outline {
  background: transparent;
  border: 1.5px solid var(--border);
  color: var(--text);
}
.desk-btn-danger {
  background: transparent;
  border: 1.5px solid rgba(185, 28, 28, 0.3);
  color: var(--danger);
}

/* ── Past sessions sidebar ────────────────────────── */
.desk-side {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}

.past-list { display: flex; flex-direction: column; }

.past-item {
  padding: 11px 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.past-item:last-child { border-bottom: none; }

.past-item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.past-item-meta { font-size: 12px; color: var(--text-soft); }

.past-item-actions {
  display: flex;
  gap: 10px;
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
