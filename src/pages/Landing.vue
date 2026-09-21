<template>
  <div class="landing-container">
    <!-- Ambient Background Lighting -->
    <div class="glow-orb orb-1" aria-hidden="true"></div>
    <div class="glow-orb orb-2" aria-hidden="true"></div>
    <div class="glow-orb orb-3" aria-hidden="true"></div>
    <div class="grid-overlay" aria-hidden="true"></div>

    <!-- Navigation Header -->
    <header class="landing-nav" :class="{ 'nav-scrolled': isScrolled }">
      <div class="nav-inner">
        <router-link to="/" class="brand-link">
          <img src="../assets/KuePro.png" alt="KuePro" class="brand-img" />
          <span class="brand-pill desktop-only">v1.1 Live</span>
        </router-link>

        <nav class="nav-links desktop-only">
          <a href="#features" class="nav-link">Features</a>
          <a href="#simulator" class="nav-link">Live Simulator</a>
          <a href="#calculator" class="nav-link">Efficiency ROI</a>
          <a href="#tournament" class="nav-link">Tournaments</a>
          <a href="#mobile" class="nav-link">Mobile App</a>
          <a href="#faq" class="nav-link">FAQ</a>
        </nav>

        <div class="nav-actions">
          <button
            class="theme-toggle-btn"
            type="button"
            @click="toggleTheme"
            :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <span v-if="isDark" class="theme-icon">☀️</span>
            <span v-else class="theme-icon">🌙</span>
          </button>

          <template v-if="authed">
            <router-link to="/" class="btn-primary-sm">
              <span>Dashboard</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </router-link>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-ghost-sm desktop-only">Sign In</router-link>
            <router-link to="/register" class="btn-primary-sm">
              <span>Start Free</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </router-link>
          </template>

          <button class="mobile-menu-toggle mobile-only" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle navigation">
            <svg v-if="!mobileMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div v-if="mobileMenuOpen" class="mobile-nav-drawer">
        <div class="mobile-theme-row">
          <span class="mobile-theme-label">Theme</span>
          <div class="mobile-theme-toggle">
            <button
              class="mob-theme-pill"
              :class="{ active: !isDark }"
              @click="setTheme('light')"
            >☀️ Light</button>
            <button
              class="mob-theme-pill"
              :class="{ active: isDark }"
              @click="setTheme('dark')"
            >🌙 Dark</button>
          </div>
        </div>
        <a href="#features" class="mob-link" @click="mobileMenuOpen = false">Features</a>
        <a href="#simulator" class="mob-link" @click="mobileMenuOpen = false">Live Simulator</a>
        <a href="#calculator" class="mob-link" @click="mobileMenuOpen = false">Efficiency ROI</a>
        <a href="#tournament" class="mob-link" @click="mobileMenuOpen = false">Tournaments</a>
        <a href="#mobile" class="mob-link" @click="mobileMenuOpen = false">Mobile App</a>
        <a href="#faq" class="mob-link" @click="mobileMenuOpen = false">FAQ</a>
        <div class="mob-actions">
          <template v-if="authed">
            <router-link to="/" class="btn-primary-block">Go to Dashboard</router-link>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-secondary-block">Sign In</router-link>
            <router-link to="/register" class="btn-primary-block">Create Free Account</router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-sparkle">✦</span>
          <span>Next-Gen Court &amp; Queue Management</span>
          <span class="badge-dot desktop-badge"></span>
          <span class="badge-accent desktop-badge">Badminton · Pickleball · Tennis</span>
        </div>

        <h1 class="hero-title">
          Ditch the whiteboard.<br />
          <span class="text-gradient">Run packed courts</span> with zero chaos.
        </h1>

        <p class="hero-subtitle">
          The all-in-one operating system for sports club organizers. Automate fair rotations, beam live TV scoreboards, let players check in via QR, and collect court fees effortlessly.
        </p>

        <div class="hero-cta-group">
          <router-link :to="authed ? '/' : '/register'" class="hero-btn-primary">
            <span>{{ authed ? 'Open My Dashboard' : 'Launch Session Free' }}</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </router-link>

          <a href="#simulator" class="hero-btn-secondary">
            <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Interactive Court Demo</span>
          </a>
        </div>

        <div class="hero-stats-bar">
          <div class="stat-item">
            <div class="stat-value">50k+</div>
            <div class="stat-label">Matches Queued</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">35%</div>
            <div class="stat-label">Faster Turnaround</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">99.8%</div>
            <div class="stat-label">Fairness Score</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">0 min</div>
            <div class="stat-label">Payment Hassle</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Live Simulator Showcase -->
    <section id="simulator" class="simulator-section">
      <div class="section-container">
        <div class="section-header center">
          <div class="section-tag">Interactive Preview</div>
          <h2 class="section-title">See Kue in action before signing up</h2>
          <p class="section-description">
            Experience the real-time queue rotation, live court timers, and gym display mode. Click below to simulate court changes!
          </p>
        </div>

        <div class="simulator-card">
          <!-- Simulator Header & Switcher Tabs -->
          <div class="sim-nav">
            <div class="sim-tabs">
              <button
                class="sim-tab"
                :class="{ active: activeSimTab === 'courts' }"
                @click="activeSimTab = 'courts'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span>Live Courts Floor</span>
              </button>

              <button
                class="sim-tab"
                :class="{ active: activeSimTab === 'queue' }"
                @click="activeSimTab = 'queue'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Smart Auto-Queue</span>
              </button>

              <button
                class="sim-tab"
                :class="{ active: activeSimTab === 'kiosk' }"
                @click="activeSimTab = 'kiosk'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 4 19 4 19 20 5 20 5 4"></polygon>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="9" y1="12" x2="15" y2="12"></line>
                </svg>
                <span>Gym TV Board Mode</span>
              </button>

              <button
                class="sim-tab"
                :class="{ active: activeSimTab === 'bracket' }"
                @click="activeSimTab = 'bracket'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 3v12h4m-4-6h12m-4-6v12h4m-4-6h6"></path>
                </svg>
                <span>Tournament Bracket</span>
              </button>
            </div>

            <div class="sim-meta-actions">
              <button class="sim-action-btn" @click="triggerRotation">
                <span class="pulse-dot"></span>
                <span>Simulate Next Rotation</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Tab Content 1: Live Courts -->
          <div v-if="activeSimTab === 'courts'" class="sim-panel courts-panel">
            <div class="sim-status-banner">
              <div class="banner-left">
                <span class="live-indicator">LIVE</span>
                <span class="banner-session-title">Friday Badminton Social · Court 1-3</span>
                <span class="banner-pill">3 Active Courts</span>
                <span class="banner-pill highlight">{{ simQueue.length }} Players Waiting</span>
              </div>
              <div class="banner-right">
                <span class="clock-display">⏱ 19:42:08</span>
              </div>
            </div>

            <div class="sim-courts-grid">
              <!-- Court 1 -->
              <div class="sim-court-card active-court">
                <div class="court-card-head">
                  <div class="court-title-wrap">
                    <span class="court-number">Court 1</span>
                    <span class="game-badge doubles">Doubles</span>
                  </div>
                  <div class="court-timer-active">
                    <span class="timer-dot"></span>
                    <span>{{ court1Timer }}</span>
                  </div>
                </div>

                <div class="court-matchup">
                  <div class="match-team team-a">
                    <div class="team-label">Team A</div>
                    <div class="player-chips">
                      <span class="player-chip">{{ court1Players[0] }}</span>
                      <span class="player-chip">{{ court1Players[1] }}</span>
                    </div>
                  </div>
                  <div class="vs-divider">
                    <span class="vs-text">VS</span>
                    <span class="vs-score">{{ court1Score }}</span>
                  </div>
                  <div class="match-team team-b">
                    <div class="team-label">Team B</div>
                    <div class="player-chips">
                      <span class="player-chip">{{ court1Players[2] }}</span>
                      <span class="player-chip">{{ court1Players[3] }}</span>
                    </div>
                  </div>
                </div>

                <div class="court-footer">
                  <div class="on-deck">
                    <span class="on-deck-label">On Deck:</span>
                    <span class="on-deck-names">{{ simQueue[0] ? simQueue[0].name : "Queue Empty" }}</span>
                  </div>
                  <button class="court-rotate-btn" @click="rotateCourt1">End &amp; Rotate</button>
                </div>
              </div>

              <!-- Court 2 -->
              <div class="sim-court-card active-court">
                <div class="court-card-head">
                  <div class="court-title-wrap">
                    <span class="court-number">Court 2</span>
                    <span class="game-badge singles">Singles</span>
                  </div>
                  <div class="court-timer-active">
                    <span class="timer-dot"></span>
                    <span>11:15</span>
                  </div>
                </div>

                <div class="court-matchup">
                  <div class="match-team team-a">
                    <div class="team-label">Side A</div>
                    <div class="player-chips">
                      <span class="player-chip">Viktor Axelsen</span>
                    </div>
                  </div>
                  <div class="vs-divider">
                    <span class="vs-text">VS</span>
                    <span class="vs-score">19 - 17</span>
                  </div>
                  <div class="match-team team-b">
                    <div class="team-label">Side B</div>
                    <div class="player-chips">
                      <span class="player-chip">Lee Zii Jia</span>
                    </div>
                  </div>
                </div>

                <div class="court-footer">
                  <div class="on-deck">
                    <span class="on-deck-label">On Deck:</span>
                    <span class="on-deck-names">Chou T.C.</span>
                  </div>
                  <button class="court-rotate-btn" @click="triggerToast('Court 2 Match Completed! Winner recorded.')">End &amp; Rotate</button>
                </div>
              </div>

              <!-- Court 3 -->
              <div class="sim-court-card active-court">
                <div class="court-card-head">
                  <div class="court-title-wrap">
                    <span class="court-number">Court 3</span>
                    <span class="game-badge doubles">Doubles</span>
                  </div>
                  <div class="court-timer-active">
                    <span class="timer-dot"></span>
                    <span>06:40</span>
                  </div>
                </div>

                <div class="court-matchup">
                  <div class="match-team team-a">
                    <div class="team-label">Team A</div>
                    <div class="player-chips">
                      <span class="player-chip">Marcus F.</span>
                      <span class="player-chip">Kevin S.</span>
                    </div>
                  </div>
                  <div class="vs-divider">
                    <span class="vs-text">VS</span>
                    <span class="vs-score">12 - 11</span>
                  </div>
                  <div class="match-team team-b">
                    <div class="team-label">Team B</div>
                    <div class="player-chips">
                      <span class="player-chip">Takuro H.</span>
                      <span class="player-chip">Yugo K.</span>
                    </div>
                  </div>
                </div>

                <div class="court-footer">
                  <div class="on-deck">
                    <span class="on-deck-label">On Deck:</span>
                    <span class="on-deck-names">Fajar / Rian</span>
                  </div>
                  <button class="court-rotate-btn" @click="triggerToast('Court 3 Rotated!')">End &amp; Rotate</button>
                </div>
              </div>
            </div>

            <!-- Interactive Toast Message -->
            <transition name="toast-fade">
              <div v-if="toastMessage" class="sim-toast">
                <span class="toast-icon">⚡</span>
                <span>{{ toastMessage }}</span>
              </div>
            </transition>
          </div>

          <!-- Tab Content 2: Smart Queue -->
          <div v-else-if="activeSimTab === 'queue'" class="sim-panel queue-panel">
            <div class="queue-toolbar">
              <div class="qt-left">
                <span class="qt-title">Active Queue Waiting Line</span>
                <span class="qt-count">{{ simQueue.length }} In Line</span>
              </div>
              <div class="qt-right">
                <label class="toggle-control">
                  <input type="checkbox" v-model="matchByLevel" />
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">Match by Skill Level (Fair Balance)</span>
                </label>
              </div>
            </div>

            <div class="queue-list-preview">
              <div
                v-for="(p, idx) in simQueue"
                :key="p.id"
                class="queue-item-card"
                :class="{ 'next-match': idx < 4 }"
              >
                <div class="q-pos">#{{ idx + 1 }}</div>
                <div class="q-avatar">{{ p.name.charAt(0) }}</div>
                <div class="q-info">
                  <div class="q-name-row">
                    <span class="q-name">{{ p.name }}</span>
                    <span v-if="p.isNew" class="q-badge new">New Joiner</span>
                    <span class="q-badge level" :class="p.level.toLowerCase()">Level {{ p.level }}</span>
                  </div>
                  <div class="q-sub">
                    <span>Games played: {{ p.gamesPlayed }}</span>
                    <span class="dot-sep">·</span>
                    <span>Waited: {{ p.waitMin }} min</span>
                  </div>
                </div>
                <div class="q-status">
                  <span v-if="idx < 4" class="status-pill next">Next Up (Court 1)</span>
                  <span v-else class="status-pill waiting">Resting</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Content 3: Gym TV Board -->
          <div v-else-if="activeSimTab === 'kiosk'" class="sim-panel kiosk-panel">
            <div class="kiosk-frame">
              <div class="kiosk-top">
                <div class="kiosk-logo">
                  <img src="../assets/KuePro.png" alt="KuePro" class="kiosk-brand-img" />
                  <span class="kiosk-live-badge">SPECTATOR KIOSK</span>
                </div>
                <div class="kiosk-qr-box">
                  <div class="qr-mock">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-5 0h2v3h-2v-3zm2 3h3v2h-3v-2zm3 3h3v2h-3v-2zm-5 0h2v2h-2v-2zm2-2h3v2h-3v-2z"/>
                    </svg>
                  </div>
                  <div class="qr-text">
                    <strong>Scan to Join</strong>
                    <span>kuepro.app/join/demo</span>
                  </div>
                </div>
              </div>

              <div class="kiosk-display-grid">
                <div class="kiosk-court">
                  <div class="kc-head">COURT 1 · DOUBLES</div>
                  <div class="kc-teams">
                    <div class="kc-t">Chou T.C. &amp; Jonatan C.</div>
                    <div class="kc-vs">VS (14 - 11)</div>
                    <div class="kc-t">Loh K.Y. &amp; Kunlavut V.</div>
                  </div>
                  <div class="kc-timer">Timer: 14:02</div>
                </div>

                <div class="kiosk-court">
                  <div class="kc-head">COURT 2 · SINGLES</div>
                  <div class="kc-teams">
                    <div class="kc-t">Viktor Axelsen</div>
                    <div class="kc-vs">VS (19 - 17)</div>
                    <div class="kc-t">Lee Zii Jia</div>
                  </div>
                  <div class="kc-timer">Timer: 11:15</div>
                </div>
              </div>

              <div class="kiosk-bottom-queue">
                <span class="kb-label">ON DECK NEXT:</span>
                <span class="kb-names">Marcus F. &amp; Kevin S. vs Hendra S. &amp; Mohammad A.</span>
              </div>
            </div>
          </div>

          <!-- Tab Content 4: Tournament Bracket -->
          <div v-else-if="activeSimTab === 'bracket'" class="sim-panel bracket-panel">
            <div class="bracket-tree-mock">
              <div class="bracket-col">
                <div class="round-title">Semi-Finals</div>
                <div class="bracket-match">
                  <div class="match-slot winner">
                    <span>Alpha Smashers</span>
                    <span class="slot-score">21</span>
                  </div>
                  <div class="match-slot">
                    <span>Court Kings</span>
                    <span class="slot-score">18</span>
                  </div>
                </div>
                <div class="bracket-match">
                  <div class="match-slot winner">
                    <span>Net Dominators</span>
                    <span class="slot-score">21</span>
                  </div>
                  <div class="match-slot">
                    <span>Feather Hawks</span>
                    <span class="slot-score">14</span>
                  </div>
                </div>
              </div>

              <div class="bracket-col">
                <div class="round-title">Grand Finals</div>
                <div class="bracket-match final-match">
                  <div class="match-slot winner">
                    <span>Alpha Smashers 🏆</span>
                    <span class="slot-score">22</span>
                  </div>
                  <div class="match-slot">
                    <span>Net Dominators</span>
                    <span class="slot-score">20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem vs Solution Section -->
    <section class="comparison-section">
      <div class="section-container">
        <div class="section-header center">
          <div class="section-tag danger">The Old Reality vs Kue</div>
          <h2 class="section-title">Why club sessions break down without Kue</h2>
          <p class="section-description">
            Paper sheets, whiteboard marker erasures, shouting across noisy halls, and missing entry fees cost hours every week.
          </p>
        </div>

        <div class="comparison-grid">
          <!-- The Old Way -->
          <div class="comparison-card old-way">
            <div class="comp-header">
              <div class="comp-badge old">The Old Whiteboard Way</div>
              <h3 class="comp-title">Chaos, disputes, and wasted court time</h3>
            </div>
            <ul class="comp-list">
              <li>
                <span class="icon-cross">✕</span>
                <div>
                  <strong>Arguments over wait times:</strong>
                  <p>Players constantly question who is up next and feel rotations are unfair or biased.</p>
                </div>
              </li>
              <li>
                <span class="icon-cross">✕</span>
                <div>
                  <strong>Yelling across noisy gymnasiums:</strong>
                  <p>Organizers lose their voices trying to find missing players sitting outside.</p>
                </div>
              </li>
              <li>
                <span class="icon-cross">✕</span>
                <div>
                  <strong>Chasing lost cash &amp; transfer receipts:</strong>
                  <p>Manually tracking who paid entry fees via chat screenshots or physical envelopes.</p>
                </div>
              </li>
              <li>
                <span class="icon-cross">✕</span>
                <div>
                  <strong>Messy tournament redraws:</strong>
                  <p>Scratching out brackets on paper when someone withdraws or courts open up early.</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- The Kue Way -->
          <div class="comparison-card kue-way">
            <div class="comp-header">
              <div class="comp-badge new">The Kue Pro Experience</div>
              <h3 class="comp-title">Algorithmic fairness, automated flow</h3>
            </div>
            <ul class="comp-list">
              <li>
                <span class="icon-check">✓</span>
                <div>
                  <strong>Algorithmic wait-time &amp; skill matching:</strong>
                  <p>Ensures every player gets fair court time, balanced matchups, and proper rest intervals.</p>
                </div>
              </li>
              <li>
                <span class="icon-check">✓</span>
                <div>
                  <strong>Live Gym TV &amp; Mobile On-Deck alerts:</strong>
                  <p>Project the queue on TV monitors or let players check their turn right on their phones.</p>
                </div>
              </li>
              <li>
                <span class="icon-check">✓</span>
                <div>
                  <strong>Integrated Session Fee Ledger:</strong>
                  <p>Track cash, payment deadlines, and mark paid in one tap with public fee transparency.</p>
                </div>
              </li>
              <li>
                <span class="icon-check">✓</span>
                <div>
                  <strong>Dynamic Digital Brackets:</strong>
                  <p>Single-elimination, double-elimination, and round-robin with instant score tracking.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Core Features Bento Grid -->
    <section id="features" class="features-section">
      <div class="section-container">
        <div class="section-header center">
          <div class="section-tag">Powerful Architecture</div>
          <h2 class="section-title">Engineered specifically for racket sports clubs</h2>
          <p class="section-description">
            Everything you need to host social nights, open plays, multi-court league sessions, and tournaments without administrative headaches.
          </p>
        </div>

        <div class="bento-grid">
          <!-- Bento 1: Smart Matchmaking -->
          <div class="bento-card bento-wide">
            <div class="bento-content">
              <div class="bento-icon-box emerald">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 class="bento-title">Smart Algorithmic Matchmaking</h3>
              <p class="bento-text">
                Kue balances wait times and skill levels. In Doubles mode, pair 4 players with drag-and-drop ease or let Auto-Q balance teams to prevent blowouts.
              </p>
              <div class="bento-pill-group">
                <span class="pill">Skill Rating Matching</span>
                <span class="pill">Anti-Fatigue Rest Timers</span>
                <span class="pill">Singles &amp; Doubles</span>
              </div>
            </div>
            <div class="bento-visual matchmaking-visual">
              <div class="match-pill-sim">
                <span class="player-tag">Marcus (Adv)</span>
                <span class="plus">+</span>
                <span class="player-tag">Ken (Adv)</span>
                <span class="vs">VS</span>
                <span class="player-tag">Darren (Adv)</span>
                <span class="plus">+</span>
                <span class="player-tag">Rian (Adv)</span>
              </div>
            </div>
          </div>

          <!-- Bento 2: TV Spectator Board -->
          <div class="bento-card">
            <div class="bento-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3 class="bento-title">Gym Projector &amp; TV Mode</h3>
            <p class="bento-text">
              Hook up an HDMI cable or open the browser on any Smart TV. Live courts, elapsed match timers, and on-deck queues display in full 1080p kiosk glory.
            </p>
            <div class="bento-link">
              <span>Optimized for projectors &amp; displays →</span>
            </div>
          </div>

          <!-- Bento 3: QR Player Check-In -->
          <div class="bento-card">
            <div class="bento-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <h3 class="bento-title">Instant QR Check-In</h3>
            <p class="bento-text">
              Players don't even need to download an app or create a password. They scan your session QR code to sign in and monitor their position live.
            </p>
            <div class="bento-link">
              <span>Zero-friction player onboarding →</span>
            </div>
          </div>

          <!-- Bento 4: Tournament Brackets -->
          <div id="tournament" class="bento-card">
            <div class="bento-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h3 class="bento-title">Full Tournament Brackets</h3>
            <p class="bento-text">
              Seamlessly toggle your session into Tournament mode. Run Single Elimination, Double Elimination, or Round Robin brackets with real-time scoring.
            </p>
            <div class="bento-link">
              <span>Export brackets &amp; seed rankings →</span>
            </div>
          </div>

          <!-- Bento 5: Fee Tracking -->
          <div class="bento-card bento-wide">
            <div class="bento-content">
              <div class="bento-icon-box emerald">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <h3 class="bento-title">Integrated Session Fee Tracking</h3>
              <p class="bento-text">
                Set session fees, enforce payment deadlines, and mark cash or bank payments with one tap. Public fee boards eliminate awkward payment chase-ups.
              </p>
              <div class="bento-pill-group">
                <span class="pill">Payment Deadlines</span>
                <span class="pill">Public Fee Verification</span>
                <span class="pill">Cash &amp; Digital Log</span>
              </div>
            </div>
            <div class="bento-visual fee-visual">
              <div class="fee-card-mock">
                <div class="fc-row">
                  <span>Entry Fee:</span>
                  <span class="fc-val">$12 / player</span>
                </div>
                <div class="fc-row">
                  <span>Paid:</span>
                  <span class="fc-val success">28 of 30 collected</span>
                </div>
                <div class="fc-bar">
                  <div class="fc-bar-fill" style="width: 93%;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bento 6: Multi-Court & Collaborators -->
          <div class="bento-card">
            <div class="bento-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 class="bento-title">Assistant Co-Hosting</h3>
            <p class="bento-text">
              Invite assistants to help call matches and manage courts. Co-hosts share your session in real time without seeing your sensitive billing settings.
            </p>
            <div class="bento-link">
              <span>Multi-tenant workspace support →</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive ROI & Efficiency Calculator -->
    <section id="calculator" class="calculator-section">
      <div class="section-container">
        <div class="calc-card">
          <div class="calc-header">
            <div class="section-tag emerald">Session Efficiency Calculator</div>
            <h2 class="calc-title">How much time and revenue will your club save?</h2>
            <p class="calc-desc">
              Slide to match your typical club session size and see how automated queueing enhances court turnaround.
            </p>
          </div>

          <div class="calc-body">
            <div class="sliders-wrap">
              <!-- Slider 1: Courts -->
              <div class="slider-group">
                <div class="slider-label-row">
                  <span class="sl-title">Active Courts</span>
                  <span class="sl-value">{{ calcCourts }} Courts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  v-model.number="calcCourts"
                  class="calc-slider"
                />
                <div class="slider-minmax">
                  <span>1 Court</span>
                  <span>12 Courts</span>
                </div>
              </div>

              <!-- Slider 2: Players -->
              <div class="slider-group">
                <div class="slider-label-row">
                  <span class="sl-title">Players Per Session</span>
                  <span class="sl-value">{{ calcPlayers }} Players</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="80"
                  step="2"
                  v-model.number="calcPlayers"
                  class="calc-slider"
                />
                <div class="slider-minmax">
                  <span>6 Players</span>
                  <span>80 Players</span>
                </div>
              </div>

              <!-- Slider 3: Fee -->
              <div class="slider-group">
                <div class="slider-label-row">
                  <span class="sl-title">Average Fee Per Player</span>
                  <span class="sl-value">${{ calcFee }}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  v-model.number="calcFee"
                  class="calc-slider"
                />
                <div class="slider-minmax">
                  <span>$5</span>
                  <span>$50</span>
                </div>
              </div>
            </div>

            <div class="calc-results-card">
              <div class="res-title">Estimated Monthly Impact</div>

              <div class="res-stat-row">
                <div class="res-metric">
                  <span class="res-num">+{{ extraGamesMonthly }}</span>
                  <span class="res-label">Extra Games Played / Mo</span>
                </div>
                <div class="res-info">
                  Faster 45-second court rotations instead of 4-minute clipboard lulls.
                </div>
              </div>

              <div class="res-stat-row">
                <div class="res-metric">
                  <span class="res-num">{{ hoursSavedMonthly }} hrs</span>
                  <span class="res-label">Admin Time Saved</span>
                </div>
                <div class="res-info">
                  Zero manual roster tallying, no shouting names, no bracket math.
                </div>
              </div>

              <div class="res-stat-row">
                <div class="res-metric">
                  <span class="res-num text-emerald">${{ feeRecoveredMonthly }}</span>
                  <span class="res-label">Unpaid Fees Prevented</span>
                </div>
                <div class="res-info">
                  100% transparent fee tracking eliminates forgotten dues.
                </div>
              </div>

              <router-link to="/register" class="calc-cta-btn">
                <span>Start Free in 60 Seconds</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mobile App Showcase (Android + PWA) -->
    <section id="mobile" class="mobile-section">
      <div class="section-container">
        <div class="mobile-grid">
          <div class="mobile-text-col">
            <div class="section-tag blue">True Cross-Platform</div>
            <h2 class="section-title">Pocket queue control on your phone or tablet</h2>
            <p class="section-description">
              Whether you are walking between courts with your smartphone or managing from a courtside iPad, Kue is optimized for high-speed touch input and one-handed operation.
            </p>

            <div class="mobile-highlights">
              <div class="mh-item">
                <div class="mh-icon">📱</div>
                <div>
                  <strong>Native Android App</strong>
                  <p>Fast native APK built with Capacitor. Smooth transitions, offline resilience, and native responsiveness.</p>
                </div>
              </div>

              <div class="mh-item">
                <div class="mh-icon">⚡</div>
                <div>
                  <strong>No App Store Barrier for Players</strong>
                  <p>Club members scan your QR code and access live queues instantly in Chrome or Safari without installing anything.</p>
                </div>
              </div>

              <div class="mh-item">
                <div class="mh-icon">📺</div>
                <div>
                  <strong>HDMI &amp; Cast to Gym TV</strong>
                  <p>One-click full screen kiosk view transforms any monitor or projector into a professional sports arena scoreboard.</p>
                </div>
              </div>
            </div>

            <div class="mobile-badges">
              <router-link to="/register" class="app-cta">
                <span>Launch on Web or Mobile</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </router-link>
            </div>
          </div>

          <div class="mobile-mockup-col">
            <div class="phone-frame">
              <div class="phone-notch"></div>
              <div class="phone-screen">
                <div class="ps-header">
                  <span class="ps-time">19:45</span>
                  <span class="ps-battery">98% ⚡</span>
                </div>
                <div class="ps-brand">
                  <img src="../assets/KuePro.png" alt="Kue" class="ps-logo" />
                  <span class="ps-status-dot"></span>
                </div>
                <div class="ps-card">
                  <div class="psc-title">Court 1 · In Progress</div>
                  <div class="psc-players">Marcus &amp; Kevin vs Ahsan &amp; Hendra</div>
                  <div class="psc-timer">⏱ 14:12</div>
                </div>
                <div class="ps-card">
                  <div class="psc-title">Your Status (Public Link)</div>
                  <div class="psc-queue">You are #2 in line · On Deck</div>
                  <div class="psc-alert">Warm up! Next match starting shortly.</div>
                </div>
                <div class="ps-nav-bar">
                  <span>Courts</span>
                  <span>Queue</span>
                  <span>Fees</span>
                  <span>Rankings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials / Community Quotes -->
    <section class="testimonials-section">
      <div class="section-container">
        <div class="section-header center">
          <div class="section-tag purple">Trusted by Clubs</div>
          <h2 class="section-title">Loved by queue masters &amp; players alike</h2>
        </div>

        <div class="testimonials-grid">
          <div class="testimonial-card">
            <div class="test-stars">★★★★★</div>
            <p class="test-quote">
              "We used to waste 30 minutes every Sunday night just arguing over who had played more games. Kue's fairness algorithm eliminated all the drama on day one."
            </p>
            <div class="test-author">
              <div class="author-avatar">AL</div>
              <div class="author-meta">
                <div class="author-name">Alexandre Lim</div>
                <div class="author-role">Club President, Metro Badminton Club</div>
              </div>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="test-stars">★★★★★</div>
            <p class="test-quote">
              "Projecting the live board onto our sports hall projector blew everyone away. Players just look at the screen to see their court and opponent. Incredible app."
            </p>
            <div class="test-author">
              <div class="author-avatar">ST</div>
              <div class="author-meta">
                <div class="author-name">Sarah Tanaka</div>
                <div class="author-role">Head Organizer, Weekend Pickleball Social</div>
              </div>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="test-stars">★★★★★</div>
            <p class="test-quote">
              "Fee tracking alone saved our club hundreds of dollars. Everyone can see the public fee status, so people pay their dues before stepping onto the court."
            </p>
            <div class="test-author">
              <div class="author-avatar">MR</div>
              <div class="author-meta">
                <div class="author-name">Marcus Rodriguez</div>
                <div class="author-role">Tournament Director, Apex Racket League</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion -->
    <section id="faq" class="faq-section">
      <div class="section-container">
        <div class="section-header center">
          <div class="section-tag">Got Questions?</div>
          <h2 class="section-title">Frequently Asked Questions</h2>
          <p class="section-description">
            Everything you need to know about setting up Kue for your next club session.
          </p>
        </div>

        <div class="faq-list">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="faq-item"
            :class="{ open: openFaqIndex === idx }"
          >
            <button class="faq-question" @click="toggleFaq(idx)">
              <span>{{ faq.question }}</span>
              <span class="faq-icon" aria-hidden="true">{{ openFaqIndex === idx ? '−' : '+' }}</span>
            </button>
            <div v-if="openFaqIndex === idx" class="faq-answer">
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- High-Impact Closing CTA -->
    <section class="final-cta-section">
      <div class="section-container">
        <div class="cta-banner">
          <div class="cta-inner">
            <h2 class="cta-title">Ready to run your cleanest club session tonight?</h2>
            <p class="cta-desc">
              Create your first session in under 60 seconds. Unlimited players, real-time queues, and live spectator boards are ready for you.
            </p>
            <div class="cta-actions">
              <router-link :to="authed ? '/' : '/register'" class="cta-btn-white">
                <span>{{ authed ? 'Go to Your Dashboard' : 'Get Started Free' }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </router-link>
              <router-link to="/login" class="cta-btn-outline">
                <span>Sign In to Existing Account</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="section-container">
        <div class="footer-top">
          <div class="footer-brand-col">
            <div class="footer-logo">
              <img src="../assets/KuePro.png" alt="KuePro" class="footer-img" />
              <span class="footer-pill">v1.1</span>
            </div>
            <p class="footer-motto">
              The modern operating system for badminton, pickleball, and racket sports sessions.
            </p>
          </div>

          <div class="footer-links-grid">
            <div class="footer-group">
              <div class="fg-title">Product</div>
              <a href="#features">Features</a>
              <a href="#simulator">Live Simulator</a>
              <a href="#calculator">ROI Calculator</a>
              <a href="#tournament">Tournament Brackets</a>
            </div>

            <div class="footer-group">
              <div class="fg-title">Quick Access</div>
              <router-link to="/login">Sign In</router-link>
              <router-link to="/register">Create Account</router-link>
              <router-link to="/rankings">Public Rankings</router-link>
            </div>

            <div class="footer-group">
              <div class="fg-title">Community</div>
              <a href="#faq">FAQ</a>
              <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
              <a href="#mobile">Android Mobile</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div>&copy; {{ new Date().getFullYear() }} KuePro. All rights reserved. Crafted for court enthusiasts.</div>
          <div class="footer-bottom-links">
            <span>Production Ready</span>
            <span class="dot-sep">·</span>
            <span>Fast &amp; Mobile First</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { resolvedTheme, setTheme } from "../state/themeStore.js";

// Theme state
const isDark = computed(() => resolvedTheme.value === "dark");

function toggleTheme() {
  setTheme(isDark.value ? "light" : "dark");
}

// Auth state check
const authed = computed(() => Boolean(localStorage.getItem("token")));

// Navigation scroll detection
const isScrolled = ref(false);
const mobileMenuOpen = ref(false);

function handleScroll() {
  isScrolled.value = window.scrollY > 30;
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

// Simulator tab control
const activeSimTab = ref("courts");
const matchByLevel = ref(true);
const toastMessage = ref("");
let toastTimeout = null;

function triggerToast(msg) {
  toastMessage.value = msg;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMessage.value = "";
  }, 3200);
}

