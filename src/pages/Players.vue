<template>
  <div class="players-page" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <div class="pull-indicator" :class="{ active: isPulling || refreshing }">
      <span v-if="!refreshing">↓ Pull to refresh</span>
      <span v-else>Refreshing…</span>
    </div>
    <!-- Tab bar -->
    <div class="players-tab-bar">
      <button class="players-tab" :class="{ active: activeTab === 'players' }" type="button" @click="activeTab = 'players'">
        Players
      </button>
      <button class="players-tab" :class="{ active: activeTab === 'queue' }" type="button" @click="activeTab = 'queue'">
        Queue
        <span v-if="queueMatchCount > 0" class="tab-badge">{{ queueMatchCount }}</span>
      </button>
      <button class="players-tab" :class="{ active: activeTab === 'history' }" type="button" @click="activeTab = 'history'">
        History
      </button>
    </div>

    <!-- Players Tab -->
    <template v-if="activeTab === 'players'">
      <div v-if="!session" class="empty-state">
        No active session.
        <button class="button button-compact" style="margin-top:12px" @click="openCreateSession">Create Session</button>
      </div>
      <template v-else>
        <!-- Players header: session-level join link -->
        <div v-if="session" class="players-header">
          <span class="players-header-hint">Share with players to join this session</span>
          <div class="players-header-actions">
            <button class="link-button" :class="{ copied: joinLinkCopied }" @click="openJoinLink">
              <span class="link-icon">{{ joinLinkCopied ? "✓" : "🔗" }}</span> {{ joinLinkCopied ? "Link Copied!" : "Join Link" }}
            </button>
          </div>
        </div>

        <!-- Search row -->
        <div class="search-row">
          <template v-if="selectionTab === 'players'">
            <input class="input" v-model="search" placeholder="Search players" />
            <div class="menu" ref="displayMenuRef">
              <button class="menu-button" type="button" @click="showDisplayMenu = !showDisplayMenu">
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h7v2H4v-2z"></path>
                </svg>
              </button>
              <div v-if="showDisplayMenu" class="menu-panel">
                <label class="radio-row">
                  <input type="checkbox" v-model="showJoinOrder" />
                  Show join order
                </label>
              </div>
            </div>
          </template>
          <template v-else>
            <input class="input" v-model="teamSearch" placeholder="Search teams" />
            <button class="button ghost button-compact" @click="clearTeamSearch">Clear</button>
          </template>
        </div>

        <!-- Pick / Pairs sub-tabs -->
        <div class="selection-header">
          <div v-if="sessionGameType === 'doubles'" class="segmented inner-tabs">
            <button class="segment" :class="{ active: selectionTab === 'players' }" type="button" @click="selectionTab = 'players'">Pick</button>
            <button class="segment" :class="{ active: selectionTab === 'teams' }" type="button" @click="selectionTab = 'teams'">Pairs</button>
          </div>
          <div class="game-type inline">
            <span class="text-muted">Game type:</span>
            <strong>{{ sessionGameTypeLabel }}</strong>
          </div>
        </div>

        <!-- Player grid -->
        <template v-if="selectionTab === 'players'">
          <p class="pick-hint">Pick {{ selectionLimit }} players to start a match</p>
          <div class="player-grid">
            <div
              v-for="player in filteredPlayers"
              :key="player.id"
              class="player-card"
              :class="{
                selected: sessionIsOpen && selectedIds.includes(player.id),
                disabled: isPlaying(player),
                'new-player': isNewPlayer(player),
                'over-limit': isOverJoinLimit(player.id),
                'has-team': playerTeamColor(player),
                'team-missing': isTournamentMode && !playerTeamIdById(player.id)
              }"
              :style="playerCardStyle(player)"
              @click="toggleSelect(player)"
            >
              <div class="player-card-top">
                <div class="player-name">
                  <div class="player-name-row">
                    <span v-if="playerTeamColor(player)" class="team-dot" :style="{ backgroundColor: playerTeamColor(player) }"></span>
                    <strong class="player-name-text">{{ player.nickname || player.fullName }}</strong>
                  </div>
                </div>
                <span class="status-pill" :class="statusClass(player)">{{ statusLabel(player) }}</span>
              </div>
              <p class="card-meta">
                G: {{ gamesPlayed(player.id) }}
                <span v-if="player.skillLevel" class="card-skill" :class="skillClass(player)">{{ skillShort(player) }}</span>
              </p>
              <p v-if="showJoinOrder" class="card-meta">Join order: {{ joinOrderLabel(player.id) }}</p>
              <button
                class="icon-button small player-edit-btn"
                @click.stop="openEditPlayer(player)"
                aria-label="Edit player"
              >
                <svg viewBox="0 0 24 24" role="img"><path d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5z"></path></svg>
              </button>
            </div>
          </div>
          <p class="players-count">{{ filteredPlayers.length }} players available</p>

          <div class="action-bar" ref="actionBarRef">
            <button class="button button-compact" :disabled="!canAdd" @click="addToQueue">
              Add to Q
            </button>
            <button
              class="button secondary button-compact"
              :disabled="!canAutoQueue"
              :title="autoQueueHint || 'Queue the longest-waiting players'"
              @click="autoQueueIdle"
            >Auto Q</button>
            <button v-if="showMarkPresent" class="button secondary button-compact" :disabled="selectedIds.length === 0 || !sessionIsOpen" @click="markPresent">✓ Present</button>
            <button v-if="selectedIds.length > 0" class="button ghost danger button-compact" @click="openRemoveConfirm" aria-label="Remove selected players">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
          <p v-if="autoQueueHint" class="auto-queue-hint">{{ autoQueueHint }}</p>

          <!-- The same primary action as the bar above, brought to the thumb
               when that bar has scrolled out of view. -->
          <teleport to="body">
            <transition name="float-pop">
              <div v-if="showFloatingActions" class="floating-actions">
                <span class="floating-count">{{ selectedIds.length }} selected</span>
                <button
                  v-if="allSelectedAwaitingPresent"
                  class="button button-compact"
                  @click="markPresent"
                >✓ Present{{ selectedIds.length > 1 ? ` (${selectedIds.length})` : '' }}</button>
                <button
                  v-else
                  class="button button-compact"
                  :disabled="!canAdd"
                  @click="addToQueue"
                >Add to Q</button>
                <button class="button ghost button-compact" @click="clearSelection">Clear</button>
              </div>
            </transition>
          </teleport>

          <!-- What Auto Q would pick, offered before it's asked for. -->
          <div v-if="autoQueueProposal" class="next-up">
            <div class="next-up-teams">
              <span class="next-up-label">
                Next up
                <template v-if="autoQueueProposal.resting">
                  · {{ autoQueueProposal.resting }} still resting
                </template>
              </span>
              <span class="next-up-names">
                {{ autoQueueProposal.teamA.join(' + ') }}
                <span class="next-up-vs">vs</span>
                {{ autoQueueProposal.teamB.join(' + ') }}
              </span>
            </div>
            <div class="next-up-actions">
              <button class="button button-compact" :disabled="proposalSubmitting" @click="queueProposal">
                {{ proposalSubmitting ? 'Adding…' : 'Queue it' }}
              </button>
              <button class="button ghost button-compact" :disabled="proposalSubmitting" @click="editProposal">Edit</button>
            </div>
          </div>
          <div v-if="queueError" class="notice">{{ queueError }}</div>
          <div v-if="removeError" class="notice">{{ removeError }}</div>
          <div v-if="presentError" class="notice">{{ presentError }}</div>
        </template>

        <!-- Pairs tab -->
        <div v-if="sessionGameType === 'doubles' && selectionTab === 'teams'" class="team-select">
          <div class="team-select-head">
            <div>
              <p class="text-muted">Select 2 pairs to queue a match.</p>
            </div>
            <router-link class="button button-compact blue-gradient" to="/pairing">Open Pairing</router-link>
          </div>
          <p v-if="filteredTeamOptions.length === 0" class="text-muted">No pairs yet.</p>
          <div v-else class="team-select-grid">
            <button
              v-for="team in filteredTeamOptions"
              :key="team.id"
              class="team-select-card"
              :class="{ selected: selectedTeamIds.includes(team.id), disabled: isTeamDisabled(team) }"
              type="button"
              :disabled="isTeamDisabled(team)"
              @click="toggleTeamSelection(team)"
            >
              <div class="team-select-headline">
                <div class="team-select-name">
                  <span v-if="team.teamColor" class="team-color" :style="{ backgroundColor: team.teamColor }"></span>
                  <span>{{ team.displayName }}</span>
                </div>
                <span v-if="team.status" class="team-status-pill" :class="team.status.toLowerCase()">{{ team.status }}</span>
              </div>
              <div class="team-select-members">
                <span v-if="team.source === 'auto'" class="team-select-pill auto">Auto</span>
                <span v-else class="team-select-pill manual">Manual</span>
              </div>
            </button>
          </div>
          <div class="team-select-actions">
            <button class="button button-compact" :disabled="!canAddTeams" @click="addSelectedTeams">Add Pair{{ selectedTeamIds.length === 1 ? "" : "s" }} to Queue</button>
            <button class="button ghost button-compact" :disabled="selectedTeamIds.length === 0" @click="clearTeamSelection">Clear</button>
          </div>
        </div>

        <!-- Add Player section -->
        <!-- Two ways in, both opening over the page rather than pushing it. -->
        <div class="add-player-actions">
          <button class="button button-compact" :disabled="!sessionIsOpen" @click="openAddPlayerModal">
            + Add Player
          </button>
          <button class="button ghost button-compact" :disabled="!sessionIsOpen" @click="openGroupPicker">
            <span class="link-icon">👥</span> From Group
          </button>
        </div>
      </template>
    </template>

    <!-- Queue Tab -->
    <div v-if="activeTab === 'queue'" class="tab-content">
      <div class="queue-header">
        <div>
          <p class="text-muted">{{ queueMatches.length }} match{{ queueMatches.length === 1 ? '' : 'es' }} waiting</p>
        </div>
        <button class="link-button" :class="{ copied: queueCopied }" @click="createQueueShareLink">
          <span class="link-icon">{{ queueCopied ? "✓" : "🔗" }}</span> {{ queueCopied ? "Link Copied!" : "Share Link" }}
        </button>
      </div>

      <div class="share-card">
        <p class="share-text">Share your queue with players so they can view upcoming matches.</p>
        <div v-if="queueShareLink" class="share-link">
          <input class="input" readonly :value="queueShareLink" />
          <button class="button ghost button-compact" :class="{ active: queueCopied }" @click="copyQueueShareLink">{{ queueCopied ? "Copied" : "Copy" }}</button>
        </div>
      </div>

      <p v-if="queueMatches.length === 0" class="empty-state">Queue is empty.</p>
      <div v-for="(match, idx) in queueMatches" :key="match.id" class="queue-match-card" :class="{ alt: idx % 2 === 1 }">
        <div class="queue-card-head">
          <strong>#{{ idx + 1 }} {{ match.typeLabel }}</strong>
          <div class="queue-card-head-right">
            <span class="text-muted">{{ formatTime(match.requestedAt) }}</span>
            <button v-if="sessionIsOpen" class="queue-edit-btn" @click="openEditPairing(match)" title="Edit pairing">
              <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
          </div>
        </div>
        <div class="queue-vs">
          <div class="queue-team">{{ match.teamA.join(" + ") }}</div>
          <span class="queue-vs-pill">vs</span>
          <div class="queue-team">{{ match.teamB.join(" + ") }}</div>
        </div>
        <div class="queue-courts">
          <p class="text-muted">Assign a court:</p>
          <div class="court-buttons">
            <button v-for="court in availableCourts" :key="court.id" class="button ghost button-compact" @click="assignMatch(match, court)">{{ court.court?.name || court.name }}</button>
          </div>
        </div>
        <button class="link-button danger" @click="cancelQueuedMatch(match)">Cancel match</button>
      </div>
    </div>

    <!-- History Tab -->
    <div v-if="activeTab === 'history'" class="tab-content">
      <input class="input" v-model="historySearch" placeholder="Search by player name..." />
      <p v-if="filteredHistory.length === 0" class="empty-state">No matches yet.</p>
      <div v-for="match in filteredHistory" :key="match.id" class="history-card sleek">
        <div class="history-head">
          <div class="history-left">
            <span class="history-index">#{{ historyOrder(match) }}</span>
            <span class="history-pill">{{ match.matchType === 'doubles' ? 'Doubles' : 'Singles' }}</span>
            <span class="history-pill tie" v-if="match.winnerTeam == null && match.status === 'ended'">Tie</span>
            <span class="history-pill cancelled" v-if="match.status === 'cancelled'">Cancelled</span>
          </div>
          <div class="history-right">
            <div class="history-time">{{ formatTime(match.endedAt || match.startedAt) }}</div>
            <button v-if="match.status === 'ended'" class="button ghost button-compact history-edit-button" @click="openEditResult(match)">Edit Result</button>
          </div>
        </div>
        <div class="history-vs compact">
          <div class="history-team" :class="{ winner: match.winnerTeam === 1 }">
            <span class="history-team-name">{{ teamNames(match, 1) }}</span>
            <span v-if="match.winnerTeam === 1" class="history-crown">🏆</span>
            <span v-if="matchScore(match, 1) != null" class="history-score-pill">{{ matchScore(match, 1) }}</span>
          </div>
          <span class="history-vs-pill">vs</span>
          <div class="history-team" :class="{ winner: match.winnerTeam === 2 }">
            <span class="history-team-name">{{ teamNames(match, 2) }}</span>
            <span v-if="match.winnerTeam === 2" class="history-crown">🏆</span>
            <span v-if="matchScore(match, 2) != null" class="history-score-pill">{{ matchScore(match, 2) }}</span>
          </div>
        </div>
        <div class="history-meta">
          <div class="history-meta-card">
            <p class="text-muted">Duration</p>
            <strong>{{ durationLabel(match.startedAt, match.endedAt) }}</strong>
          </div>
          <div class="history-meta-card">
            <p class="text-muted">Court</p>
            <strong>{{ match.courtSession?.court?.name || '—' }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditPlayer" class="modal-backdrop">
      <div class="modal-card">
        <h3>Edit Player</h3>
        <input class="input" v-model="editPlayerName" placeholder="Player name" />
        <div class="chip-row">
          <button
            v-for="level in skillLevels"
            :key="level"
            class="chip"
            :class="{ active: editSkillLevel === level }"
            type="button"
            @click="editSkillLevel = level"
          >
            {{ level }}
          </button>
        </div>
        <div v-if="editError" class="notice">{{ editError }}</div>
        <div class="grid two">
          <button class="button" @click="saveEditPlayer">Save</button>
          <button class="button ghost" @click="closeEditPlayer">Cancel</button>
        </div>
      </div>
    </div>
    <div v-if="showDuplicateWarning" class="modal-backdrop">
      <div class="modal-card">
        <h3>Players already queued or playing</h3>
        <div class="subtitle">
          {{ duplicateWarningText }}
        </div>
        <div class="grid two">
          <button class="button" @click="confirmDuplicateWarning">Add Anyway</button>
          <button class="button ghost" @click="closeDuplicateWarning">Cancel</button>
        </div>
      </div>
    </div>
    <div v-if="showTeamWarning" class="modal-backdrop">
      <div class="modal-card">
        <h3>Team required</h3>
        <div class="subtitle">
          {{ teamWarningText }}
        </div>
        <div class="grid two">
          <router-link class="button button-compact" to="/teams" @click="closeTeamWarning">
            Manage Teams
          </router-link>
          <button class="button ghost button-compact" @click="closeTeamWarning">Close</button>
        </div>
      </div>
    </div>
    <div v-if="showCancelConfirm" class="modal-backdrop">
      <div class="modal-card">
        <h3>Cancel match</h3>
        <div class="subtitle">Are you sure you want to cancel this match?</div>
        <div class="grid two">
          <button class="button danger" @click="confirmCancelMatch">Cancel match</button>
          <button class="button ghost" @click="closeCancelConfirm">Keep</button>
        </div>
      </div>
    </div>
    <div v-if="showAddPlayerModal" class="modal-backdrop" @click.self="closeAddPlayerModal">
      <div class="modal-card">
        <h3>Add player</h3>
        <p class="text-muted" style="margin: 0 0 12px">
          Creates the player and checks them in to this session.
        </p>
        <div class="field">
          <label class="field-label">Name</label>
          <input ref="addPlayerNameInput" class="input" v-model="fullName" placeholder="Player name" @keyup.enter="addPlayer" />
        </div>
        <div class="field">
          <label class="field-label">Skill level</label>
          <div class="chip-row">
            <button
              v-for="level in skillLevels"
              :key="level"
              class="chip"
              :class="{ active: skillLevel === level }"
              type="button"
              @click="skillLevel = level"
            >{{ level }}</button>
          </div>
        </div>
        <div v-if="addError" class="notice">{{ addError }}</div>
        <div class="grid two">
          <button class="button ghost" @click="closeAddPlayerModal">Cancel</button>
          <button class="button" :disabled="!sessionIsOpen" @click="addPlayer">Add Player</button>
        </div>
      </div>
    </div>
    <div v-if="showAddOverLimitWarning" class="modal-backdrop">
      <div class="modal-card">
        <h3>Join limit reached</h3>
        <div class="subtitle">
          This session's join limit is {{ regularLimit }} and {{ regularJoinedCount }} players have already joined.
          Add {{ fullName.trim() || "this player" }} anyway?
        </div>
        <div class="grid two">
          <button class="button" @click="confirmAddOverLimit">Add Anyway</button>
          <button class="button ghost" @click="closeAddOverLimitWarning">Cancel</button>
        </div>
      </div>
    </div>
    <div v-if="showRemoveConfirm" class="modal-backdrop">
      <div class="modal-card">
        <h3>Remove players</h3>
        <div class="subtitle">{{ removeConfirmText }}</div>
        <div class="grid two">
          <button class="button danger" @click="confirmRemoveSelected">Remove</button>
          <button class="button ghost" @click="closeRemoveConfirm">Cancel</button>
        </div>
      </div>
    </div>
    <div v-if="showSinglesQueueModal" class="modal-backdrop">
      <div class="modal-card">
        <h3>Queue singles match</h3>
        <div class="subtitle">Confirm these players.</div>
        <div v-if="awaitingPresentNames.length" class="not-arrived">
          <div class="not-arrived-text">
            <strong>{{ awaitingPresentNames.join(', ') }}</strong>
            {{ awaitingPresentNames.length === 1 ? "hasn't" : "haven't" }} arrived yet.
            Mark {{ awaitingPresentNames.length === 1 ? 'them' : 'them all' }} present to queue this match.
          </div>
          <button class="button button-compact" @click="markPresentFromModal">✓ Mark present</button>
        </div>
        <div class="singles-match-row">
          <div v-if="singlesQueueOrder[0]" class="singles-pill singles-pill-a">
            <span class="singles-pill-name">{{ playerNameById(singlesQueueOrder[0]) }}</span>
            <span
              v-if="playerById(singlesQueueOrder[0])?.skillLevel"
              class="card-skill"
              :class="skillClass(playerById(singlesQueueOrder[0]))"
            >{{ skillShort(playerById(singlesQueueOrder[0])) }}</span>
          </div>
          <div class="singles-vs">vs</div>
          <div v-if="singlesQueueOrder[1]" class="singles-pill singles-pill-b">
            <span class="singles-pill-name">{{ playerNameById(singlesQueueOrder[1]) }}</span>
            <span
              v-if="playerById(singlesQueueOrder[1])?.skillLevel"
              class="card-skill"
              :class="skillClass(playerById(singlesQueueOrder[1]))"
            >{{ skillShort(playerById(singlesQueueOrder[1])) }}</span>
          </div>
        </div>
        <div class="grid two">
          <button class="button" :disabled="awaitingPresentNames.length > 0" @click="confirmSinglesQueueAdd">Add to Queue</button>
          <button class="button ghost" @click="closeSinglesQueueModal">Cancel</button>
        </div>
      </div>
    </div>
    <div v-if="showPairingModal" class="modal-backdrop">
      <div class="modal-card pairing-modal">
        <div class="section-title">Pair teams</div>
        <div class="subtitle">Drag players or tap two slots to swap.</div>
        <div v-if="awaitingPresentNames.length" class="not-arrived">
          <div class="not-arrived-text">
            <strong>{{ awaitingPresentNames.join(', ') }}</strong>
            {{ awaitingPresentNames.length === 1 ? "hasn't" : "haven't" }} arrived yet.
            Mark {{ awaitingPresentNames.length === 1 ? 'them' : 'them all' }} present to queue this match.
          </div>
          <button class="button button-compact" @click="markPresentFromModal">✓ Mark present</button>
        </div>
        <div class="pairing-grid">
          <div class="pairing-team">
            <div class="subtitle">Team A</div>
            <div
              v-for="slotIndex in [0, 1]"
              :key="`a-${slotIndex}`"
              class="pairing-slot"
              :data-index="slotIndex"
              :class="{
                selected: pairingSelectedIndex === slotIndex,
                hover: pairingHoverIndex === slotIndex
              }"
              @click="selectPairSlot(slotIndex)"
            >
              <div
                v-if="pairingOrder[slotIndex]"
                class="pairing-pill"
                :class="{
                  dragging: draggingPairIndex === slotIndex,
                  'not-arrived-pill': isAwaitingPresentId(pairingOrder[slotIndex])
                }"
                @pointerdown.prevent="onPairPointerDown(slotIndex, $event)"
              >
                <span class="pairing-pill-name">{{ playerNameById(pairingOrder[slotIndex]) }}</span>
                <span
                  v-if="playerById(pairingOrder[slotIndex])?.skillLevel"
                  class="card-skill"
                  :class="skillClass(playerById(pairingOrder[slotIndex]))"
                >{{ skillShort(playerById(pairingOrder[slotIndex])) }}</span>
              </div>
              <div v-else class="subtitle compact">Drop player</div>
            </div>
          </div>
          <div class="pairing-team">
            <div class="subtitle">Team B</div>
            <div
              v-for="slotIndex in [2, 3]"
              :key="`b-${slotIndex}`"
              class="pairing-slot"
              :data-index="slotIndex"
              :class="{
                selected: pairingSelectedIndex === slotIndex,
                hover: pairingHoverIndex === slotIndex
              }"
              @click="selectPairSlot(slotIndex)"
            >
              <div
                v-if="pairingOrder[slotIndex]"
                class="pairing-pill"
                :class="{
                  dragging: draggingPairIndex === slotIndex,
                  'not-arrived-pill': isAwaitingPresentId(pairingOrder[slotIndex])
                }"
                @pointerdown.prevent="onPairPointerDown(slotIndex, $event)"
              >
                <span class="pairing-pill-name">{{ playerNameById(pairingOrder[slotIndex]) }}</span>
                <span
                  v-if="playerById(pairingOrder[slotIndex])?.skillLevel"
                  class="card-skill"
                  :class="skillClass(playerById(pairingOrder[slotIndex]))"
                >{{ skillShort(playerById(pairingOrder[slotIndex])) }}</span>
              </div>
              <div v-else class="subtitle compact">Drop player</div>
            </div>
          </div>
        </div>
        <div class="pairing-actions">
          <button class="button ghost button-compact" @click="closePairingModal">Cancel</button>
          <button
            class="button button-compact"
            :disabled="awaitingPresentNames.length > 0"
            @click="confirmPairingAdd"
          >Add to Queue</button>
        </div>
      </div>
    </div>
    <div v-if="showEditResult" class="modal-backdrop">
      <div class="modal-card match-modal compact">
        <div class="match-modal-head">
          <div>
            <div class="subtitle">Edit match result</div>
            <h3>Update Result</h3>
          </div>
          <span class="match-burst">🏸</span>
        </div>
        <div v-if="editResultError" class="notice">{{ editResultError }}</div>
        <div class="winner-grid">
          <div class="winner-card team-a">
            <div class="winner-row">
              <div class="winner-info">
                <div class="subtitle">Team A</div>
                <strong>{{ editResultTeams.teamA }}</strong>
              </div>
              <input
                class="input winner-score-input"
                type="number"
                min="0"
                v-model="editResultScoreA"
                placeholder="Score"
              />
            </div>
            <button class="button button-compact" @click="saveEditedResult(1)">Team A Wins</button>
          </div>
          <div class="winner-card team-b">
            <div class="winner-row">
              <div class="winner-info">
                <div class="subtitle">Team B</div>
                <strong>{{ editResultTeams.teamB }}</strong>
              </div>
              <input
                class="input winner-score-input"
                type="number"
                min="0"
                v-model="editResultScoreB"
                placeholder="Score"
              />
            </div>
            <button class="button button-compact secondary" @click="saveEditedResult(2)">Team B Wins</button>
          </div>
        </div>
        <div class="match-modal-actions">
          <button class="button ghost button-compact draw-button" @click="saveEditedResult(null)">Draw</button>
          <button class="button ghost button-compact" @click="closeEditResult">Cancel</button>
        </div>
      </div>
    </div>
    <div v-if="showTeamQueueModal" class="modal-backdrop">
      <div class="modal-card">
        <h3>Queue pairs</h3>
        <div class="subtitle">Confirm this match pairing.</div>
        <div v-if="awaitingTeamPresentNames.length" class="not-arrived">
          <div class="not-arrived-text">
            <strong>{{ awaitingTeamPresentNames.join(', ') }}</strong>
            {{ awaitingTeamPresentNames.length === 1 ? "hasn't" : "haven't" }} arrived yet.
            Mark {{ awaitingTeamPresentNames.length === 1 ? 'them' : 'them all' }} present to queue this match.
          </div>
          <button class="button button-compact" @click="markTeamMembersPresentFromModal">✓ Mark present</button>
        </div>
        <div class="singles-match-row">
          <div v-if="teamQueueOrder[0]" class="singles-pill singles-pill-a">
            {{ teamNameById(teamQueueOrder[0]) }}
          </div>
          <div class="singles-vs">vs</div>
          <div v-if="teamQueueOrder[1]" class="singles-pill singles-pill-b">
            {{ teamNameById(teamQueueOrder[1]) }}
          </div>
        </div>
        <div class="grid two">
          <button class="button" :disabled="awaitingTeamPresentNames.length > 0" @click="confirmTeamQueueAdd">Add to Queue</button>
          <button class="button ghost" @click="closeTeamQueueModal">Cancel</button>
        </div>
      </div>
    </div>

  <!-- Edit Pairing modal -->
  <div v-if="showEditPairing" class="modal-backdrop">
    <div class="modal-card pairing-modal">
      <div class="section-title">Edit Pairing</div>
      <div class="subtitle">Tap a slot to select it, then tap another slot to swap — or tap an idle player to replace.</div>
      <div class="pairing-grid">
        <div class="pairing-team">
          <div class="subtitle">Team A</div>
          <div
            v-for="(player, idx) in editPairingSlots[0]"
            :key="`ea-${idx}`"
            class="pairing-slot"
            :class="{ selected: editPairingSelected?.team === 0 && editPairingSelected?.idx === idx }"
            @click="selectEditSlot(0, idx)"
          >
            <div class="pairing-pill">{{ player.name }}</div>
          </div>
        </div>
        <div class="pairing-team">
          <div class="subtitle">Team B</div>
          <div
            v-for="(player, idx) in editPairingSlots[1]"
            :key="`eb-${idx}`"
            class="pairing-slot"
            :class="{ selected: editPairingSelected?.team === 1 && editPairingSelected?.idx === idx }"
            @click="selectEditSlot(1, idx)"
          >
            <div class="pairing-pill pairing-pill-b">{{ player.name }}</div>
          </div>
        </div>
      </div>
      <div class="edit-pairing-idle">
        <div class="edit-pairing-idle-header">
          <span class="subtitle">Idle Players</span>
          <span v-if="editPairingSelected" class="edit-pairing-idle-hint">Select to replace</span>
        </div>
        <template v-if="editPairingIdlePlayers.length">
          <input
            class="input"
            v-model="editPairingIdleSearch"
            placeholder="Search idle players..."
            style="font-size:13px; padding:7px 10px;"
          />
          <div class="idle-player-list">
            <button
              v-for="p in filteredEditPairingIdlePlayers"
              :key="p.id"
              class="idle-player-row"
              :class="{ 'can-replace': editPairingSelected !== null }"
              @click="replaceWithIdlePlayer(p)"
            >{{ p.name }}</button>
            <p v-if="filteredEditPairingIdlePlayers.length === 0" class="text-muted" style="font-size:12px; margin:6px 0 0;">No matches.</p>
          </div>
        </template>
        <p v-else class="text-muted" style="font-size:12px; margin:0">No idle players available.</p>
      </div>
      <div v-if="editPairingError" class="notice">{{ editPairingError }}</div>
      <div class="pairing-actions edit-pairing-actions">
        <button class="button ghost button-compact" @click="swapEditTeams">↔ Swap Teams</button>
        <div class="edit-pairing-right-actions">
          <button class="button ghost" @click="closeEditPairing">Cancel</button>
          <button class="button" @click="saveEditPairing">Save</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Join Link modal -->
  <div v-if="showJoinLinkModal" class="modal-backdrop">
    <div class="modal-card">
      <h3>Session Join Link</h3>
      <div class="subtitle">Share this link so players can register.</div>
      <div class="share-link">
        <input class="input" readonly :value="joinLink" />
        <button class="button ghost button-compact" :class="{ active: joinLinkCopied }" @click="copyJoinLink">
          {{ joinLinkCopied ? "Copied" : "Copy" }}
        </button>
      </div>
      <button class="button ghost" @click="closeJoinLinkModal">Close</button>
    </div>
  </div>

  <!-- Add players from a group -->
  <div v-if="showGroupPicker" class="modal-backdrop">
    <div class="modal-card">
      <h3>Add from group</h3>
      <div v-if="groupsLoading" class="subtitle">Loading groups…</div>
      <div v-else-if="groups.length === 0" class="subtitle">
        No groups yet. Create one from the Groups tab to reuse a roster here.
      </div>
      <template v-else>
        <div class="field">
          <label class="field-label">Group</label>
          <select class="input" v-model="groupPickerId" @change="loadGroupMembers">
            <option value="">Select a group…</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">
              {{ g.name }} ({{ g.memberCount }})
            </option>
          </select>
        </div>

        <div v-if="groupPickerId" class="group-member-picker">
          <div class="group-picker-head">
            <span class="subtitle">
              {{ groupPickerSelection.length }} selected
              <template v-if="groupSearch.trim()"> · {{ filteredGroupMembers.length }} shown</template>
            </span>
            <button class="button ghost button-compact" @click="toggleGroupSelectAll">
              {{ groupPickerSelection.length ? 'Clear' : (groupSearch.trim() ? 'Select shown' : 'Select all') }}
            </button>
          </div>
          <input
            v-if="groupMembers.length > GROUP_SEARCH_THRESHOLD"
            class="input group-picker-search"
            v-model="groupSearch"
            placeholder="Search this group…"
            autocomplete="off"
          />
          <p v-if="groupMembers.length === 0" class="subtitle">This group has no members yet.</p>
          <p v-else-if="filteredGroupMembers.length === 0" class="subtitle">
            No one in this group matches “{{ groupSearch.trim() }}”.
          </p>
          <p v-else-if="groupPickerSelection.length === 0" class="subtitle">
            Tick the players joining this session.
          </p>
          <label v-for="member in filteredGroupMembers" :key="member.id" class="group-picker-row">
            <input type="checkbox" :value="member.playerId" v-model="groupPickerSelection" />
            <span class="group-picker-name">
              {{ member.player.nickname || member.player.fullName }}
            </span>
            <span v-if="activeSessionPlayerIds.has(member.playerId)" class="group-picker-tag">In session</span>
          </label>
        </div>
      </template>

      <div v-if="groupPickerError" class="notice">{{ groupPickerError }}</div>
      <div class="grid two">
        <button class="button ghost" @click="closeGroupPicker">Cancel</button>
        <button
          class="button"
          :disabled="groupPickerSelection.length === 0 || groupPickerSubmitting"
          @click="addFromGroup"
        >{{ groupPickerSubmitting ? 'Adding…' : `Add ${groupPickerSelection.length}` }}</button>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, withLoadingScope } from "../api.js";
