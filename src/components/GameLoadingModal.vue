<template>
  <div class="modal-backdrop login-loading-backdrop" aria-live="polite" aria-busy="true">
    <div class="modal-card login-loading-modal" role="status">
      <div class="login-loading-arena" aria-hidden="true">
        <span class="arena-paddle left"></span>
        <span class="arena-ball"></span>
        <span class="arena-paddle right"></span>
      </div>
      <h3>{{ title }}</h3>
      <p class="subtitle">{{ message }}</p>
      <div class="login-loading-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "Loading Match Data"
  },
  message: {
    type: String,
    default: "Fetching the latest court and queue updates."
  }
});
</script>