// Interactive court state
const court1Timer = ref("14:28");
const court1Score = ref("18 - 16");
const court1Players = ref(["Hendra Setiawan", "Mohammad Ahsan", "Aaron Chia", "Soh Wooi Yik"]);

const simQueue = ref([
  { id: 1, name: "Marcus Fernaldi", level: "A", gamesPlayed: 2, waitMin: 14, isNew: false },
  { id: 2, name: "Kevin Sukamuljo", level: "A", gamesPlayed: 2, waitMin: 14, isNew: false },
  { id: 3, name: "Takuro Hoki", level: "A", gamesPlayed: 3, waitMin: 11, isNew: false },
  { id: 4, name: "Yugo Kobayashi", level: "A", gamesPlayed: 3, waitMin: 11, isNew: false },
  { id: 5, name: "Praveen Jordan", level: "B", gamesPlayed: 1, waitMin: 9, isNew: false },
  { id: 6, name: "Melati Daeva", level: "B", gamesPlayed: 1, waitMin: 9, isNew: false },
  { id: 7, name: "Daniel Marthin", level: "A", gamesPlayed: 0, waitMin: 6, isNew: true },
  { id: 8, name: "Leo Carnando", level: "A", gamesPlayed: 0, waitMin: 6, isNew: true },
]);