import { track } from "../utils/analytics.js";
import { loadManualTeams } from "../utils/teamBuilder.js";
import { selectedSessionId, setSelectedSessionId } from "../state/sessionStore.js";

const route = useRoute();
const router = useRouter();

function openCreateSession() {
  document.dispatchEvent(new Event("createSession:open"));
}

const activeTab = ref("players");
const players = ref([]);
const session = ref(null);
const sessionPlayers = ref([]);
const queueEntries = ref([]);
const matches = ref([]);
const fullName = ref("");
const skillLevel = ref("Beginner");
const addError = ref("");
const showAddOverLimitWarning = ref(false);
const search = ref("");
const selectedIds = ref([]);
const queueError = ref("");
const removeError = ref("");
const presentError = ref("");
const queueShareLink = ref("");
const queueCopied = ref(false);
let queueCopyTimer = null;
const refreshing = ref(false);
const startY = ref(0);
const isPulling = ref(false);
const showJoinLinkModal = ref(false);
const joinLink = ref("");
const joinLinkCopied = ref(false);
let joinLinkCopyTimer = null;
const historySearch = ref("");
const showDisplayMenu = ref(false);
const showJoinOrder = ref(false);
const showAddPlayerModal = ref(false);
const addPlayerNameInput = ref(null);
const teamSearch = ref("");
const displayMenuRef = ref(null);
const sessionIsOpen = computed(() => session.value?.status === "open");
const showEditPlayer = ref(false);
const editPlayerId = ref("");
const editPlayerName = ref("");
const editSkillLevel = ref("Beginner");
const editError = ref("");
const showDuplicateWarning = ref(false);
const duplicateWarningNames = ref([]);
const showTeamWarning = ref(false);
const teamWarningNames = ref([]);
const pendingQueueOrder = ref(null);
const showRemoveConfirm = ref(false);
const removeConfirmNames = ref([]);
const showCancelConfirm = ref(false);
const cancelMatchTarget = ref(null);
const nowTick = ref(Date.now());
let timerId = null;
const showPairingModal = ref(false);
const pairingOrder = ref([]);
const draggingPairIndex = ref(null);
const pairingHoverIndex = ref(null);
const lastPairingSignature = ref("");
const pairingSelectedIndex = ref(null);
let pairingDragState = null;
let pairingDragEndedAt = 0;
const showSinglesQueueModal = ref(false);
const singlesQueueOrder = ref([]);
const lastSinglesSignature = ref("");
const manualTeams = ref([]);
const selectedTeamIds = ref([]);
const pendingQueueTeams = ref([]);
const pendingQueueMode = ref("players");
const selectionTab = ref("players");
const showTeamQueueModal = ref(false);
const teamQueueOrder = ref([]);
const lastTeamQueueSignature = ref("");
const showEditResult = ref(false);
const editResultMatchId = ref("");
const editResultTeams = ref({ teamA: "—", teamB: "—" });
const editResultScoreA = ref("");
const editResultScoreB = ref("");
const editResultError = ref("");

