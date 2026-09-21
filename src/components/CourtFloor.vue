<template>
  <div class="court-floor" :class="state">
    <span class="cf-no" aria-hidden="true">{{ bigNo }}</span>
    <span class="cf-net" aria-hidden="true"></span>

    <template v-if="state === 'live'">
      <div class="cf-side cf-side-a">
        <span class="cf-tag">Team A</span>
        <span class="cf-players">{{ teamA || "—" }}</span>
      </div>
      <span class="cf-vs">VS</span>
      <div class="cf-side cf-side-b">
        <span class="cf-tag">Team B</span>
        <span class="cf-players">{{ teamB || "—" }}</span>
      </div>
    </template>
    <span v-else class="cf-empty">{{ emptyText }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // Court name — the big number is derived from the trailing digits.
  name: { type: String, default: "" },
  // "idle" | "live" | "maintenance"
  state: { type: String, default: "idle" },
  teamA: { type: String, default: "" },
  teamB: { type: String, default: "" },
  emptyText: { type: String, default: "Open court — no match yet" },
});

const bigNo = computed(() => {
  const match = (props.name || "").match(/\d+/);
  return match ? match[0] : (props.name || "").trim().charAt(0).toUpperCase() || "•";
});
</script>

<style scoped>
.court-floor {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 112px;
  padding: 14px;
  border-radius: 12px;
  overflow: hidden;
  /* idle: light mint floor in light mode, dark tournament floor in dark mode */
  background: var(--court-floor-bg);
  border: 2px solid var(--court-floor-border);
  transition: background 0.25s ease, border-color 0.25s ease;
}
/* inner service-box lines */
.court-floor::before {
  content: "";
  position: absolute;
  inset: 9px;
  border: 2px solid var(--court-floor-line);
  border-radius: 4px;
  pointer-events: none;
}
/* center net */
.cf-net {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 50%;
  width: 0;
  border-left: 2px dashed var(--court-floor-net);
  transform: translateX(-1px);
}
/* big court number watermark */
.cf-no {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 68px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--court-floor-no);
  pointer-events: none;
}
.cf-empty {
  position: relative;
  z-index: 1;
  margin: auto;
  text-align: center;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--court-empty-color);
  background: var(--court-empty-bg);
  border: 1px solid var(--court-empty-border);
  padding: 5px 13px;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

/* live floor */
.court-floor.live {
  background: linear-gradient(150deg, #0f766e, #115e59);
  border-color: rgba(255, 255, 255, 0.55);
}
.court-floor.live::before { border-color: rgba(255, 255, 255, 0.3); }
.court-floor.live .cf-net { border-left-color: rgba(255, 255, 255, 0.62); }
.court-floor.live .cf-no { color: rgba(255, 255, 255, 0.12); }

/* maintenance floor */
.court-floor.maintenance {
  background: var(--court-maint-bg);
  border-color: var(--court-maint-border);
}
.court-floor.maintenance::before { border-color: var(--court-maint-line); }
.court-floor.maintenance .cf-net { border-left-color: var(--court-maint-net); }
.court-floor.maintenance .cf-no { color: var(--court-maint-no); }
.court-floor.maintenance .cf-empty {
  color: var(--court-maint-color);
  background: var(--court-maint-empty-bg);
}

/* live teams on either side of the net */
.cf-side {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 2px 10px;
}
.cf-side-a { align-items: flex-start; text-align: left; }
.cf-side-b { align-items: flex-end; text-align: right; }
.cf-tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}
.cf-players {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  color: #fff;
  word-break: break-word;
}
.cf-vs {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.04em;
  background: var(--court-vs-bg);
  color: var(--court-vs-color);
  border: 1px solid var(--court-vs-border);
  padding: 3px 8px;
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
}
</style>