function rotateCourt1() {
  if (simQueue.value.length < 4) {
    triggerToast("Queue needs at least 4 players to rotate doubles!");
    return;
  }
  // Remove the first 4 waiting players and place them on Court 1
  const nextFour = simQueue.value.splice(0, 4);
  const oldPlayers = [...court1Players.value];
  court1Players.value = nextFour.map(p => p.name);
  court1Score.value = "0 - 0";
  court1Timer.value = "00:01";

  // Push old players to back of queue with incremented games
  oldPlayers.forEach((name, i) => {
    simQueue.value.push({
      id: Date.now() + i,
      name,
      level: "A",
      gamesPlayed: 3,
      waitMin: 1,
      isNew: false
    });
  });

  triggerToast(`🎉 Rotated Court 1! ${nextFour[0].name} & ${nextFour[1].name} are now playing.`);
}

function triggerRotation() {
  rotateCourt1();
}

// Calculator state
const calcCourts = ref(4);
const calcPlayers = ref(24);
const calcFee = ref(12);

const extraGamesMonthly = computed(() => {
  // approx 4 extra games per session * 8 sessions per month
  return Math.round(calcCourts.value * 2.8 * 8);
});

const hoursSavedMonthly = computed(() => {
  // approx 1.5 hours saved per session * 8 sessions
  const perSession = 0.4 * calcCourts.value + (calcPlayers.value > 20 ? 0.8 : 0.4);
  return Math.round(perSession * 8);
});