const showEditPairing = ref(false);
const editPairingMatch = ref(null);
const editPairingSlots = ref([[], []]);
const editPairingSelected = ref(null);
const editPairingError = ref("");
const editPairingIdleSearch = ref("");

const AUTO_QUEUE_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes after last game
// A player can only be queued once we know they're actually at the venue.
// "present" is the explicit confirmation. checked_in on its own shows as
// "Ready" and means registered but unconfirmed — until someone ticks Present
// they don't get called. The exception is anyone who has already played: a
// match is proof enough that they're here, and ending one puts them back on
// checked_in, so without this the rotation would stall after the first round.
function isQueueEligible(sp) {
  if (!sp) return false;
  if (sp.status === "present") return true;
  return sp.status === "checked_in" && Boolean(sp.lastPlayedAt);
}
const PARTNER_HISTORY_LIMIT = 2; // recent partnerships tracked per player

const skillLevels = ["Beginner", "Intermediate", "Advance", "Elite"];
const skillRank = new Map([
  ["Beginner", 1],
  ["Intermediate", 2],
  ["Advance", 3],
  ["Elite", 4]
]);

const sessionGameType = computed(() => {
  const raw = session.value?.gameType || "doubles";
  const normalized = typeof raw === "string" ? raw.toLowerCase() : "doubles";
  return normalized === "single" ? "singles" : normalized;
});
const isTournamentMode = computed(() => session.value?.mode === "tournament");
// Sessions predating the setting read as true, matching the column default.
const matchByLevel = computed(() => session.value?.matchByLevel !== false);
const sessionGameTypeLabel = computed(() =>
  sessionGameType.value === "singles" ? "Singles" : "Doubles"
);
const selectionLimit = computed(() => (sessionGameType.value === "singles" ? 2 : 4));


const sessionPlayerMap = computed(() => {
  const map = new Map();
  sessionPlayers.value.forEach((sp) => map.set(sp.playerId, sp));
  return map;
});

const activeSessionPlayerIds = computed(() => {
  return new Set(sessionPlayers.value.filter((sp) => sp.status !== "done").map((sp) => sp.playerId));
});

const playerMap = computed(() => {
  const map = new Map();
  players.value.forEach((player) => map.set(player.id, player));
  return map;
});

const overallJoinOrderMap = computed(() => {
  const sorted = sessionPlayers.value
    .filter((sp) => sp.status !== "done")
    .sort((a, b) => {
      const aTime = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
      const bTime = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
      return aTime - bTime;
    });
  const map = new Map();
  sorted.forEach((sp, idx) => map.set(sp.playerId, idx + 1));
  return map;
});

const regularJoinOrderMap = computed(() => {
  const sorted = sessionPlayers.value
    .filter((sp) => sp.status !== "done" && !sp.isNewPlayer)
    .sort((a, b) => {
      const aTime = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
      const bTime = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
      return aTime - bTime;
    });
  const map = new Map();
  sorted.forEach((sp, idx) => map.set(sp.playerId, idx + 1));
  return map;
});

const newJoinerOrderMap = computed(() => {
  const sorted = sessionPlayers.value
    .filter((sp) => sp.status !== "done" && sp.isNewPlayer)
    .sort((a, b) => {
      const aTime = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
      const bTime = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
      return aTime - bTime;
    });
  const map = new Map();
  sorted.forEach((sp, idx) => map.set(sp.playerId, idx + 1));
  return map;
});

const regularLimit = computed(() => Number(session.value?.regularJoinLimit || 0));
const newJoinerLimit = computed(() => Number(session.value?.newJoinerLimit || 0));
const regularJoinedCount = computed(
  () => sessionPlayers.value.filter((sp) => sp.status !== "done" && !sp.isNewPlayer).length
);
const newJoinedCount = computed(
  () => sessionPlayers.value.filter((sp) => sp.status !== "done" && sp.isNewPlayer).length
);
const joinLimitExceeded = computed(() => {
  const regularExceeded = regularLimit.value > 0 && regularJoinedCount.value > regularLimit.value;
  const newExceeded = newJoinerLimit.value > 0 && newJoinedCount.value > newJoinerLimit.value;
  return regularExceeded || newExceeded;
});
// True when adding one more regular joiner would exceed the session's limit.
const wouldExceedRegularLimit = computed(
  () => regularLimit.value > 0 && regularJoinedCount.value >= regularLimit.value
);

const playingIds = computed(() => {
  const ids = new Set();
  if (!session.value?.courtSessions) return ids;
  session.value.courtSessions.forEach((cs) => {
    cs.currentMatch?.participants?.forEach((p) => ids.add(p.playerId));
  });
  return ids;
});

const queuedIds = computed(() => {
  const ids = new Set();
  queueEntries.value.forEach((entry) => {
    entry.players.forEach((p) => ids.add(p.playerId));
  });
  return ids;
});

const queuedTeamKeys = computed(() => {
  const keys = new Set();
  queueEntries.value.forEach((entry) => {
    const ids = entry.players.map((p) => p.playerId).filter(Boolean);
    if (ids.length >= 2) {
      keys.add(teamKey(ids));
    }
  });
  return keys;
});

const playingTeamKeys = computed(() => {
  const keys = new Set();
  if (!session.value?.courtSessions) return keys;
  session.value.courtSessions.forEach((courtSession) => {
    const participants = courtSession.currentMatch?.participants || [];
    if (!participants.length) return;
    const team1Ids = participants.filter((p) => p.teamNumber === 1).map((p) => p.playerId).filter(Boolean);
    const team2Ids = participants.filter((p) => p.teamNumber === 2).map((p) => p.playerId).filter(Boolean);
    if (team1Ids.length) keys.add(teamKey(team1Ids));
    if (team2Ids.length) keys.add(teamKey(team2Ids));
  });
  return keys;
});

const sessionPlayerList = computed(() => {
  if (!session.value) return [];
  const requiresPayment = Boolean(session.value.requirePaymentToJoin);
  return sessionPlayers.value
    .filter((sp) => sp.status !== "done")
    // Waitlisted players haven't secured a slot yet — keep them out of the list.
    .filter((sp) => sp.status !== "waitlisted")
    // Hide players who haven't paid yet when the session requires payment to join.
    .filter((sp) => !(requiresPayment && sp.status === "pending_payment"))
    .map((sp) => sp.player);
});

const joinedPlayersForTeams = computed(() => {
  return sessionPlayers.value
    .filter((sp) => sp.status !== "done")
    .sort((a, b) => new Date(a.checkedInAt) - new Date(b.checkedInAt))
    .map((sp) => ({
      id: sp.player.id,
      name: sp.player.nickname || sp.player.fullName,
      teamId: sp.player.teamId || sp.player.team?.id || null,
      teamColor: sp.player.team?.color || null,
      teamName: sp.player.team?.name || null
    }));
});

const filteredPlayers = computed(() => {
  const q = search.value.trim().toLowerCase();
  return sessionPlayerList.value.filter((p) => {
    const name = `${p.fullName} ${p.nickname || ""}`.toLowerCase();
    const matchesSearch = !q || name.includes(q);
    return matchesSearch;
  });
});

// Selected players who still need confirming before they can be queued.
const actionBarRef = ref(null);
const actionBarVisible = ref(true);
let actionBarObserver = null;

