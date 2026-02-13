<script setup lang="ts">
import { useToast } from '../../composables/useToast'
import ToastItem from './ToastItem.vue'

const { toasts } = useToast()
</script>

<template>
  <div class="toast-container">
    <ToastItem 
      v-for="toast in toasts" 
      :key="toast.id" 
      :toast="toast" 
    />
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

@media (max-width: 640px) {
  .toast-container {
    top: auto;
    bottom: 20px;
    left: 20px;
    right: 20px;
    align-items: center;
  }
}
</style>