const feeRecoveredMonthly = computed(() => {
  // on average 8-12% fee leakage in manual paper sessions
  const totalDuesMonthly = calcPlayers.value * calcFee.value * 8;
  return Math.round(totalDuesMonthly * 0.09);
});

// FAQ state
const openFaqIndex = ref(0);

const faqs = [
  {
    question: "Do players need to create an account or download an app to join?",
    answer: "No! Players simply scan the session QR code or click your unique share link (/join/:token). They can check in, see their live queue position, and monitor active court scores right inside their phone browser without passwords."
  },
  {
    question: "Can I balance matches by player skill levels?",
    answer: "Yes! Kue offers a 'Match by Level' toggle. When enabled, Auto-Q pairs players of similar skill (e.g. Beginner, Intermediate, Advanced) to keep games competitive. If you want pure social rotation based on longest wait time, simply toggle it off."
  },
  {
    question: "How does the TV / Projector Kiosk display work?",
    answer: "Every session generates a dedicated public board link (/board/:sessionId). Open it in Chrome on any Smart TV or computer connected to your gym projector. It automatically displays full-screen live court timers, on-deck player calls, and a large join QR code."
  },
  {
    question: "Can I collect and track session fees through Kue?",
    answer: "Absolutely. You can set a fee amount (e.g. $10 or 150 PHP) and even enforce a payment deadline. Kue keeps a transparent ledger of who has paid cash or digital transfer, and shows public fee status so everyone stays accountable."
  },
  {
    question: "Can multiple organizers manage the same session simultaneously?",
    answer: "Yes! Kue features a built-in Collaborator & Assistant system. You can invite co-hosts to your workspace via email. They can update court scores, rotate players, and call matches in real time alongside you from their own devices."
  },
  {
    question: "Is there an Android app available?",
    answer: "Yes! Kue is built mobile-first with Capacitor, allowing you to run it directly as a native Android APK on your phone, or install it as a progressive web app on iOS and desktop browsers."
  }
];