// Float the actions only while the real bar is off screen. Watching the bar
// itself, rather than a scroll threshold, means the two can never both show.
// The action bar lives inside a v-if, so re-observe whenever it mounts.
watch(
  actionBarRef,
  (el) => {
    if (actionBarObserver) {
      actionBarObserver.disconnect();
      actionBarObserver = null;
    }
    if (!el || !window.IntersectionObserver) {
      actionBarVisible.value = true;
      return;
    }
    actionBarObserver = new IntersectionObserver(
      ([entry]) => {
        actionBarVisible.value = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    actionBarObserver.observe(el);
  },
  { flush: "post" }
);

const showFloatingActions = computed(
  () =>
    sessionIsOpen.value &&
    activeTab.value === "players" &&
    selectedIds.value.length > 0 &&
    !actionBarVisible.value &&
    (allSelectedAwaitingPresent.value || canAdd.value)
);

const selectedAwaitingPresent = computed(() =>
  selectedIds.value.filter((playerId) => isReadyForPresent(sessionPlayerMap.value.get(playerId)))
);

// Marking present is a Ready-player action, so the floating button only offers
// it when every selected player is Ready. A mix of Ready and already-confirmed
// players is cleanly neither action, so nothing floats.
const allSelectedAwaitingPresent = computed(
  () =>
    selectedIds.value.length > 0 &&
    selectedAwaitingPresent.value.length === selectedIds.value.length
);

const canAdd = computed(() => {
  if (!session.value || !sessionIsOpen.value) return false;
  if (selectedAwaitingPresent.value.length) return false;
  return selectedIds.value.length === selectionLimit.value;
});
// Fairness, in the order players actually argue about it: fewest games first,
// then whoever has been sitting out longest, then arrival order.
function byFairness(a, b) {
  if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
  if (b.idleMs !== a.idleMs) return b.idleMs - a.idleMs;
  // Everyone who hasn't played yet ties on games and idle time, so this
  // tie-break decides who plays first all night. Whoever checked in earliest
  // goes first; sorting by name quietly favoured the alphabet.
  if (a.checkedInMs !== b.checkedInMs) return a.checkedInMs - b.checkedInMs;
  // Checked in together (a whole group added at once): stable, but not
  // alphabetical.
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// Everyone free to be called right now, cooldown aside, in fairness order.
const availableCandidates = computed(() => {
  if (!session.value) return [];
  const now = nowTick.value;
  return sessionPlayers.value
    .filter((sp) => sp?.player)
    .filter((sp) => {
      if (!isQueueEligible(sp)) return false;
      return !playingIds.value.has(sp.playerId) && !queuedIds.value.has(sp.playerId);
    })
    .map((sp) => {
      const idleMs = sp.lastPlayedAt
        ? Math.max(0, now - new Date(sp.lastPlayedAt).getTime())
        : Number.MAX_SAFE_INTEGER;
      const cooldownRemainingMs = sp.lastPlayedAt
        ? Math.max(0, AUTO_QUEUE_COOLDOWN_MS - (now - new Date(sp.lastPlayedAt).getTime()))
        : 0;
      return {
        id: sp.playerId,
        player: sp.player,
        skill: skillRank.get(sp.player?.skillLevel) ?? 2,
        idleMs,
        idleSeconds: sp.lastPlayedAt ? Math.floor(idleMs / 1000) : Number.MAX_SAFE_INTEGER,
        // Missing check-in time sorts last rather than jumping the queue.
        checkedInMs: sp.checkedInAt ? new Date(sp.checkedInAt).getTime() : Number.MAX_SAFE_INTEGER,
        gamesPlayed: sp.gamesPlayed || 0,
        cooldownRemainingMs,
        rested: cooldownRemainingMs === 0
      };
    })
    .sort(byFairness);
});

// Map<playerId, Set<partnerId>> — last PARTNER_HISTORY_LIMIT partners per player
const recentPartnersMap = computed(() => {
  const map = new Map();
  const playerSeen = new Map();
  const ended = [...matches.value]
    .filter((m) => m.status === "ended" && m.matchType === "doubles")
    .reverse(); // newest first
  for (const match of ended) {
    const participants = match.participants || [];
    for (const teamNum of [1, 2]) {
      const pair = participants
        .filter((p) => p.teamNumber === teamNum)
        .map((p) => p.playerId)
        .filter(Boolean);
      if (pair.length !== 2) continue;
      const [p1, p2] = pair;
      const seen1 = playerSeen.get(p1) || 0;
      const seen2 = playerSeen.get(p2) || 0;
      if (seen1 < PARTNER_HISTORY_LIMIT) {
        if (!map.has(p1)) map.set(p1, new Set());
        map.get(p1).add(p2);
        playerSeen.set(p1, seen1 + 1);
      }
      if (seen2 < PARTNER_HISTORY_LIMIT) {
        if (!map.has(p2)) map.set(p2, new Set());
        map.get(p2).add(p1);
        playerSeen.set(p2, seen2 + 1);
      }
    }
  }
  return map;
});

// Players who have had their breather. The normal pool.
const idleCandidates = computed(() => availableCandidates.value.filter((c) => c.rested));

// What Auto Q may draw from. Rested players first, always; a player still
// catching their breath is only reached when there aren't enough rested ones to
// fill a court. The cooldown used to be a hard gate, which deadlocked small
// sessions: twelve players on two courts means the four who just finished are
// the only ones free, and Auto Q sat dead for three minutes. Graded like the
// skill bands — try the good answer, fall back rather than stall.
const autoQueuePool = computed(() => {
  const rested = idleCandidates.value;
  if (rested.length >= selectionLimit.value) return rested;
  return [...rested, ...availableCandidates.value.filter((c) => !c.rested)];
});

const canAutoQueue = computed(
  () => session.value && sessionIsOpen.value && autoQueuePool.value.length >= selectionLimit.value
);

// Why Auto Q is unavailable, in the operator's terms. Empty when it's usable.
const autoQueueHint = computed(() => {
  if (!session.value || !sessionIsOpen.value || canAutoQueue.value) return "";
  const short = selectionLimit.value - autoQueuePool.value.length;
  return `Need ${short} more player${short === 1 ? "" : "s"} — ${autoQueuePool.value.length} free`;
});

// Members of the selected pairs who still need confirming at the venue.
const selectedTeamsAwaitingPresent = computed(() => {
  const teamMap = new Map(teamOptions.value.map((team) => [team.id, team]));
  return selectedTeamIds.value
    .flatMap((id) => teamMap.get(id)?.memberIds || [])
    .filter((playerId) => isReadyForPresent(sessionPlayerMap.value.get(playerId)));
});

const canAddTeams = computed(
  () =>
    session.value &&
    sessionIsOpen.value &&
    sessionGameType.value === "doubles" &&
    selectedTeamIds.value.length === 2 &&
    // Same gate as the player path: a pair containing an unconfirmed "Ready"
    // player can't be queued either.
    selectedTeamsAwaitingPresent.value.length === 0
);

const queueMatchCount = computed(() => queueMatches.value.length);

const editPairingIdlePlayers = computed(() => {
  if (!showEditPairing.value || !editPairingMatch.value) return [];
  const inSlots = new Set([
    ...editPairingSlots.value[0].map((p) => p.id),
    ...editPairingSlots.value[1].map((p) => p.id)
  ]);
  const editingEntryIds = new Set(editPairingMatch.value.entryIds);
  const queuedElsewhere = new Set();
  queueEntries.value.forEach((entry) => {
    if (!editingEntryIds.has(entry.id)) {
      entry.players.forEach((p) => queuedElsewhere.add(p.playerId));
    }
  });
  return sessionPlayers.value
    .filter((sp) => {
      // Same gate as the queue: an unconfirmed "Ready" player can't be swapped
      // into a match either.
      if (!isQueueEligible(sp)) return false;
      if (playingIds.value.has(sp.playerId)) return false;
      if (queuedElsewhere.has(sp.playerId)) return false;
      if (inSlots.has(sp.playerId)) return false;
      return true;
    })
    .map((sp) => ({ id: sp.playerId, name: sp.player.nickname || sp.player.fullName }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
});

const filteredEditPairingIdlePlayers = computed(() => {
  const q = editPairingIdleSearch.value.trim().toLowerCase();
  if (!q) return editPairingIdlePlayers.value;
  return editPairingIdlePlayers.value.filter((p) => p.name.toLowerCase().includes(q));
});

const manualAssignedIds = computed(() => {
  const ids = new Set();
  manualTeams.value.forEach((team) => {
    const memberIds = (team.memberIds || []).filter((id) => typeof id === "string" && id.length > 0);
    if (!memberIds.length) return;
    if (isTournamentMode.value) {
      if (memberIds.length < 2) return;
      const teamA = playerTeamIdById(memberIds[0]);
      const teamB = playerTeamIdById(memberIds[1]);
      if (!teamA || teamA !== teamB) return;
    }
    memberIds.forEach((id) => ids.add(id));
  });
  return ids;
});

const autoTeams = computed(() => {
  const available = joinedPlayersForTeams.value.filter((player) => !manualAssignedIds.value.has(player.id));
  return buildAutoTeams(available);
});

const teamOptions = computed(() => {
  if (!session.value || sessionGameType.value !== "doubles") return [];
  const manualList = manualTeams.value.map((team) => ({
    ...team,
    memberIds: Array.isArray(team.memberIds) ? team.memberIds : []
  }));
  const manualKeys = new Set(manualList.map((team) => teamKey(team.memberIds)));
  const mergedTeams = [
    ...manualList,
    ...autoTeams.value.filter((team) => !manualKeys.has(teamKey(team.memberIds || [])))
  ];
  return mergedTeams.map((team) => {
    const memberIds = Array.isArray(team.memberIds) ? team.memberIds : [];
    const memberPlayers = memberIds
      .map((id) => sessionPlayerMap.value.get(id)?.player || playerMap.value.get(id))
      .filter(Boolean);
    const memberNames = memberPlayers.map((player) => player.nickname || player.fullName);
    const memberTeamIds = memberPlayers
      .map((player) => player.teamId || player.team?.id || null)
      .filter(Boolean);
    const sharedTeamId =
      memberTeamIds.length === memberPlayers.length && new Set(memberTeamIds).size === 1 ? memberTeamIds[0] : null;
    const sharedTeam = sharedTeamId
      ? memberPlayers.find((player) => (player.teamId || player.team?.id) === sharedTeamId)?.team
      : null;
    const teamColor = sharedTeam?.color || null;
    const pairTeamId = sharedTeamId || null;
    const missingMembers = memberIds.some((id) => !activeSessionPlayerIds.value.has(id));
    return {
      ...team,
      memberIds,
      memberNames,
      teamColor,
      pairTeamId,
      displayName: memberNames.length ? memberNames.join(" + ") : team.name || "Team",
      missingMembers,
      status: resolveTeamStatus(memberIds, missingMembers, team.disabled)
    };
  });
});

const filteredTeamOptions = computed(() => {
  if (!teamSearch.value.trim()) return teamOptions.value;
  const term = teamSearch.value.trim().toLowerCase();
  return teamOptions.value.filter((team) => {
    if ((team.displayName || "").toLowerCase().includes(term)) return true;
    if (team.memberNames?.some((name) => name.toLowerCase().includes(term))) return true;
    return false;
  });
});

const teamOptionMap = computed(() => new Map(teamOptions.value.map((team) => [team.id, team])));

function isReadyForPresent(sp) {
  if (!sp) return false;
  if (sp.status === "checked_in") return !sp.lastPlayedAt;
  return false;
}

const showMarkPresent = computed(
  () => sessionIsOpen.value && selectedAwaitingPresent.value.length > 0
);
const duplicateWarningText = computed(() => {
  if (!duplicateWarningNames.value.length) {
    return "Selected players are already queued or playing. Add to queue again?";
  }
  return `These players are already queued or playing: ${duplicateWarningNames.value.join(", ")}. Add to queue again?`;
});

const teamWarningText = computed(() => {
  if (!teamWarningNames.value.length) {
    return "Players must belong to a team before queueing in tournament mode.";
  }
  return `Assign these players to a team before queueing: ${teamWarningNames.value.join(", ")}.`;
});

const removeConfirmText = computed(() => {
  if (!removeConfirmNames.value.length) return "Remove the selected players from this session?";
  return `Remove ${removeConfirmNames.value.join(", ")} from this session?`;
});

const queueMatches = computed(() => {
  const entries = queueEntries.value.slice();
  const matches = [];
  const entryTeamId = (entry) => {
    if (!entry?.players?.length) return null;
    const teamIds = entry.players.map((p) => p.player?.teamId || p.player?.team?.id || null);
    if (teamIds.some((id) => !id)) return null;
    const unique = new Set(teamIds);
    if (unique.size !== 1) return null;
    return teamIds[0];
  };

  if (!isTournamentMode.value) {
    for (let i = 0; i < entries.length; i += 2) {
      const a = entries[i];
      const b = entries[i + 1];
      if (!a || !b) break;
      matches.push({
        id: `${a.id}-${b.id}`,
        typeLabel: a.type === "doubles" ? "Doubles Match" : "Singles Match",
        teamA: a.players.map((p) => p.player.nickname || p.player.fullName),
        teamB: b.players.map((p) => p.player.nickname || p.player.fullName),
        requestedAt: a.createdAt,
        entryIds: [a.id, b.id],
        matchType: a.type,
        teamIds: [
          a.players.map((p) => p.playerId),
          b.players.map((p) => p.playerId)
        ],
        teamPlayers: [
          a.players.map((p) => ({ id: p.playerId, name: p.player.nickname || p.player.fullName })),
          b.players.map((p) => ({ id: p.playerId, name: p.player.nickname || p.player.fullName }))
        ]
      });
    }
    return matches;
  }

  const used = new Set();
  for (let i = 0; i < entries.length; i += 1) {
    const a = entries[i];
    if (!a || used.has(a.id)) continue;
    const teamAId = entryTeamId(a);
    if (!teamAId) continue;
    let paired = false;
    for (let j = i + 1; j < entries.length; j += 1) {
      const b = entries[j];
      if (!b || used.has(b.id)) continue;
      const teamBId = entryTeamId(b);
      if (!teamBId || teamBId === teamAId) continue;
      matches.push({
        id: `${a.id}-${b.id}`,
        typeLabel: a.type === "doubles" ? "Doubles Match" : "Singles Match",
        teamA: a.players.map((p) => p.player.nickname || p.player.fullName),
        teamB: b.players.map((p) => p.player.nickname || p.player.fullName),
        requestedAt: a.createdAt,
        entryIds: [a.id, b.id],
        matchType: a.type,
        teamIds: [
          a.players.map((p) => p.playerId),
          b.players.map((p) => p.playerId)
        ],
        teamPlayers: [
          a.players.map((p) => ({ id: p.playerId, name: p.player.nickname || p.player.fullName })),
          b.players.map((p) => ({ id: p.playerId, name: p.player.nickname || p.player.fullName }))
        ]
      });
      used.add(a.id);
      used.add(b.id);
      paired = true;
      break;
    }
    if (!paired) continue;
  }
  return matches;
});

const availableCourts = computed(() => {
  return (session.value?.courtSessions || [])
    .filter((c) => c.status === "available")
    .slice()
    .sort((a, b) => {
      const aName = a.court?.name || a.name || "";
      const bName = b.court?.name || b.name || "";
      const aNum = Number(aName.match(/\d+/)?.[0] || Number.POSITIVE_INFINITY);
      const bNum = Number(bName.match(/\d+/)?.[0] || Number.POSITIVE_INFINITY);
      if (aNum !== bNum) return aNum - bNum;
      return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: "base" });
    });
});

function isPlaying(player) {
  return playingIds.value.has(player.id);
}

function isQueued(player) {
  return queuedIds.value.has(player.id);
}

function isNewPlayer(player) {
  return sessionPlayerMap.value.get(player.id)?.isNewPlayer || false;
}

function gamesPlayed(playerId) {
  return sessionPlayerMap.value.get(playerId)?.gamesPlayed || 0;
}

// Short, scannable skill-level badge for the player card.
const SKILL_SHORT = {
  Beginner: "Beg",
  Intermediate: "Int",
  Advance: "Adv",
  Elite: "Elite"
};
function skillShort(player) {
  return SKILL_SHORT[player?.skillLevel] || player?.skillLevel || "";
}
function skillClass(player) {
  return (player?.skillLevel || "").toLowerCase();
}

function joinOrderLabel(playerId) {
  if (sessionPlayerMap.value.get(playerId)?.isNewPlayer) {
    const order = newJoinerOrderMap.value.get(playerId);
    return order ? `n${order}` : "—";
  }
  const order = regularJoinOrderMap.value.get(playerId);
  return order ? `r${order}` : "—";
}

function isOverJoinLimit(playerId) {
  const sp = sessionPlayerMap.value.get(playerId);
  if (!sp) return false;
  if (sp.isNewPlayer) {
    const limit = newJoinerLimit.value;
    if (!limit) return false;
    const order = newJoinerOrderMap.value.get(playerId);
    return order ? order > limit : false;
  }
  const limit = regularLimit.value;
  if (!limit) return false;
  const order = regularJoinOrderMap.value.get(playerId);
  return order ? order > limit : false;
}

function statusLabel(player) {
  if (isPlaying(player)) return "Playing";
  if (isQueued(player)) return "Queued";
  const sp = sessionPlayerMap.value.get(player.id);
  if (!sp) return "—";
  if (sp.status === "pending_payment") return "Awaiting payment";
  if (sp.status === "waitlisted") return "Waitlisted";
  if (sp.status === "away") return "Away";
  if (sp.status === "done") return "Done";
  if (sp.status === "present") return "Present";
  if (sp.status === "checked_in") {
    if (!sessionIsOpen.value) return "Ready";
    if (sp.lastPlayedAt) {
      const elapsed = idleElapsed(sp);
      return `Idle ${elapsed}`;
    }
    return "Ready";
  }
  return "—";
}

function statusClass(player) {
  if (isPlaying(player)) return "playing";
  if (isQueued(player)) return "queued";
  const sp = sessionPlayerMap.value.get(player.id);
  if (!sp) return "neutral";
  if (sp.status === "pending_payment") return "warning";
  if (sp.status === "waitlisted") return "neutral";
  if (sp.status === "away") return "away";
  if (sp.status === "done") return "done";
  if (sp.status === "present") return "present";
  if (sp.status === "checked_in") {
    return sp.lastPlayedAt ? "idle" : "checkedin";
  }
  return "neutral";
}

function idleElapsed(sp) {
  const start = sp.lastPlayedAt;
  if (!start) return "0:00";
  const diffMs = Math.max(0, nowTick.value - new Date(start).getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function toggleSelect(player) {
  if (!sessionIsOpen.value) return;
  if (isPlaying(player)) return;
  if (selectedIds.value.includes(player.id)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== player.id);
    return;
  }
  if (selectedIds.value.length >= selectionLimit.value) return;
  selectedIds.value = [...selectedIds.value, player.id];
}

function clearSelection() {
  selectedIds.value = [];
}

function toggleTeamSelection(team) {
  if (!sessionIsOpen.value) return;
  if (!team || isTeamDisabled(team)) return;
  if (selectedTeamIds.value.includes(team.id)) {
    selectedTeamIds.value = selectedTeamIds.value.filter((id) => id !== team.id);
    return;
  }
  if (selectedTeamIds.value.length >= 2) return;
  selectedTeamIds.value = [...selectedTeamIds.value, team.id];
}

function clearTeamSelection() {
  selectedTeamIds.value = [];
}

function clearTeamSearch() {
  teamSearch.value = "";
}

function teamNameById(id) {
  return teamOptionMap.value.get(id)?.displayName || "Team";
}

function isTeamDisabled(team) {
  if (!team) return true;
  if (!sessionIsOpen.value) return true;
  if (team.disabled) return true;
  if (!team.memberIds || team.memberIds.length < 2) return true;
  if (team.missingMembers) return true;
  if (isTournamentMode.value && !team.pairTeamId) return true;
  return false;
}

function resolveTeamStatus(memberIds, missingMembers, disabled) {
  if (!memberIds || memberIds.length < 2) return "";
  if (missingMembers || disabled) return "";
  const key = teamKey(memberIds);
  if (playingTeamKeys.value.has(key)) return "Playing";
  if (queuedTeamKeys.value.has(key)) return "Queued";
  return "";
}

function buildAutoTeams(players) {
  const teams = [];
  const used = new Set();
  const teamBuckets = new Map();
  const teamOrder = [];

  for (const player of players) {
    if (!player.teamId) continue;
    if (!teamBuckets.has(player.teamId)) {
      teamBuckets.set(player.teamId, []);
      teamOrder.push(player.teamId);
    }
    teamBuckets.get(player.teamId).push(player);
  }

  for (const teamId of teamOrder) {
    const bucket = teamBuckets.get(teamId) || [];
    while (bucket.length >= 2) {
      const first = bucket.shift();
      const second = bucket.shift();
      if (!first || !second) break;
      used.add(first.id);
      used.add(second.id);
      const memberIds = [first.id, second.id];
      teams.push(buildTeam(memberIds, `${first.name} + ${second.name}`, { source: "auto" }));
    }
  }

  if (!isTournamentMode.value) {
    const remaining = players.filter((player) => !used.has(player.id));
    for (let i = 0; i < remaining.length; i += 2) {
      const first = remaining[i];
      const second = remaining[i + 1];
      if (!first) break;
      if (second) {
        const memberIds = [first.id, second.id];
        teams.push(buildTeam(memberIds, `${first.name} + ${second.name}`, { source: "auto" }));
      } else {
        const memberIds = [first.id];
        teams.push(
          buildTeam(memberIds, `${first.name} + BYE`, {
            disabled: true,
            source: "auto",
            teamKeyOverride: teamKey([first.id, `bye-${first.id}`])
          })
        );
      }
    }
  }
  return teams;
}

function buildTeam(memberIds, name, options = {}) {
  return {
    id: options.teamKeyOverride || teamKey(memberIds),
    name,
    memberIds,
    disabled: Boolean(options.disabled),
    source: options.source
  };
}

function teamKey(ids) {
  return ids.slice().sort().join("+");
}

function buildBalancedDoublesOrder(candidates, partnerMap = new Map()) {
  if (candidates.length !== 4) return candidates.map((candidate) => candidate.id);
  const ids = candidates.map((candidate) => candidate.id);
  const skills = candidates.map((candidate) => candidate.skill);
  const idleTimes = candidates.map((candidate) => candidate.idleSeconds ?? 0);
  const pairings = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]]
  ];
  let best = pairings[0];
  let bestDiff = Number.POSITIVE_INFINITY;
  let bestRecentPairs = Number.POSITIVE_INFINITY;
  let bestMix = Number.NEGATIVE_INFINITY;
  pairings.forEach((pairing) => {
    const [[a1, a2], [b1, b2]] = pairing;
    const sumA = skills[a1] + skills[a2];
    const sumB = skills[b1] + skills[b2];
    const diff = Math.abs(sumA - sumB);
    const mix = Math.abs(skills[a1] - skills[a2]) + Math.abs(skills[b1] - skills[b2]);
    // count how many proposed pairs have recently played together
    let recentPairs = 0;
    if (partnerMap.get(ids[a1])?.has(ids[a2])) recentPairs++;
    if (partnerMap.get(ids[b1])?.has(ids[b2])) recentPairs++;
    const better =
      diff < bestDiff ||
      (diff === bestDiff && recentPairs < bestRecentPairs) ||
      (diff === bestDiff && recentPairs === bestRecentPairs && mix > bestMix);
    if (better) {
      best = pairing;
      bestDiff = diff;
      bestRecentPairs = recentPairs;
      bestMix = mix;
    }
  });
  const [[a1, a2], [b1, b2]] = best;
  const idleA = idleTimes[a1] + idleTimes[a2];
  const idleB = idleTimes[b1] + idleTimes[b2];
  if (idleB > idleA) {
    return [ids[b1], ids[b2], ids[a1], ids[a2]];
  }
  return [ids[a1], ids[a2], ids[b1], ids[b2]];
}

function load() {
  // Wrap the whole multi-step load as one logical loading operation so the
  // global loading modal stays up continuously instead of flickering between
  // the sequential requests below.
  return withLoadingScope(async () => {
    players.value = await api.listPlayers();
    let currentSession = null;
    if (selectedSessionId.value) {
      try {
        currentSession = await api.session(selectedSessionId.value);
      } catch {
        setSelectedSessionId("");
      }
    }
    if (!currentSession) {
      try {
        currentSession = await api.activeSession();
      } catch {
        currentSession = null;
      }
      if (currentSession?.id) setSelectedSessionId(currentSession.id);
    }
    session.value = currentSession;
    if (!currentSession) {
      queueEntries.value = [];
      sessionPlayers.value = [];
      matches.value = [];
      manualTeams.value = [];
      selectedTeamIds.value = [];
      return;
    }

    const [queueResult, playersResult, matchesResult] = await Promise.allSettled([
      api.getQueue(currentSession.id),
      api.sessionPlayers(currentSession.id),
      api.matchHistory(currentSession.id)
    ]);

    queueEntries.value = queueResult.status === "fulfilled" ? queueResult.value : [];
    sessionPlayers.value = playersResult.status === "fulfilled" ? playersResult.value : [];
    matches.value = matchesResult.status === "fulfilled" ? matchesResult.value : [];
    manualTeams.value = sessionGameType.value === "doubles" ? loadManualTeams(currentSession.id) : [];
  });
}

// ── Add players from a group ─────────────────────────────────────────
const showGroupPicker = ref(false);
const groups = ref([]);
const groupsLoading = ref(false);
const groupPickerId = ref("");
const groupMembers = ref([]);
const groupPickerSelection = ref([]);
const groupSearch = ref("");
// Below this, the list is short enough to read at a glance and the search box
// is just clutter.
const GROUP_SEARCH_THRESHOLD = 8;

const filteredGroupMembers = computed(() => {
  const term = groupSearch.value.trim().toLowerCase();
  if (!term) return groupMembers.value;
  return groupMembers.value.filter((m) =>
    `${m.player?.fullName || ""} ${m.player?.nickname || ""}`.toLowerCase().includes(term)
  );
});
const groupPickerSubmitting = ref(false);
const groupPickerError = ref("");

async function openGroupPicker() {
  groupPickerError.value = "";
  groupPickerId.value = "";
  groupMembers.value = [];
  groupPickerSelection.value = [];
  groupSearch.value = "";
  showGroupPicker.value = true;
  groupsLoading.value = true;
  try {
    groups.value = await api.listGroups();
  } catch (err) {
    groupPickerError.value = err.message || "Unable to load groups";
  } finally {
    groupsLoading.value = false;
  }
}

function closeGroupPicker() {
  showGroupPicker.value = false;
  groupPickerError.value = "";
}

async function loadGroupMembers() {
  groupPickerError.value = "";
  groupMembers.value = [];
  groupPickerSelection.value = [];
  groupSearch.value = "";
  if (!groupPickerId.value) return;
  try {
    const group = await api.group(groupPickerId.value);
    groupMembers.value = group.members || [];
    // Nothing is ticked to start: picking a group only shows who's on it, and
    // the organiser chooses who's actually playing. "Select all" is one tap
    // away for the nights when it's everyone.
    groupPickerSelection.value = [];
  } catch (err) {
    groupPickerError.value = err.message || "Unable to load group members";
  }
}

function toggleGroupSelectAll() {
  if (groupPickerSelection.value.length) {
    groupPickerSelection.value = [];
    return;
  }
  // Skip anyone already in the session — they don't need adding again. With a
  // search active this ticks what's on screen, which is what the button reads.
  groupPickerSelection.value = filteredGroupMembers.value
    .map((m) => m.playerId)
    .filter((playerId) => !activeSessionPlayerIds.value.has(playerId));
}

async function addFromGroup() {
  if (!session.value) return;
  groupPickerError.value = "";
  groupPickerSubmitting.value = true;
  try {
    await api.addSessionPlayers(session.value.id, {
      groupId: groupPickerId.value,
      playerIds: groupPickerSelection.value
    });
    showGroupPicker.value = false;
    await load();
  } catch (err) {
    groupPickerError.value = err.message || "Unable to add players";
  } finally {
    groupPickerSubmitting.value = false;
  }
}

// Pull-to-refresh (mobile)
async function pullRefresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await load();
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

function openAddPlayerModal() {
  addError.value = "";
  fullName.value = "";
  skillLevel.value = skillLevels[0];
  showAddPlayerModal.value = true;
  // Wait for the modal to render before the field exists to focus.
  nextTick(() => addPlayerNameInput.value?.focus());
}

function closeAddPlayerModal() {
  showAddPlayerModal.value = false;
  addError.value = "";
}

async function addPlayer() {
  addError.value = "";
  if (!fullName.value.trim()) {
    addError.value = "Player name is required.";
    return;
  }
  // Players added here check in as regular joiners, so warn before pushing the
  // session past its regular join limit — let staff decide whether to continue.
  if (sessionIsOpen.value && wouldExceedRegularLimit.value) {
    showAddOverLimitWarning.value = true;
    return;
  }
  await performAddPlayer();
}

async function performAddPlayer() {
  try {
    const created = await api.createPlayer({ fullName: fullName.value.trim(), skillLevel: skillLevel.value });
    if (session.value?.id && sessionIsOpen.value) {
      await api.checkinPlayer(created.id, { sessionId: session.value.id });
      track("player-checkin", { source: "add" });
    }
    fullName.value = "";
    showAddPlayerModal.value = false;
    await load();
  } catch (err) {
    addError.value = err.message || "Unable to add player";
  }
}

function confirmAddOverLimit() {
  showAddOverLimitWarning.value = false;
  performAddPlayer();
}

function closeAddOverLimitWarning() {
  showAddOverLimitWarning.value = false;
}

async function ensureCheckedIn(playerIds) {
  if (!session.value) return;
  for (const playerId of playerIds) {
    const sp = sessionPlayerMap.value.get(playerId);
    if (!sp || (sp.status !== "checked_in" && sp.status !== "present")) {
      await api.checkinPlayer(playerId, { sessionId: session.value.id });
    }
  }
}

async function addToQueue() {
  if (!session.value || !sessionIsOpen.value) {
    queueError.value = "Session is not open.";
    return;
  }
  queueError.value = "";
  removeError.value = "";
  presentError.value = "";
  const awaiting = selectedAwaitingPresent.value;
  if (awaiting.length) {
    const who = awaiting.map((id) => playerMap.value.get(id)?.nickname || playerMap.value.get(id)?.fullName || "?");
    queueError.value = `Mark ${who.join(", ")} present first — they haven't checked in at the venue yet.`;
    return;
  }
  if (selectedIds.value.length !== selectionLimit.value) {
    queueError.value = `Select ${selectionLimit.value} players.`;
    return;
  }
  if (isTournamentMode.value) {
    if (!precheckTournamentSelection(selectedIds.value)) {
      return;
    }
  }

  try {
    if (sessionGameType.value === "singles" && selectedIds.value.length === 2) {
      if (!showSinglesQueueModal.value) openSinglesQueueModal();
      return;
    }
    if (sessionGameType.value === "doubles" && selectedIds.value.length === 4) {
      openPairingModal();
      return;
    }
    await attemptQueue(selectedIds.value);
  } catch (err) {
    queueError.value = err.message || "Unable to add to queue";
  }
}

// Auto Q picks by fairness, but four players spanning Beginner to Elite makes a
// poor game however you split them: the balancer can equalise the two sides
// (Beginner+Advance vs Beginner+Advance sums the same) while everyone on court
// has a bad time. So constrain the *spread* of the foursome, not just the gap
// between the sides.
//
// The fairest player anchors the group — they've waited longest or played least,
// so they play regardless. The rest are taken in fairness order, skipping anyone
// who would widen the group beyond the band. Bands are tried narrowest first and
// the last one is unconstrained, so a thin or lopsided pool still fills a court
// rather than stalling.
const SKILL_BANDS = [0, 1, 2, 3];

function pickBalancedGroup(candidates, needed) {
  if (candidates.length < needed) return [];
  // Off for a mixed-level social session: fairness order alone decides.
  if (!matchByLevel.value) return candidates.slice(0, needed);
  const anchor = candidates[0];
  const rest = candidates.slice(1);

  for (const band of SKILL_BANDS) {
    const group = [anchor];
    let lo = anchor.skill;
    let hi = anchor.skill;
    for (const candidate of rest) {
      if (group.length === needed) break;
      const nextLo = Math.min(lo, candidate.skill);
      const nextHi = Math.max(hi, candidate.skill);
      if (nextHi - nextLo > band) continue;
      group.push(candidate);
      lo = nextLo;
      hi = nextHi;
    }
    if (group.length === needed) return group;
  }
  return candidates.slice(0, needed);
}

// The players Auto Q would take right now: fairest first, narrowed to a similar
// level, then split into sides. Shared by the button and the standing proposal
// so the two can never show different answers.
function computeAutoQueueOrder() {
  const needed = selectionLimit.value;
  if (autoQueuePool.value.length < needed) return [];
  const selected = pickBalancedGroup(autoQueuePool.value, needed);
  if (selected.length < needed) return [];
  return sessionGameType.value === "doubles" && selected.length === 4
    ? buildBalancedDoublesOrder(selected, recentPartnersMap.value)
    : selected.map((candidate) => candidate.id);
}

// Surfaced before it's asked for, so ending a match and starting the next one
// is a single tap rather than Auto Q followed by confirming the pairing.
const autoQueueProposal = computed(() => {
  if (!session.value || !sessionIsOpen.value || !canAutoQueue.value) return null;
  if (isTournamentMode.value) return null;
  const order = computeAutoQueueOrder();
  if (!order.length) return null;
  const name = (id) => playerMap.value.get(id)?.nickname || playerMap.value.get(id)?.fullName || "?";
  const half = order.length / 2;
  // Worth saying out loud when there weren't enough rested players to fill the
  // court, so a short turnaround doesn't look like a bug.
  const restedIds = new Set(idleCandidates.value.map((c) => c.id));
  const resting = order.filter((id) => !restedIds.has(id)).length;
  return {
    order,
    resting,
    teamA: order.slice(0, half).map(name),
    teamB: order.slice(half).map(name)
  };
});

// Commit the proposal as shown, skipping the pairing modal — the sides are
// already on screen, so confirming them again buys nothing.
async function queueProposal() {
  const proposal = autoQueueProposal.value;
  if (!proposal || proposalSubmitting.value) return;
  proposalSubmitting.value = true;
  queueError.value = "";
  try {
    await attemptQueue(proposal.order);
  } catch (err) {
    queueError.value = err.message || "Unable to add to queue";
  } finally {
    proposalSubmitting.value = false;
  }
}

// Same four, but open the pairing modal to rearrange the sides first.
function editProposal() {
  const proposal = autoQueueProposal.value;
  if (!proposal) return;
  selectedIds.value = proposal.order.slice();
  openPairingModal();
}

const proposalSubmitting = ref(false);

async function autoQueueIdle() {
  if (!session.value || !sessionIsOpen.value) {
    queueError.value = "Session is not open.";
    return;
  }
  queueError.value = "";
  removeError.value = "";
  presentError.value = "";
  const needed = selectionLimit.value;
  if (autoQueuePool.value.length < needed) {
    queueError.value = `Need ${needed} available players to auto queue.`;
    return;
  }
  const order = computeAutoQueueOrder();
  if (!order.length) {
    queueError.value = `Need ${needed} idle players to auto queue.`;
    return;
  }
  try {
    selectedIds.value = order;
    await addToQueue();
  } catch (err) {
    queueError.value = err.message || "Unable to add to queue";
  }
}

async function markPresent() {
  if (!session.value || !sessionIsOpen.value || selectedIds.value.length === 0) return;
  presentError.value = "";
  try {
    const readyIds = selectedIds.value.filter((playerId) =>
      isReadyForPresent(sessionPlayerMap.value.get(playerId))
    );
    if (readyIds.length === 0) return;
    for (const playerId of readyIds) {
      await api.presentPlayer(playerId, { sessionId: session.value.id });
    }
    await load();
    clearSelection();
  } catch (err) {
    presentError.value = err.message || "Unable to mark present";
  }
}

async function removeEntry(entryId) {
  if (!session.value || !sessionIsOpen.value) return;
  await api.dequeue(session.value.id, { entryId });
  await load();
}

async function assignMatch(match, court) {
  if (!session.value || !sessionIsOpen.value) return;
  await api.startMatch(session.value.id, {
    courtSessionId: court.id,
    matchType: match.matchType,
    teams: match.teamIds,
    entryIds: match.entryIds
  });
  track("match-started", { matchType: match.matchType });
  await load();
}

async function cancelQueuedMatch(match) {
  if (!session.value || !sessionIsOpen.value) return;
  cancelMatchTarget.value = match;
  showCancelConfirm.value = true;
}

async function confirmCancelMatch() {
  if (!session.value || !cancelMatchTarget.value) return;
  for (const entryId of cancelMatchTarget.value.entryIds) {
    await api.dequeue(session.value.id, { entryId });
  }
  cancelMatchTarget.value = null;
  showCancelConfirm.value = false;
  await load();
}

function closeCancelConfirm() {
  showCancelConfirm.value = false;
  cancelMatchTarget.value = null;
}

function openEditPairing(match) {
  editPairingMatch.value = match;
  editPairingSlots.value = [
    match.teamPlayers[0].map((p) => ({ ...p })),
    match.teamPlayers[1].map((p) => ({ ...p }))
  ];
  editPairingSelected.value = null;
  editPairingError.value = "";
  editPairingIdleSearch.value = "";
  showEditPairing.value = true;
}

function closeEditPairing() {
  showEditPairing.value = false;
  editPairingMatch.value = null;
  editPairingSlots.value = [[], []];
  editPairingSelected.value = null;
  editPairingError.value = "";
  editPairingIdleSearch.value = "";
}

function selectEditSlot(team, idx) {
  if (!editPairingSelected.value) {
    editPairingSelected.value = { team, idx };
    return;
  }
  const prev = editPairingSelected.value;
  if (prev.team === team && prev.idx === idx) {
    editPairingSelected.value = null;
    return;
  }
  const slots = editPairingSlots.value.map((t) => [...t]);
  const tmp = slots[prev.team][prev.idx];
  slots[prev.team][prev.idx] = slots[team][idx];
  slots[team][idx] = tmp;
  editPairingSlots.value = slots;
  editPairingSelected.value = null;
}

function replaceWithIdlePlayer(player) {
  if (!editPairingSelected.value) return;
  const { team, idx } = editPairingSelected.value;
  const slots = editPairingSlots.value.map((t) => [...t]);
  slots[team][idx] = player;
  editPairingSlots.value = slots;
  editPairingSelected.value = null;
}

function swapEditTeams() {
  const [teamA, teamB] = editPairingSlots.value;
  editPairingSlots.value = [[...teamB], [...teamA]];
  editPairingSelected.value = null;
}

async function saveEditPairing() {
  if (!session.value || !editPairingMatch.value) return;
  editPairingError.value = "";
  const match = editPairingMatch.value;
  const sessionId = session.value.id;
  const allEntryIds = queueEntries.value.map((e) => e.id);
  const matchStartIdx = allEntryIds.indexOf(match.entryIds[0]);
  try {
    await api.dequeue(sessionId, { entryId: match.entryIds[0] });
    await api.dequeue(sessionId, { entryId: match.entryIds[1] });
    const newEntryA = await api.enqueue(sessionId, {
      type: match.matchType,
      playerIds: editPairingSlots.value[0].map((p) => p.id)
    });
    const newEntryB = await api.enqueue(sessionId, {
      type: match.matchType,
      playerIds: editPairingSlots.value[1].map((p) => p.id)
    });
    const remaining = allEntryIds.filter((id) => !match.entryIds.includes(id));
    const newOrder = [
      ...remaining.slice(0, matchStartIdx),
      newEntryA.id,
      newEntryB.id,
      ...remaining.slice(matchStartIdx)
    ];
    await api.reorder(sessionId, { orderedEntryIds: newOrder });
    closeEditPairing();
    await load();
  } catch (err) {
    editPairingError.value = err.message || "Unable to update pairing";
  }
}

async function openJoinLink() {
  if (!session.value) return;
  const link = await api.createSessionInviteLink(session.value.id);
  track("invite-link-created", { from: "players" });
  joinLink.value = `${link.appBaseUrl || "https://kue.arshii.net"}/join/${link.token}`;
  try {
    await navigator.clipboard.writeText(joinLink.value);
    joinLinkCopied.value = true;
    if (joinLinkCopyTimer) window.clearTimeout(joinLinkCopyTimer);
    joinLinkCopyTimer = window.setTimeout(() => { joinLinkCopied.value = false; }, 2000);
  } catch {
    // Clipboard unavailable — fall back to the modal so the link can be copied manually.
    showJoinLinkModal.value = true;
  }
}

async function copyJoinLink() {
  if (!joinLink.value) return;
  await navigator.clipboard.writeText(joinLink.value);
  joinLinkCopied.value = true;
  if (joinLinkCopyTimer) window.clearTimeout(joinLinkCopyTimer);
  joinLinkCopyTimer = window.setTimeout(() => { joinLinkCopied.value = false; }, 1500);
}

function closeJoinLinkModal() {
  showJoinLinkModal.value = false;
  joinLink.value = "";
  joinLinkCopied.value = false;
}

async function createQueueShareLink() {
  if (!session.value) return;
  const link = await api.createSessionShareLink(session.value.id);
  track("share-link-created", { from: "players", type: "queue" });
  queueShareLink.value = `${link.appBaseUrl || "https://kue.arshii.net"}/q/${link.token}`;
  try {
    await navigator.clipboard.writeText(queueShareLink.value);
    queueCopied.value = true;
    if (queueCopyTimer) window.clearTimeout(queueCopyTimer);
    queueCopyTimer = window.setTimeout(() => { queueCopied.value = false; }, 2000);
  } catch {
    // Clipboard unavailable — the link stays visible in the card below for manual copy.
  }
}

async function copyQueueShareLink() {
  if (!queueShareLink.value) return;
  await navigator.clipboard.writeText(queueShareLink.value);
  queueCopied.value = true;
  if (queueCopyTimer) window.clearTimeout(queueCopyTimer);
  queueCopyTimer = window.setTimeout(() => {
    queueCopied.value = false;
  }, 1500);
}

function matchTeams(match) {
  const team1 = match.participants.filter((p) => p.teamNumber === 1).map((p) => p.player.nickname || p.player.fullName);
  const team2 = match.participants.filter((p) => p.teamNumber === 2).map((p) => p.player.nickname || p.player.fullName);
  return `${team1.join(" + ")} vs ${team2.join(" + ")}`;
}

function teamNames(match, teamNumber) {
  if (!match) return "—";
  return match.participants
    .filter((p) => p.teamNumber === teamNumber)
    .map((p) => p.player.nickname || p.player.fullName)
    .join(" + ");
}

function formatTime(timestamp) {
  if (!timestamp) return "—";
  const dt = new Date(timestamp);
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseScoreValue(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function matchScore(match, teamNumber) {
  if (!match) return null;
  const score = extractScore(match.scoreJson);
  if (!score) return null;
  return teamNumber === 1 ? score.team1 ?? null : score.team2 ?? null;
}

function extractScore(scoreJson) {
  if (!scoreJson) return null;
  if (Array.isArray(scoreJson)) {
    if (scoreJson.length === 2 && scoreJson.every((v) => typeof v === "number")) {
      return { team1: scoreJson[0], team2: scoreJson[1] };
    }
    if (scoreJson.every((v) => Array.isArray(v) && v.length >= 2)) {
      const totals = scoreJson.reduce(
        (acc, set) => {
          const [a, b] = set;
          return {
            team1: acc.team1 + (Number(a) || 0),
            team2: acc.team2 + (Number(b) || 0)
          };
        },
        { team1: 0, team2: 0 }
      );
      return totals;
    }
  }
  if (typeof scoreJson === "object") {
    const value = (key) => {
      const raw = scoreJson?.[key];
      const num = Number(raw);
      return Number.isFinite(num) ? num : undefined;
    };
    const team1 =
      value("team1") ??
      value("teamA") ??
      value("score1") ??
      value("home") ??
      value("a");
    const team2 =
      value("team2") ??
      value("teamB") ??
      value("score2") ??
      value("away") ??
      value("b");
    if (team1 != null || team2 != null) {
      return { team1, team2 };
    }
    if (Array.isArray(scoreJson.scores) && scoreJson.scores.length >= 2) {
      const [a, b] = scoreJson.scores;
      const team1Score = Number(a);
      const team2Score = Number(b);
      if (Number.isFinite(team1Score) || Number.isFinite(team2Score)) {
        return {
          team1: Number.isFinite(team1Score) ? team1Score : undefined,
          team2: Number.isFinite(team2Score) ? team2Score : undefined
        };
      }
      return null;
    }
    if (Array.isArray(scoreJson.sets) && scoreJson.sets.length) {
      const totals = scoreJson.sets.reduce(
        (acc, set) => {
          const a = Number(set?.team1 ?? set?.teamA ?? set?.score1 ?? set?.a ?? 0);
          const b = Number(set?.team2 ?? set?.teamB ?? set?.score2 ?? set?.b ?? 0);
          return {
            team1: acc.team1 + (Number.isFinite(a) ? a : 0),
            team2: acc.team2 + (Number.isFinite(b) ? b : 0)
          };
        },
        { team1: 0, team2: 0 }
      );
      return totals;
    }
  }
  return null;
}

const historyOrderMap = computed(() => {
  const sorted = [...matches.value].sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return aTime - bTime;
  });
  const map = new Map();
  sorted.forEach((match, idx) => map.set(match.id, idx + 1));
  return map;
});

const filteredHistory = computed(() => {
  const q = historySearch.value.trim().toLowerCase();
  const source = [...matches.value].sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return aTime - bTime;
  });
  if (!q) return source;
  return source.filter((match) =>
    match.participants.some((p) => {
      const name = `${p.player.fullName} ${p.player.nickname || ""}`.toLowerCase();
      return name.includes(q);
    })
  );
});

