<template>
  <DashboardMobile v-if="isMobile" />
  <DashboardDesktop v-else />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import DashboardMobile from "./DashboardMobile.vue";
import DashboardDesktop from "./DashboardDesktop.vue";

const BREAKPOINT = 880;
const isMobile = ref(window.innerWidth < BREAKPOINT);

let mq = null;

onMounted(() => {
  mq = window.matchMedia(`(max-width: ${BREAKPOINT - 1}px)`);
  isMobile.value = mq.matches;
  mq.addEventListener("change", onBreakpoint);
});

onUnmounted(() => {
  mq?.removeEventListener("change", onBreakpoint);
});

function onBreakpoint(e) {
  isMobile.value = e.matches;
}
</script>