function toggleFaq(idx) {
  openFaqIndex.value = openFaqIndex.value === idx ? -1 : idx;
}
</script>

<style scoped>
/* ── Reset & Theme Variables ── */
.landing-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background-color: #070a12;
  color: #f1f5f9;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
  line-height: 1.6;
}

/* ── Ambient Background Lighting ── */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
}
.orb-1 {
  width: 500px;
  height: 500px;
  top: -100px;
  left: 15%;
  background: radial-gradient(circle, #10b981 0%, rgba(16, 185, 129, 0) 70%);
}
.orb-2 {
  width: 600px;
  height: 600px;
  top: 150px;
  right: 5%;
  background: radial-gradient(circle, #2563eb 0%, rgba(37, 99, 235, 0) 70%);
}
.orb-3 {
  width: 700px;
  height: 700px;
  top: 1100px;
  left: 20%;
  background: radial-gradient(circle, #6366f1 0%, rgba(99, 102, 241, 0) 70%);
}
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
  mask-image: linear-gradient(to bottom, black 20%, transparent 95%);
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* ── Navigation Header ── */
.landing-nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  transition: all 0.3s ease;
  padding: 16px 0;
}
.landing-nav.nav-scrolled {
  background: rgba(11, 15, 26, 0.85);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.brand-img {
  height: 48px;
  width: auto;
  object-fit: contain;
}
.brand-pill {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.35);
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}
.nav-link {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}
.nav-link:hover {
  color: #ffffff;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.btn-ghost-sm {
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}
.btn-ghost-sm:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
}
.btn-primary-sm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 10px;
  color: #ffffff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.btn-primary-sm:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}
.arrow-icon {
  width: 15px;
  height: 15px;
  transition: transform 0.2s;
}
.btn-primary-sm:hover .arrow-icon {
  transform: translateX(2px);
}

.mobile-menu-toggle {
  background: transparent;
  border: none;
  color: #f1f5f9;
  cursor: pointer;
  padding: 6px;
}
.mobile-menu-toggle svg {
  width: 24px;
  height: 24px;
}
.mobile-nav-drawer {
  background: #0f172a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.mob-link {
  color: #cbd5e1;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
}
.mob-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
.btn-primary-block {
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  background: #10b981;
  color: #ffffff;
  font-weight: 600;
  text-decoration: none;
}
.btn-secondary-block {
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-weight: 600;
  text-decoration: none;
}

/* ── Hero Section ── */
.hero-section {
  position: relative;
  z-index: 1;
  padding: 80px 24px 70px;
  text-align: center;
  max-width: 1080px;
  margin: 0 auto;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e1;
  margin-bottom: 28px;
  backdrop-filter: blur(10px);
  white-space: nowrap;
  max-width: 100%;
}
.badge-sparkle {
  color: #10b981;
}
.badge-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #64748b;
}
.badge-accent {
  color: #38bdf8;
  font-weight: 600;
}
.hero-title {
  font-size: clamp(38px, 6vw, 68px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin-bottom: 24px;
}
.text-gradient {
  background: linear-gradient(135deg, #10b981 0%, #38bdf8 50%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-subtitle {
  font-size: clamp(16px, 2.2vw, 20px);
  line-height: 1.6;
  color: #94a3b8;
  max-width: 780px;
  margin: 0 auto 36px;
}
.hero-cta-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 50px;
}
.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  padding: 14px 32px;
  border-radius: 12px;
  color: #ffffff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  text-decoration: none;
  box-shadow: 0 10px 28px rgba(16, 185, 129, 0.4);
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.hero-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px rgba(16, 185, 129, 0.55);
}
.btn-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s;
}
.hero-btn-primary:hover .btn-icon {
  transform: translateX(3px);
}
.hero-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  padding: 14px 28px;
  border-radius: 12px;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}
.hero-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}
.play-icon {
  width: 14px;
  height: 14px;
  color: #38bdf8;
}

.hero-stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
  padding: 24px 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}
.stat-item {
  text-align: center;
}
.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
}
.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}
.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
}

/* ── Section Headers Common ── */
.section-header {
  margin-bottom: 48px;
}
.section-header.center {
  text-align: center;
}
.section-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  margin-bottom: 12px;
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.section-tag.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}
.section-tag.blue {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.3);
}
.section-tag.purple {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border-color: rgba(168, 85, 247, 0.3);
}
.section-tag.emerald {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}
.section-title {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin-bottom: 14px;
}
.section-description {
  font-size: 16px;
  color: #94a3b8;
  max-width: 680px;
  margin: 0 auto;
}