function durationLabel(startedAt, endedAt) {
  if (!startedAt || !endedAt) return "—";
  const diffMs = Math.max(0, new Date(endedAt) - new Date(startedAt));
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function historyOrder(match) {
  return historyOrderMap.value.get(match.id) || "—";
}

function openEditPlayer(player) {
  editPlayerId.value = player.id;
  editPlayerName.value = player.fullName;
  editSkillLevel.value = player.skillLevel || "Beginner";
  editError.value = "";
  showEditPlayer.value = true;
}

async function saveEditPlayer() {
  if (!editPlayerId.value) return;
  if (!editPlayerName.value.trim()) {
    editError.value = "Player name is required.";
    return;
  }
  try {
    await api.updatePlayer(editPlayerId.value, {
      fullName: editPlayerName.value.trim(),
      skillLevel: editSkillLevel.value
    });
    closeEditPlayer();
    await load();
  } catch (err) {
    editError.value = err.message || "Unable to update player";
  }
}

function closeEditPlayer() {
  showEditPlayer.value = false;
  editPlayerId.value = "";
  editPlayerName.value = "";
  editSkillLevel.value = "Beginner";
  editError.value = "";
}

function openEditResult(match) {
  if (!match || match.status !== "ended") return;
  editResultError.value = "";
  editResultMatchId.value = match.id;
  editResultTeams.value = {
    teamA: teamNames(match, 1) || "—",
    teamB: teamNames(match, 2) || "—"
  };
  const score = extractScore(match.scoreJson);
  editResultScoreA.value = score?.team1 ?? "";
  editResultScoreB.value = score?.team2 ?? "";
  showEditResult.value = true;
}

function closeEditResult() {
  showEditResult.value = false;
  editResultMatchId.value = "";
  editResultTeams.value = { teamA: "—", teamB: "—" };
  editResultScoreA.value = "";
  editResultScoreB.value = "";
  editResultError.value = "";
}

function hasDuplicateSelection(order = selectedIds.value) {
  return order.some((playerId) => queuedIds.value.has(playerId) || playingIds.value.has(playerId));
}

function openDuplicateWarning(order = selectedIds.value) {
  pendingQueueOrder.value = order.slice();
  pendingQueueMode.value = "players";
  pendingQueueTeams.value = [];
  duplicateWarningNames.value = order
    .filter((playerId) => queuedIds.value.has(playerId) || playingIds.value.has(playerId))
    .map((id) => players.value.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => p.nickname || p.fullName);
  showDuplicateWarning.value = true;
}

function closeDuplicateWarning() {
  showDuplicateWarning.value = false;
  duplicateWarningNames.value = [];
  pendingQueueOrder.value = null;
  pendingQueueTeams.value = [];
  pendingQueueMode.value = "players";
}

async function confirmDuplicateWarning() {
  showDuplicateWarning.value = false;
  try {
    if (pendingQueueMode.value === "teams") {
      await enqueueSelectedTeams(pendingQueueTeams.value);
    } else {
      await enqueueSelectedPlayers(pendingQueueOrder.value || selectedIds.value);
    }
  } catch (err) {
    queueError.value = err.message || "Unable to add to queue";
  } finally {
    duplicateWarningNames.value = [];
    pendingQueueOrder.value = null;
    pendingQueueTeams.value = [];
    pendingQueueMode.value = "players";
  }
}

function openDuplicateWarningForTeams(playerIds, teamIds) {
  pendingQueueOrder.value = playerIds.slice();
  pendingQueueMode.value = "teams";
  pendingQueueTeams.value = teamIds.slice();
  duplicateWarningNames.value = playerIds
    .filter((playerId) => queuedIds.value.has(playerId) || playingIds.value.has(playerId))
    .map((id) => players.value.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => p.nickname || p.fullName);
  showDuplicateWarning.value = true;
}

async function enqueueSelectedPlayers(order = selectedIds.value) {
  await ensureCheckedIn(order);
  if (sessionGameType.value === "doubles") {
    const teamA = order.slice(0, 2);
    const teamB = order.slice(2, 4);
    await api.enqueue(session.value.id, { type: "doubles", playerIds: teamA });
    await api.enqueue(session.value.id, { type: "doubles", playerIds: teamB });
  } else {
    for (const playerId of order) {
      await api.enqueue(session.value.id, { type: "singles", playerIds: [playerId] });
    }
  }
  track("queue-add", { kind: "players", gameType: sessionGameType.value, count: order.length });
  selectedIds.value = [];
  await load();
}

async function enqueueSelectedTeams(teamIds = selectedTeamIds.value) {
  if (!session.value || sessionGameType.value !== "doubles") return;
  const teamMap = new Map(teamOptions.value.map((team) => [team.id, team]));
  const teams = teamIds.map((id) => teamMap.get(id)).filter(Boolean);
  const allPlayers = teams.flatMap((team) => team.memberIds || []);
  if (!allPlayers.length) return;
  const awaiting = allPlayers.filter((playerId) =>
    isReadyForPresent(sessionPlayerMap.value.get(playerId))
  );
  if (awaiting.length) {
    const who = awaiting.map((id) => playerNameById(id));
    queueError.value = `Mark ${who.join(", ")} present first — they haven't checked in at the venue yet.`;
    return;
  }
  await ensureCheckedIn(allPlayers);
  for (const team of teams) {
    if (!team.memberIds || team.memberIds.length < 2) continue;
    await api.enqueue(session.value.id, { type: "doubles", playerIds: team.memberIds });
  }
  track("queue-add", { kind: "teams", count: teams.length });
  selectedTeamIds.value = [];
  await load();
}

function openRemoveConfirm() {
  removeError.value = "";
  queueError.value = "";
  if (!session.value || selectedIds.value.length === 0) return;
  const blockedIds = selectedIds.value.filter(
    (playerId) => queuedIds.value.has(playerId) || playingIds.value.has(playerId)
  );
  if (blockedIds.length) {
    const names = blockedIds
      .map((id) => players.value.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => p.nickname || p.fullName);
    removeError.value = names.length
      ? `Cannot remove queued or playing players: ${names.join(", ")}.`
      : "Cannot remove queued or playing players.";
    return;
  }
  removeConfirmNames.value = selectedIds.value
    .map((id) => players.value.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => p.nickname || p.fullName);
  showRemoveConfirm.value = true;
}

function closeRemoveConfirm() {
  showRemoveConfirm.value = false;
  removeConfirmNames.value = [];
}

function openSinglesQueueModal() {
  singlesQueueOrder.value = selectedIds.value.slice(0, 2);
  showSinglesQueueModal.value = true;
}

function closeSinglesQueueModal() {
  showSinglesQueueModal.value = false;
  singlesQueueOrder.value = [];
}

function openPairingModal() {
  pairingOrder.value = selectedIds.value.slice();
  draggingPairIndex.value = null;
  pairingHoverIndex.value = null;
  pairingSelectedIndex.value = null;
  showPairingModal.value = true;
}

function closePairingModal() {
  showPairingModal.value = false;
  pairingOrder.value = [];
  draggingPairIndex.value = null;
  pairingHoverIndex.value = null;
  pairingSelectedIndex.value = null;
}

function openTeamQueueModal() {
  teamQueueOrder.value = selectedTeamIds.value.slice(0, 2);
  showTeamQueueModal.value = true;
}

function closeTeamQueueModal() {
  showTeamQueueModal.value = false;
  teamQueueOrder.value = [];
}

async function confirmPairingAdd() {
  if (!session.value || pairingOrder.value.length !== 4) return;
  showPairingModal.value = false;
  try {
    await attemptQueue(pairingOrder.value);
  } catch (err) {
    queueError.value = err.message || "Unable to add to queue";
  } finally {
    pairingOrder.value = [];
    draggingPairIndex.value = null;
    pairingHoverIndex.value = null;
    pairingSelectedIndex.value = null;
  }
}

async function confirmTeamQueueAdd() {
  if (!session.value || teamQueueOrder.value.length !== 2) return;
  showTeamQueueModal.value = false;
  try {
    await attemptQueueTeams(teamQueueOrder.value);
  } catch (err) {
    queueError.value = err.message || "Unable to add teams to queue";
  } finally {
    teamQueueOrder.value = [];
  }
}

async function saveEditedResult(winnerTeam) {
  if (!session.value || !editResultMatchId.value) return;
  editResultError.value = "";
  try {
    const payload = { matchId: editResultMatchId.value, winnerTeam };
    const scoreA = parseScoreValue(editResultScoreA.value);
    const scoreB = parseScoreValue(editResultScoreB.value);
    if (scoreA != null || scoreB != null) {
      const score = {};
      if (scoreA != null) score.team1 = scoreA;
      if (scoreB != null) score.team2 = scoreB;
      payload.score = score;
    }
    await api.updateMatchResult(session.value.id, payload);
    closeEditResult();
    await load();
  } catch (err) {
    editResultError.value = err.message || "Unable to update match result";
  }
}

async function confirmSinglesQueueAdd() {
  if (!session.value || singlesQueueOrder.value.length !== 2) return;
  showSinglesQueueModal.value = false;
  try {
    await attemptQueue(singlesQueueOrder.value);
  } catch (err) {
    queueError.value = err.message || "Unable to add to queue";
  } finally {
    singlesQueueOrder.value = [];
  }
}

function onPairPointerDown(index, event) {
  if (!pairingOrder.value[index]) return;
  event.preventDefault();
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  const ghost = target.cloneNode(true);
  ghost.classList.add("pairing-ghost");
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  document.body.appendChild(ghost);

  pairingDragState = {
    originIndex: index,
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    ghost,
    element: target
  };
  draggingPairIndex.value = index;
  pairingHoverIndex.value = index;

  try {
    target.setPointerCapture(event.pointerId);
  } catch {
    // ignore capture errors
  }

  updatePairGhostPosition(event.clientX, event.clientY);
  window.addEventListener("pointermove", onPairPointerMove);
  window.addEventListener("pointerup", onPairPointerUp);
  window.addEventListener("pointercancel", onPairPointerUp);
}

function onPairPointerMove(event) {
  if (!pairingDragState || event.pointerId !== pairingDragState.pointerId) return;
  updatePairGhostPosition(event.clientX, event.clientY);
  if (!pairingDragState.moved) {
    const dx = Math.abs(event.clientX - pairingDragState.startX);
    const dy = Math.abs(event.clientY - pairingDragState.startY);
    if (dx > 4 || dy > 4) pairingDragState.moved = true;
  }
  const index = findPairSlotIndex(event.clientX, event.clientY);
  pairingHoverIndex.value = index;
}

function onPairPointerUp(event) {
  if (!pairingDragState || event.pointerId !== pairingDragState.pointerId) return;
  const originIndex = pairingDragState.originIndex;
  const dropIndex = pairingHoverIndex.value;
  cleanupPairDrag(event);
  if (dropIndex == null || dropIndex === originIndex) return;
  const next = pairingOrder.value.slice();
  const temp = next[dropIndex];
  next[dropIndex] = next[originIndex];
  next[originIndex] = temp;
  pairingOrder.value = next;
}

function handleDisplayMenuOutsideClick(event) {
  if (!showDisplayMenu.value) return;
  const menuEl = displayMenuRef.value;
  if (!menuEl || menuEl.contains(event.target)) return;
  showDisplayMenu.value = false;
}

function updatePairGhostPosition(x, y) {
  if (!pairingDragState?.ghost) return;
  pairingDragState.ghost.style.transform = `translate(${x - pairingDragState.offsetX}px, ${
    y - pairingDragState.offsetY
  }px)`;
}

function findPairSlotIndex(x, y) {
  const el = document.elementFromPoint(x, y);
  const slot = el?.closest?.(".pairing-slot");
  if (!slot) return null;
  const idx = Number(slot.dataset.index);
  return Number.isFinite(idx) ? idx : null;
}

function cleanupPairDrag(event) {
  window.removeEventListener("pointermove", onPairPointerMove);
  window.removeEventListener("pointerup", onPairPointerUp);
  window.removeEventListener("pointercancel", onPairPointerUp);
  if (pairingDragState?.element && pairingDragState.pointerId != null) {
    try {
      pairingDragState.element.releasePointerCapture(pairingDragState.pointerId);
    } catch {
      // ignore release errors
    }
  }
  if (pairingDragState?.ghost) {
    pairingDragState.ghost.remove();
  }
  if (pairingDragState?.moved) {
    pairingDragEndedAt = Date.now();
  }
  pairingDragState = null;
  draggingPairIndex.value = null;
  pairingHoverIndex.value = null;
}

function playerNameById(id) {
  const player = playerMap.value.get(id);
  return player ? player.nickname || player.fullName : "Unknown";
}

function isAwaitingPresentId(playerId) {
  return isReadyForPresent(sessionPlayerMap.value.get(playerId));
}

// Names of the selected players who haven't been confirmed at the venue yet.
const awaitingPresentNames = computed(() =>
  selectedAwaitingPresent.value.map((id) => playerNameById(id))
);

const awaitingTeamPresentNames = computed(() =>
  selectedTeamsAwaitingPresent.value.map((id) => playerNameById(id))
);

// Marking present from inside a queue modal must not wipe the selection the
// modal is built from, or the modal closes under the user mid-fix.
async function markPresentFromModal() {
  await markPresentIds(selectedAwaitingPresent.value);
}

// The team modal's players come from the selected pairs, not from selectedIds.
async function markTeamMembersPresentFromModal() {
  await markPresentIds(selectedTeamsAwaitingPresent.value);
}

async function markPresentIds(playerIds) {
  if (!session.value || !sessionIsOpen.value || !playerIds.length) return;
  presentError.value = "";
  try {
    for (const playerId of playerIds) {
      await api.presentPlayer(playerId, { sessionId: session.value.id });
    }
    await load();
  } catch (err) {
    presentError.value = err.message || "Unable to mark present";
  }
}

// The pairing modals work in ids, and the skill badge helpers take a player.
function playerById(id) {
  return playerMap.value.get(id) || null;
}

function playerTeamIdById(playerId) {
  const sp = sessionPlayerMap.value.get(playerId);
  return sp?.player?.teamId || sp?.player?.team?.id || playerMap.value.get(playerId)?.teamId || null;
}

function playerTeamColor(player) {
  return player?.team?.color || null;
}

function playerCardStyle(player) {
  const color = playerTeamColor(player);
  return color ? { "--team-color": color } : {};
}

function openTeamWarning(order) {
  teamWarningNames.value = order
    .map((id) => players.value.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => p.nickname || p.fullName);
  showTeamWarning.value = true;
}

function closeTeamWarning() {
  showTeamWarning.value = false;
  teamWarningNames.value = [];
}

function precheckTournamentSelection(order) {
  if (!isTournamentMode.value) return true;
  queueError.value = "";
  const missing = order.filter((id) => !playerTeamIdById(id));
  if (missing.length) {
    openTeamWarning(missing);
    return false;
  }
  if (sessionGameType.value === "singles") {
    if (order.length !== 2) return false;
    const teamA = playerTeamIdById(order[0]);
    const teamB = playerTeamIdById(order[1]);
    if (teamA === teamB) {
      queueError.value = "Select players from different teams.";
      return false;
    }
  }
  if (sessionGameType.value === "doubles") {
    if (order.length !== 4) return false;
    const counts = new Map();
    order.forEach((id) => {
      const teamId = playerTeamIdById(id);
      counts.set(teamId, (counts.get(teamId) || 0) + 1);
    });
    if (counts.size !== 2) {
      queueError.value = "Select players from two teams.";
      return false;
    }
    if (![...counts.values()].every((count) => count === 2)) {
      queueError.value = "Select two players from each team.";
      return false;
    }
  }
  return true;
}

function validateTournamentOrder(order) {
  if (!isTournamentMode.value) return true;
  const missing = order.filter((id) => !playerTeamIdById(id));
  if (missing.length) {
    openTeamWarning(missing);
    return false;
  }
  if (sessionGameType.value === "singles") {
    if (order.length !== 2) return false;
    const teamA = playerTeamIdById(order[0]);
    const teamB = playerTeamIdById(order[1]);
    if (teamA === teamB) {
      queueError.value = "Teams must be different.";
      return false;
    }
  }
  if (sessionGameType.value === "doubles") {
    if (order.length !== 4) return false;
    const teamA = playerTeamIdById(order[0]);
    const teamA2 = playerTeamIdById(order[1]);
    const teamB = playerTeamIdById(order[2]);
    const teamB2 = playerTeamIdById(order[3]);
    if (teamA !== teamA2 || teamB !== teamB2) {
      queueError.value = "Each team must be from the same team.";
      return false;
    }
    if (teamA === teamB) {
      queueError.value = "Teams must be different.";
      return false;
    }
  }
  return true;
}

function selectPairSlot(index) {
  if (!pairingOrder.value[index]) return;
  if (draggingPairIndex.value != null) return;
  if (Date.now() - pairingDragEndedAt < 250) return;
  if (pairingSelectedIndex.value == null) {
    pairingSelectedIndex.value = index;
    return;
  }
  if (pairingSelectedIndex.value === index) {
    pairingSelectedIndex.value = null;
    return;
  }
  const next = pairingOrder.value.slice();
  const temp = next[index];
  next[index] = next[pairingSelectedIndex.value];
  next[pairingSelectedIndex.value] = temp;
  pairingOrder.value = next;
  pairingSelectedIndex.value = null;
}

async function attemptQueue(order) {
  queueError.value = "";
  if (!validateTournamentOrder(order)) {
    return;
  }
  if (hasDuplicateSelection(order)) {
    openDuplicateWarning(order);
    return;
  }
  await enqueueSelectedPlayers(order);
}

async function addSelectedTeams() {
  if (!session.value || !sessionIsOpen.value) {
    queueError.value = "Session is not open.";
    return;
  }
  queueError.value = "";
  const teamMap = new Map(teamOptions.value.map((team) => [team.id, team]));
  const teams = selectedTeamIds.value.map((id) => teamMap.get(id)).filter(Boolean);
  if (teams.length !== 2) {
    queueError.value = "Select 2 pairs.";
    return;
  }
  if (isTournamentMode.value) {
    const teamA = teams[0].pairTeamId;
    const teamB = teams[1].pairTeamId;
    if (!teamA || !teamB) {
      queueError.value = "Select pairs from the same team.";
      return;
    }
    if (teamA === teamB) {
      queueError.value = "Teams must be different.";
      return;
    }
  }
  if (!showTeamQueueModal.value) {
    openTeamQueueModal();
    return;
  }
  await attemptQueueTeams(selectedTeamIds.value);
}

async function attemptQueueTeams(teamIds) {
  if (!session.value || !sessionIsOpen.value) {
    queueError.value = "Session is not open.";
    return;
  }
  const teamMap = new Map(teamOptions.value.map((team) => [team.id, team]));
  const teams = teamIds.map((id) => teamMap.get(id)).filter(Boolean);
  if (teams.length !== 2) {
    queueError.value = "Select 2 pairs.";
    return;
  }
  const invalid = teams.some((team) => isTeamDisabled(team));
  if (invalid) {
    queueError.value = "One or more pairs are missing players.";
    return;
  }
  if (isTournamentMode.value) {
    const teamA = teams[0].pairTeamId;
    const teamB = teams[1].pairTeamId;
    if (!teamA || !teamB) {
      queueError.value = "Select pairs from the same team.";
      return;
    }
    if (teamA === teamB) {
      queueError.value = "Teams must be different.";
      return;
    }
  }
  const playerIds = teams.flatMap((team) => team.memberIds || []);
  if (hasDuplicateSelection(playerIds)) {
    openDuplicateWarningForTeams(playerIds, teams.map((team) => team.id));
    return;
  }
  try {
    await enqueueSelectedTeams(teams.map((team) => team.id));
  } catch (err) {
    queueError.value = err.message || "Unable to add teams to queue";
  }
}

watch(
  () => selectedTeamIds.value.join("|"),
  (signature) => {
    if (sessionGameType.value !== "doubles") return;
    if (selectionTab.value !== "teams") return;
    if (selectedTeamIds.value.length !== 2) {
      if (showTeamQueueModal.value) closeTeamQueueModal();
      lastTeamQueueSignature.value = "";
      return;
    }
    if (showTeamQueueModal.value) return;
    if (signature && signature !== lastTeamQueueSignature.value) {
      lastTeamQueueSignature.value = signature;
      openTeamQueueModal();
    }
  }
);

watch(
  () => selectedIds.value.join("|"),
  (signature) => {
    if (sessionGameType.value === "singles") {
      if (selectedIds.value.length !== 2) {
        if (showSinglesQueueModal.value) closeSinglesQueueModal();
        return;
      }
      if (isTournamentMode.value && !precheckTournamentSelection(selectedIds.value)) {
        return;
      }
      if (showSinglesQueueModal.value) return;
      if (signature && signature !== lastSinglesSignature.value) {
        lastSinglesSignature.value = signature;
        openSinglesQueueModal();
      }
      return;
    }
    if (sessionGameType.value !== "doubles") return;
    if (selectedIds.value.length !== 4) return;
    if (isTournamentMode.value && !precheckTournamentSelection(selectedIds.value)) {
      return;
    }
    if (showPairingModal.value) return;
    if (signature && signature !== lastPairingSignature.value) {
      lastPairingSignature.value = signature;
      openPairingModal();
    }
  }
);

watch(
  [showPairingModal, showSinglesQueueModal, showTeamQueueModal, showEditResult],
  ([pairingOpen, singlesOpen, teamOpen, editOpen]) => {
    document.body.style.overflow = pairingOpen || singlesOpen || teamOpen || editOpen ? "hidden" : "";
    if (!pairingOpen) {
      cleanupPairDrag();
    }
  }
);

watch(sessionIsOpen, (isOpen) => {
  if (!isOpen) {
    selectedIds.value = [];
    selectedTeamIds.value = [];
    teamSearch.value = "";
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    return;
  }
  if (!timerId) {
    timerId = setInterval(() => {
      nowTick.value = Date.now();
    }, 1000);
  }
});

async function confirmRemoveSelected() {
  showRemoveConfirm.value = false;
  removeError.value = "";
  if (!session.value || selectedIds.value.length === 0) {
    removeConfirmNames.value = [];
    return;
  }
  try {
    for (const playerId of selectedIds.value) {
      await api.checkoutPlayer(playerId, { sessionId: session.value.id, status: "done" });
    }
    selectedIds.value = [];
    await load();
  } catch (err) {
    removeError.value = err.message || "Unable to remove player";
  } finally {
    removeConfirmNames.value = [];
  }
}

watch(sessionGameType, () => {
  selectedIds.value = [];
  lastSinglesSignature.value = "";
  lastPairingSignature.value = "";
  lastTeamQueueSignature.value = "";
  if (sessionGameType.value !== "doubles") {
    selectedTeamIds.value = [];
    manualTeams.value = [];
    teamSearch.value = "";
    selectionTab.value = "players";
    return;
  }
  if (session.value?.id) {
    manualTeams.value = loadManualTeams(session.value.id);
  }
  selectionTab.value = "teams";
});

watch(isTournamentMode, (isTournament) => {
  if (!isTournament) return;
  selectedTeamIds.value = [];
  if (sessionGameType.value !== "doubles") {
    selectionTab.value = "players";
  }
});

watch(selectedSessionId, () => {
  selectedIds.value = [];
  selectedTeamIds.value = [];
  teamSearch.value = "";
  lastTeamQueueSignature.value = "";
  selectionTab.value = "players";
  closeEditResult();
  load();
});

watch(teamOptions, (teams) => {
  const ids = new Set(teams.map((team) => team.id));
  selectedTeamIds.value = selectedTeamIds.value.filter((id) => ids.has(id));
});

// A group page can hand off here with ?group=<id> — open the picker on that
// group so "Add to session" from a group is still one trip.
async function openGroupPickerFromLink(groupId) {
  await openGroupPicker();
  groupPickerId.value = groupId;
  await loadGroupMembers();
  // Drop the query so a refresh (or going back) doesn't reopen the modal.
  router.replace({ path: "/players" });
}

onMounted(async () => {
  await load();
  const linkedGroup = route.query.group;
  if (linkedGroup) {
    await openGroupPickerFromLink(String(linkedGroup));
  }
  // The sessionIsOpen watcher may already have started the tick timer while we
  // were awaiting load(), so only start one if it hasn't.
  if (sessionIsOpen.value && !timerId) {
    timerId = setInterval(() => {
      nowTick.value = Date.now();
    }, 1000);
  }
  document.addEventListener("click", handleDisplayMenuOutsideClick);
});

onUnmounted(() => {
  if (actionBarObserver) {
    actionBarObserver.disconnect();
    actionBarObserver = null;
  }
  if (timerId) clearInterval(timerId);
  document.body.style.overflow = "";
  cleanupPairDrag();
  document.removeEventListener("click", handleDisplayMenuOutsideClick);
});
</script>

<style scoped>
/* ── Pull-to-refresh ────────────────────────────────────────────── */
.pull-indicator {
  text-align: center;
  font-size: 13px;
  color: #ffffff;
  background: var(--accent, #1565c0);
  padding: 6px;
  border-radius: 8px;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  /* cancel the parent's flex gap while collapsed */
  margin-bottom: -16px;
  transition: max-height 0.2s, opacity 0.2s, padding 0.2s, margin-bottom 0.2s;
}
.pull-indicator.active {
  max-height: 40px;
  opacity: 1;
  margin-bottom: 0;
}

/* ── Page shell ─────────────────────────────────────────────────── */
.players-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* app-shell already pads sides; no extra horizontal padding needed */
  /* Pull the tab strip up toward the nav: the header leaves a 20px gap below
     itself, which reads as too much empty space above the transparent tabs. */
  margin-top: -25px;
}

.not-arrived {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 10px 0 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(217, 119, 6, 0.10);
  border: 1px solid rgba(217, 119, 6, 0.28);
}

.not-arrived-text {
  flex: 1;
  min-width: 160px;
  font-size: 13px;
  line-height: 1.45;
}

/* Which of the four it is, so the notice doesn't send you hunting. */
.pairing-pill.not-arrived-pill {
  background: rgba(217, 119, 6, 0.18);
  color: #92400e;
  box-shadow: inset 0 0 0 1px rgba(217, 119, 6, 0.45);
}

/* ── Floating actions ────────────────────────────────────────────── */
.floating-actions {
  position: fixed;
  left: 16px;
  right: 16px;
  /* Clear of the fixed mobile nav; under it and under modals in the stack. */
  bottom: 88px;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid var(--border);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.18);
}

.floating-count {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--ink-soft);
}

.float-pop-enter-active,
.float-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.float-pop-enter-from,
.float-pop-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (min-width: 880px) {
  .floating-actions {
    left: auto;
    right: 24px;
    bottom: 24px;
    width: auto;
  }
}

/* ── Tab bar (underline tabs) ────────────────────────────────────── */
.players-tab-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid var(--border);
  /* Stays put while the roster scrolls, parked directly under the sticky app
     header. --header-h is measured in App.vue; the fallback is the mobile
     height in case a page renders before the first measurement. */
  position: sticky;
  top: var(--header-h, 69px);
  z-index: 40;
  /* Opaque, or the list shows through as it scrolls underneath. The strip was
     transparent while it scrolled away with the content. */
  background: var(--bg-0);
}

.players-tab {
  border: none;
  background: transparent;
  padding: 12px 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-soft);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  /* The active underline sits on the row's hairline divider. */
  border-bottom: 2.5px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.players-tab:hover {
  color: var(--ink);
}

.players-tab.active {
  /* No fill — the accent underline plus the colour and weight shift carry it,
     which also keeps the strip flat now that it stays pinned while scrolling. */
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 700;
}

.tab-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--accent-2);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ── Text helpers ────────────────────────────────────────────────── */
.text-muted {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 0;
}