/* ── Interactive Simulator Section ── */
.simulator-section {
  padding: 40px 0 90px;
}
.simulator-card {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  overflow: hidden;
}
.sim-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;
  gap: 12px;
}
.sim-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.sim-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.sim-tab svg {
  width: 16px;
  height: 16px;
}
.sim-tab:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}
.sim-tab.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
  color: #10b981;
}

.sim-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
  transition: all 0.2s;
}
.sim-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
}
.sim-action-btn svg {
  width: 14px;
  height: 14px;
}
.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  animation: pulse 1.8s infinite;
}
@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.4); }
  100% { opacity: 1; transform: scale(1); }
}

.sim-panel {
  padding: 24px;
  min-height: 420px;
  position: relative;
}
.sim-status-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.live-indicator {
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  animation: blink 2s infinite ease-in-out;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.banner-session-title {
  font-weight: 700;
  color: #ffffff;
  font-size: 14px;
}
.banner-pill {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}
.banner-pill.highlight {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}
.clock-display {
  font-family: monospace;
  font-size: 13px;
  color: #94a3b8;
}

/* Courts Grid */
.sim-courts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
}
.sim-court-card {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.25s;
}
.sim-court-card:hover {
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.court-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.court-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.court-number {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
}
.game-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 6px;
}
.game-badge.doubles {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}
.game-badge.singles {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}
.court-timer-active {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 13px;
  font-weight: 700;
  color: #10b981;
}
.timer-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 1.5s infinite;
}

.court-matchup {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  padding: 12px 14px;
}
.match-team {
  flex: 1;
}
.match-team.team-b {
  text-align: right;
}
.team-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.player-chips {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.player-chip {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vs-divider {
  padding: 0 12px;
  text-align: center;
}
.vs-text {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
}
.vs-score {
  font-family: monospace;
  font-size: 14px;
  font-weight: 800;
  color: #38bdf8;
}

.court-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.on-deck {
  font-size: 12px;
}
.on-deck-label {
  color: #64748b;
  margin-right: 4px;
}
.on-deck-names {
  color: #cbd5e1;
  font-weight: 600;
}
.court-rotate-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.court-rotate-btn:hover {
  background: #10b981;
  border-color: #10b981;
}

/* Toast Message */
.sim-toast {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  border: 1px solid #10b981;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  padding: 12px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  z-index: 10;
}
.toast-fade-enter-active, .toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

/* Queue Tab Styles */
.queue-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 12px;
}
.qt-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin-right: 10px;
}
.qt-count {
  font-size: 12px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.toggle-control {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.toggle-control input {
  display: none;
}
.toggle-slider {
  width: 36px;
  height: 20px;
  background: #334155;
  border-radius: 999px;
  position: relative;
  transition: background 0.2s;
}
.toggle-slider::before {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
}
.toggle-control input:checked + .toggle-slider {
  background: #10b981;
}
.toggle-control input:checked + .toggle-slider::before {
  transform: translateX(16px);
}
.toggle-label {
  font-size: 13px;
  color: #cbd5e1;
  font-weight: 500;
}

.queue-list-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.queue-item-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px 16px;
  border-radius: 12px;
}
.queue-item-card.next-match {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
}
.q-pos {
  font-size: 14px;
  font-weight: 800;
  color: #64748b;
  width: 24px;
}
.queue-item-card.next-match .q-pos {
  color: #10b981;
}
.q-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}
.q-info {
  flex: 1;
}
.q-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.q-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}
.q-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
}
.q-badge.new {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}
.q-badge.level.a {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}
.q-badge.level.b {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}
.q-sub {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot-sep {
  color: #475569;
}
.status-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}
.status-pill.next {
  background: #10b981;
  color: #ffffff;
}
.status-pill.waiting {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

/* Kiosk Tab Styles */
.kiosk-frame {
  background: #020617;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.kiosk-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 16px;
}
.kiosk-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.kiosk-brand-img {
  height: 32px;
}
.kiosk-live-badge {
  font-size: 11px;
  letter-spacing: 0.08em;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
}
.kiosk-qr-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 12px;
  border-radius: 8px;
}
.qr-mock svg {
  color: #ffffff;
}
.qr-text strong {
  display: block;
  font-size: 12px;
  color: #ffffff;
}
.qr-text span {
  font-size: 11px;
  color: #94a3b8;
}
.kiosk-display-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.kiosk-court {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.kc-head {
  font-size: 12px;
  font-weight: 800;
  color: #10b981;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.kc-teams {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kc-vs {
  font-size: 12px;
  color: #38bdf8;
  font-family: monospace;
}
.kc-timer {
  font-size: 12px;
  color: #64748b;
  margin-top: 10px;
  font-family: monospace;
}
.kiosk-bottom-queue {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 14px;
}
.kb-label {
  color: #10b981;
  font-weight: 800;
  margin-right: 8px;
}
.kb-names {
  color: #ffffff;
  font-weight: 600;
}

/* Bracket Tab Styles */
.bracket-tree-mock {
  display: flex;
  gap: 40px;
  justify-content: center;
  align-items: center;
  padding: 24px;
  overflow-x: auto;
}
.bracket-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 200px;
}
.round-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
  text-align: center;
}
.bracket-match {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
}
.final-match {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);
}
.match-slot {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.match-slot:last-child {
  border-bottom: none;
}
.match-slot.winner {
  color: #ffffff;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.03);
}
.slot-score {
  font-family: monospace;
  font-weight: 700;
}

/* ── Problem vs Solution ── */
.comparison-section {
  padding: 80px 0;
}
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 24px;
}
.comparison-card {
  padding: 36px 32px;
  border-radius: 20px;
  border: 1px solid;
}
.comparison-card.old-way {
  background: rgba(239, 68, 68, 0.03);
  border-color: rgba(239, 68, 68, 0.15);
}
.comparison-card.kue-way {
  background: rgba(16, 185, 129, 0.03);
  border-color: rgba(16, 185, 129, 0.25);
  box-shadow: 0 20px 40px rgba(16, 185, 129, 0.08);
}
.comp-header {
  margin-bottom: 28px;
}
.comp-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
}
.comp-badge.old {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}
.comp-badge.new {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}
.comp-title {
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.3;
}
.comp-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.comp-list li {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.icon-cross {
  color: #f87171;
  font-weight: 900;
  font-size: 16px;
  line-height: 1.4;
}
.icon-check {
  color: #10b981;
  font-weight: 900;
  font-size: 16px;
  line-height: 1.4;
}
.comp-list strong {
  display: block;
  font-size: 15px;
  color: #ffffff;
  margin-bottom: 4px;
}
.comp-list p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.5;
}

/* ── Bento Grid ── */
.features-section {
  padding: 80px 0;
}
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.bento-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  backdrop-filter: blur(12px);
  transition: all 0.25s;
}
.bento-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}
.bento-card.bento-wide {
  grid-column: span 2;
  flex-direction: row;
  align-items: center;
  gap: 24px;
}
.bento-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.bento-icon-box svg {
  width: 22px;
  height: 22px;
}
.bento-icon-box.emerald {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}
.bento-icon-box.blue {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}
.bento-icon-box.purple {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}
.bento-icon-box.amber {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.bento-title {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 10px;
}
.bento-text {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 18px;
}
.bento-pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
}
.bento-link {
  font-size: 13px;
  font-weight: 600;
  color: #38bdf8;
  margin-top: 10px;
}

/* Bento Visuals */
.matchmaking-visual {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.match-pill-sim {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.player-tag {
  font-size: 12px;
  font-weight: 600;
  background: #1e293b;
  color: #e2e8f0;
  padding: 6px 10px;
  border-radius: 6px;
}
.plus, .vs {
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
}
.vs {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
}

.fee-visual {
  flex: 1;
}
.fee-card-mock {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fc-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #94a3b8;
}
.fc-val {
  font-weight: 700;
  color: #ffffff;
}
.fc-val.success {
  color: #10b981;
}
.fc-bar {
  height: 8px;
  background: #334155;
  border-radius: 999px;
  overflow: hidden;
}
.fc-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #38bdf8);
  border-radius: 999px;
}

/* ── Calculator Section ── */
.calculator-section {
  padding: 80px 0;
}
.calc-card {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.5) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px);
}
.calc-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 40px;
}
.calc-title {
  font-size: clamp(26px, 3.5vw, 38px);
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 12px;
}
.calc-desc {
  font-size: 16px;
  color: #94a3b8;
}
.calc-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
}
.sliders-wrap {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.slider-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sl-title {
  font-size: 14px;
  font-weight: 600;
  color: #cbd5e1;
}
.sl-value {
  font-size: 16px;
  font-weight: 800;
  color: #10b981;
}
.calc-slider {
  width: 100%;
  accent-color: #10b981;
  height: 6px;
  background: #334155;
  border-radius: 999px;
  outline: none;
}
.slider-minmax {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
}

.calc-results-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 18px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.res-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.res-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.res-metric {
  min-width: 120px;
}
.res-num {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  display: block;
}
.res-num.text-emerald {
  color: #10b981;
}
.res-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}
.res-info {
  font-size: 13px;
  color: #94a3b8;
  flex: 1;
}
.calc-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
  margin-top: 10px;
}
.calc-cta-btn svg {
  width: 16px;
  height: 16px;
}