.empty-state {
  font-size: 16px;
  color: var(--ink-soft);
  text-align: center;
  padding: 32px 0;
  margin: 0;
}

/* ── Search row ──────────────────────────────────────────────────── */
.search-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-row .input {
  flex: 1;
}

/* ── Selection header (Pick/Pairs tabs + game type) ───────────────── */
.selection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.game-type.inline {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Pick hint / count ───────────────────────────────────────────── */
.pick-hint,
.players-count {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 0;
}

/* ── Player card meta ────────────────────────────────────────────── */
.card-meta {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 2px 0 0;
}

.card-skill {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  /* Fallback tint; per-level colors below. */
  background: rgba(71, 85, 105, 0.12);
  color: var(--ink-soft);
}

.card-skill.beginner {
  background: rgba(71, 85, 105, 0.12);
  color: #475569;
}

.card-skill.intermediate {
  background: rgba(21, 101, 192, 0.14);
  color: #1565c0;
}

.card-skill.advance {
  background: rgba(15, 157, 138, 0.14);
  color: #0f9d8a;
}

.card-skill.elite {
  background: rgba(242, 163, 58, 0.18);
  color: #b26a00;
}

/* ── Action bar ──────────────────────────────────────────────────── */
.action-bar {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
}

/* Buttons share the row width equally and stay on one line, adapting
   when "Mark Present" is hidden. */
.action-bar .button {
  flex: 1 1 0;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-left: 8px;
  padding-right: 8px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Keep the icon-only Remove button from stretching as wide as the text
   buttons; it just needs room for the trash glyph. */
.action-bar .button.danger {
  flex: 0 0 auto;
}

/* ── Add Player section ──────────────────────────────────────────── */
.add-player-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.players-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.players-header-hint {
  font-size: 13px;
  color: var(--ink-soft);
}

.players-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* ── Add from group ──────────────────────────────────────────────── */
.group-member-picker {
  max-height: 46vh;
  overflow-y: auto;
  margin-bottom: 14px;
}

.group-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
}

.group-picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 2px;
  border-top: 1px solid var(--border);
  cursor: pointer;
}

.group-picker-row input {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.group-picker-name {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-picker-tag {
  font-size: 13px;
  color: var(--ink-soft);
  flex-shrink: 0;
}

/* ── Tab content areas (Queue / History) ─────────────────────────── */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Queue header ────────────────────────────────────────────────── */
.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.queue-header h2 {
  margin-bottom: 2px;
}

/* ── Queue card edit button ──────────────────────────────────────── */
.queue-card-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.queue-edit-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1.5px solid var(--border);
  background: white;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.queue-edit-btn svg {
  width: 14px;
  height: 14px;
  fill: var(--ink-soft);
  transition: fill 0.15s;
}
.queue-edit-btn:hover { border-color: var(--accent); }
.queue-edit-btn:hover svg { fill: var(--accent); }

/* ── Edit Pairing modal ──────────────────────────────────────────── */
.edit-pairing-idle {
  display: grid;
  gap: 8px;
}

.edit-pairing-idle-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.edit-pairing-idle-hint {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

.idle-player-list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: #fff;
}

.idle-player-row {
  display: block;
  width: 100%;
  padding: 9px 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-soft);
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: default;
  transition: background 0.12s, color 0.12s;
}

.idle-player-row:last-child {
  border-bottom: none;
}

.idle-player-row.can-replace {
  color: var(--ink);
  cursor: pointer;
}

.idle-player-row.can-replace:hover {
  background: rgba(15, 157, 138, 0.1);
  color: var(--accent);
}

.edit-pairing-actions {
  justify-content: space-between;
}

.edit-pairing-right-actions {
  display: flex;
  gap: 8px;
}
</style>