/* ── Mobile Section ── */
.mobile-section {
  padding: 80px 0;
}
.mobile-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}
.mobile-highlights {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 32px 0;
}
.mh-item {
  display: flex;
  gap: 16px;
}
.mh-icon {
  font-size: 24px;
}
.mh-item strong {
  display: block;
  font-size: 16px;
  color: #ffffff;
  margin-bottom: 4px;
}
.mh-item p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}
.app-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}
.app-cta:hover {
  background: rgba(255, 255, 255, 0.15);
}
.app-cta svg {
  width: 16px;
  height: 16px;
}

/* Phone Frame Mockup */
.mobile-mockup-col {
  display: flex;
  justify-content: center;
}
.phone-frame {
  width: 290px;
  height: 580px;
  background: #000000;
  border: 8px solid #1e293b;
  border-radius: 40px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.phone-notch {
  width: 120px;
  height: 20px;
  background: #1e293b;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  z-index: 5;
}
.phone-screen {
  flex: 1;
  background: #0b0f19;
  padding: 32px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ps-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}
.ps-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0;
}
.ps-logo {
  height: 24px;
}
.ps-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}
.ps-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.psc-title {
  font-size: 11px;
  font-weight: 700;
  color: #10b981;
  text-transform: uppercase;
}
.psc-players {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}
.psc-timer {
  font-size: 12px;
  font-family: monospace;
  color: #38bdf8;
}
.psc-queue {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}
.psc-alert {
  font-size: 11px;
  color: #f59e0b;
}
.ps-nav-bar {
  margin-top: auto;
  display: flex;
  justify-content: space-around;
  font-size: 11px;
  color: #64748b;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 10px;
}

/* ── Testimonials ── */
.testimonials-section {
  padding: 80px 0;
}
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
.testimonial-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  backdrop-filter: blur(10px);
}
.test-stars {
  color: #f59e0b;
  font-size: 16px;
  margin-bottom: 16px;
}
.test-quote {
  font-size: 15px;
  line-height: 1.6;
  color: #cbd5e1;
  margin: 0 0 24px;
  font-style: italic;
}
.test-author {
  display: flex;
  align-items: center;
  gap: 12px;
}
.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #2563eb);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}
.author-name {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}
.author-role {
  font-size: 12px;
  color: #64748b;
}

/* ── FAQ Section ── */
.faq-section {
  padding: 80px 0;
}
.faq-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.faq-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s;
}
.faq-item.open {
  border-color: rgba(16, 185, 129, 0.4);
}
.faq-question {
  width: 100%;
  padding: 20px 24px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.faq-icon {
  font-size: 22px;
  color: #10b981;
  font-weight: 400;
}
.faq-answer {
  padding: 0 24px 20px;
  font-size: 14px;
  line-height: 1.6;
  color: #94a3b8;
}
.faq-answer p {
  margin: 0;
}

/* ── Final CTA Section ── */
.final-cta-section {
  padding: 60px 0 100px;
}
.cta-banner {
  background: linear-gradient(135deg, #059669 0%, #10b981 50%, #2563eb 100%);
  border-radius: 28px;
  padding: 60px 32px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(16, 185, 129, 0.35);
  position: relative;
  overflow: hidden;
}
.cta-banner::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at top right, rgba(255, 255, 255, 0.2), transparent 70%);
}
.cta-inner {
  max-width: 720px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}
.cta-title {
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin-bottom: 16px;
}
.cta-desc {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 36px;
}
.cta-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}
.cta-btn-white {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
  padding: 14px 32px;
  border-radius: 12px;
  text-decoration: none;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}
.cta-btn-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
}
.cta-btn-white svg {
  width: 18px;
  height: 18px;
}
.cta-btn-outline {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  padding: 14px 28px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-decoration: none;
  transition: all 0.2s;
}
.cta-btn-outline:hover {
  background: rgba(0, 0, 0, 0.35);
}

/* ── Footer ── */
.landing-footer {
  background: #040711;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 60px 0 36px;
  font-size: 14px;
}
.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.footer-brand-col {
  max-width: 320px;
}
.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.footer-img {
  height: 42px;
}
.footer-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}
.footer-motto {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}
.footer-links-grid {
  display: flex;
  gap: 60px;
  flex-wrap: wrap;
}
.footer-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fg-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: #ffffff;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.footer-group a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}
.footer-group a:hover {
  color: #ffffff;
}
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-top: 24px;
  font-size: 13px;
  color: #64748b;
  flex-wrap: wrap;
}
.footer-bottom-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Responsive Media Queries ── */
.desktop-only {
  display: flex;
}
.mobile-only {
  display: none;
}

@media (max-width: 960px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: block !important;
  }
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bento-card.bento-wide {
    grid-column: span 1;
    flex-direction: column;
  }
  .calc-body {
    grid-template-columns: 1fr;
  }
  .mobile-grid {
    grid-template-columns: 1fr;
  }
  .mobile-mockup-col {
    margin-top: 20px;
  }
}

@media (max-width: 640px) {
  .nav-inner {
    padding: 0 16px;
  }
  .brand-img {
    height: 38px;
  }
  .btn-primary-sm {
    padding: 6px 12px;
    font-size: 13px;
  }
  .desktop-badge {
    display: none !important;
  }
  .hero-section {
    padding: 40px 16px 36px;
  }
  .hero-badge {
    font-size: 12px;
    padding: 5px 12px;
    gap: 6px;
  }
  .hero-cta-group {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }
  .hero-btn-primary,
  .hero-btn-secondary {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
    padding: 14px 20px;
  }
  .hero-stats-bar {
    gap: 18px;
    padding: 16px;
  }
  .stat-value {
    font-size: 20px;
  }
  .stat-divider {
    display: none;
  }
  .sim-nav {
    flex-direction: column;
    align-items: stretch;
  }
  .sim-tabs {
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .calc-card {
    padding: 24px 18px;
  }
  .comparison-card {
    padding: 24px 18px;
  }
}

/* ── Theme Toggle Button ── */
.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.theme-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.mobile-theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
}

.mobile-theme-label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}

.mobile-theme-toggle {
  display: flex;
  gap: 4px;
}

.mob-theme-pill {
  border: 1px solid transparent;
  background: none;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mob-theme-pill.active {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.25);
}

/* ── Landing Page Light Theme Adaptation ── */
:global([data-theme="light"] .landing-container) {
  background-color: #f8fafc;
  color: #0f172a;
}

:global([data-theme="light"] .grid-overlay) {
  background-image: linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
}

:global([data-theme="light"] .glow-orb) {
  opacity: 0.18;
}

:global([data-theme="light"] .landing-nav) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .landing-nav.nav-scrolled) {
  background: rgba(248, 250, 252, 0.92);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

:global([data-theme="light"] .nav-link) {
  color: #475569;
}

:global([data-theme="light"] .nav-link:hover) {
  color: #0f172a;
}

:global([data-theme="light"] .theme-toggle-btn) {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.12);
  color: #0f172a;
}

:global([data-theme="light"] .theme-toggle-btn:hover) {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.2);
}

:global([data-theme="light"] .btn-ghost-sm) {
  color: #475569;
}

:global([data-theme="light"] .btn-ghost-sm:hover) {
  color: #0f172a;
  background: rgba(0, 0, 0, 0.05);
}

:global([data-theme="light"] .mobile-menu-toggle) {
  color: #0f172a;
}

:global([data-theme="light"] .mobile-nav-drawer) {
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .mobile-theme-row) {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .mobile-theme-label) {
  color: #64748b;
}

:global([data-theme="light"] .mob-theme-pill) {
  color: #64748b;
}

:global([data-theme="light"] .mob-theme-pill.active) {
  background: #ffffff;
  color: #0f172a;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .mob-link) {
  color: #334155;
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .mob-link:hover) {
  color: #0f172a;
}

:global([data-theme="light"] .btn-secondary-block) {
  background: #f1f5f9;
  color: #0f172a;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .brand-pill) {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.3);
}

:global([data-theme="light"] .hero-badge) {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #065f46;
}

:global([data-theme="light"] .hero-title) {
  color: #0f172a;
}

:global([data-theme="light"] .hero-subtitle) {
  color: #475569;
}

:global([data-theme="light"] .hero-btn-secondary) {
  background: #ffffff;
  color: #0f172a;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .hero-btn-secondary:hover) {
  background: #f1f5f9;
  border-color: rgba(0, 0, 0, 0.2);
}

:global([data-theme="light"] .hero-stats-bar) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .stat-value) {
  color: #0f172a;
}

:global([data-theme="light"] .stat-label) {
  color: #64748b;
}

:global([data-theme="light"] .stat-divider) {
  background: rgba(0, 0, 0, 0.08);
}

/* ── Section Titles & Descriptions ── */
:global([data-theme="light"] .section-tag) {
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  border-color: rgba(37, 99, 235, 0.2);
}

:global([data-theme="light"] .section-tag.danger) {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.2);
}

:global([data-theme="light"] .section-tag.purple) {
  background: rgba(168, 85, 247, 0.08);
  color: #9333ea;
  border-color: rgba(168, 85, 247, 0.2);
}

:global([data-theme="light"] .section-tag.emerald) {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.2);
}

:global([data-theme="light"] .section-title) {
  color: #0f172a;
}

:global([data-theme="light"] .section-description) {
  color: #475569;
}

/* ── Simulator Section ── */
:global([data-theme="light"] .simulator-card) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.07);
}

:global([data-theme="light"] .sim-nav) {
  background: #f8fafc;
  border-bottom-color: rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .sim-tab) {
  color: #64748b;
}

:global([data-theme="light"] .sim-tab:hover) {
  color: #0f172a;
  background: rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .sim-tab.active) {
  background: #ffffff;
  color: #059669;
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .sim-status-banner) {
  background: #f8fafc;
  border-color: rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .banner-session-title) {
  color: #0f172a;
}

:global([data-theme="light"] .banner-pill) {
  background: #e2e8f0;
  color: #334155;
}

:global([data-theme="light"] .banner-pill.highlight) {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

:global([data-theme="light"] .clock-display) {
  color: #64748b;
}

:global([data-theme="light"] .sim-court-card) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
}

:global([data-theme="light"] .sim-court-card:hover) {
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .court-number) {
  color: #0f172a;
}

:global([data-theme="light"] .court-matchup) {
  background: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

:global([data-theme="light"] .player-chip) {
  color: #1e293b;
}

:global([data-theme="light"] .vs-score) {
  color: #0284c7;
}

:global([data-theme="light"] .court-footer) {
  border-top-color: rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .on-deck-names) {
  color: #334155;
}

:global([data-theme="light"] .court-rotate-btn) {
  background: #f1f5f9;
  border-color: rgba(0, 0, 0, 0.1);
  color: #0f172a;
}

:global([data-theme="light"] .court-rotate-btn:hover) {
  background: #10b981;
  color: #ffffff;
  border-color: #10b981;
}

/* ── Simulator Queue Tab ── */
:global([data-theme="light"] .qt-title) {
  color: #0f172a;
}

:global([data-theme="light"] .toggle-label) {
  color: #475569;
}

:global([data-theme="light"] .queue-item-card) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

:global([data-theme="light"] .queue-item-card.next-match) {
  background: #f0fdf4;
  border-color: rgba(16, 185, 129, 0.3);
}

:global([data-theme="light"] .q-name) {
  color: #0f172a;
}

:global([data-theme="light"] .q-sub) {
  color: #64748b;
}

:global([data-theme="light"] .status-pill.waiting) {
  background: #f1f5f9;
  color: #64748b;
}

/* ── Simulator TV Kiosk & Brackets ── */
:global([data-theme="light"] .kiosk-frame) {
  background: #f8fafc;
  border-color: rgba(0, 0, 0, 0.1);
}

:global([data-theme="light"] .kiosk-top) {
  border-bottom-color: rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .kiosk-qr-box) {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .qr-mock svg) {
  color: #0f172a;
}

:global([data-theme="light"] .qr-text strong) {
  color: #0f172a;
}

:global([data-theme="light"] .kiosk-court) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .kc-teams) {
  color: #0f172a;
}

:global([data-theme="light"] .kb-names) {
  color: #0f172a;
}

:global([data-theme="light"] .bracket-match) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .match-slot) {
  color: #475569;
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .match-slot.winner) {
  color: #0f172a;
  background: #f0fdf4;
}

/* ── Comparison Section ── */
:global([data-theme="light"] .comparison-card) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .comparison-card.old-way) {
  background: #fffafa;
  border-color: rgba(239, 68, 68, 0.2);
}

:global([data-theme="light"] .comparison-card.kue-way) {
  background: #f0fdf4;
  border-color: rgba(16, 185, 129, 0.25);
}

:global([data-theme="light"] .comp-title) {
  color: #0f172a;
}

:global([data-theme="light"] .comp-list strong) {
  color: #0f172a;
}

:global([data-theme="light"] .comp-list p) {
  color: #475569;
}

/* ── Bento Grid ── */
:global([data-theme="light"] .bento-card) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .bento-card:hover) {
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .bento-title) {
  color: #0f172a;
}

:global([data-theme="light"] .bento-text) {
  color: #475569;
}

:global([data-theme="light"] .pill) {
  background: #f1f5f9;
  color: #334155;
}

:global([data-theme="light"] .matchmaking-visual) {
  background: #f8fafc;
  border-color: rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .player-tag) {
  background: #ffffff;
  color: #0f172a;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .fee-card-mock) {
  background: #f8fafc;
  border-color: rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .fc-row) {
  color: #475569;
}

:global([data-theme="light"] .fc-val) {
  color: #0f172a;
}

:global([data-theme="light"] .fc-bar) {
  background: #e2e8f0;
}

/* ── Calculator Section ── */
:global([data-theme="light"] .calc-card) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06);
}

:global([data-theme="light"] .calc-title) {
  color: #0f172a;
}

:global([data-theme="light"] .calc-desc) {
  color: #475569;
}

:global([data-theme="light"] .sl-title) {
  color: #334155;
}

:global([data-theme="light"] .calc-slider) {
  background: #e2e8f0;
}

:global([data-theme="light"] .calc-results-card) {
  background: #f8fafc;
  border-color: rgba(16, 185, 129, 0.3);
}

:global([data-theme="light"] .res-title) {
  color: #0f172a;
  border-bottom-color: rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .res-num) {
  color: #0f172a;
}

:global([data-theme="light"] .res-info) {
  color: #475569;
}

/* ── Mobile Section ── */
:global([data-theme="light"] .mh-item strong) {
  color: #0f172a;
}

:global([data-theme="light"] .mh-item p) {
  color: #475569;
}

:global([data-theme="light"] .app-cta) {
  background: #ffffff;
  color: #0f172a;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .app-cta:hover) {
  background: #f1f5f9;
}

:global([data-theme="light"] .phone-frame) {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

:global([data-theme="light"] .phone-notch) {
  background: #cbd5e1;
}

:global([data-theme="light"] .phone-screen) {
  background: #f8fafc;
}

:global([data-theme="light"] .ps-card) {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

:global([data-theme="light"] .psc-players) {
  color: #0f172a;
}

:global([data-theme="light"] .psc-queue) {
  color: #0f172a;
}

:global([data-theme="light"] .ps-nav-bar) {
  border-top-color: rgba(0, 0, 0, 0.06);
}

/* ── Testimonials ── */
:global([data-theme="light"] .testimonial-card) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

:global([data-theme="light"] .test-quote) {
  color: #334155;
}

:global([data-theme="light"] .author-name) {
  color: #0f172a;
}

/* ── FAQ ── */
:global([data-theme="light"] .faq-item) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .faq-question) {
  color: #0f172a;
}

:global([data-theme="light"] .faq-answer) {
  color: #475569;
}

/* ── Footer ── */
:global([data-theme="light"] .landing-footer) {
  background: #f1f5f9;
  border-top-color: rgba(0, 0, 0, 0.08);
}

:global([data-theme="light"] .footer-col-title) {
  color: #0f172a;
}

:global([data-theme="light"] .footer-link) {
  color: #64748b;
}

:global([data-theme="light"] .footer-link:hover) {
  color: #0f172a;
}

:global([data-theme="light"] .fg-title) {
  color: #0f172a;
}

:global([data-theme="light"] .footer-group a) {
  color: #64748b;
}

:global([data-theme="light"] .footer-group a:hover) {
  color: #0f172a;
}

:global([data-theme="light"] .footer-bottom) {
  color: #94a3b8;
  border-top-color: rgba(0, 0, 0, 0.06);
}
</style>
