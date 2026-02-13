<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast, type Toast } from '../../composables/useToast'

const props = defineProps<{
  toast: Toast
}>()

const { removeToast } = useToast()
const isVisible = ref(false)

onMounted(() => {
  // Trigger entrance animation
  requestAnimationFrame(() => {
    isVisible.value = true
  })
})

const handleClose = () => {
  isVisible.value = false
  setTimeout(() => {
    removeToast(props.toast.id)
  }, 300) // Wait for exit animation
}

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return '✓'
    case 'error': return '✕'
    case 'warning': return '⚠'
    case 'info': return 'ℹ'
    default: return 'ℹ'
  }
}
</script>

<template>
  <div 
    class="toast-item"
    :class="[toast.type, { 'visible': isVisible }]"
    role="alert"
    aria-live="polite"
  >
    <div class="toast-icon">{{ getIcon(toast.type) }}</div>
    <div class="toast-content">{{ toast.message }}</div>
    <button @click="handleClose" class="toast-close" aria-label="Close notification">×</button>
    
    <!-- Progress bar for auto-dismiss -->
    <div class="toast-progress" :style="{ animationDuration: `${toast.duration}ms` }"></div>
  </div>
</template>

<style scoped>
.toast-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.15);
  margin-bottom: 12px;
  min-width: 300px;
  max-width: 400px;
  overflow: hidden;
  transform: translateX(120%);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-left: 4px solid transparent;
}

.toast-item.visible {
  transform: translateX(0);
}

.toast-item.success { border-left-color: var(--color-success); }
.toast-item.error { border-left-color: var(--color-error); }
.toast-item.warning { border-left-color: var(--color-warning); }
.toast-item.info { border-left-color: var(--color-info); }

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
}

.success .toast-icon { background: var(--color-success); }
.error .toast-icon { background: var(--color-error); }
.warning .toast-icon { background: var(--color-warning); }
.info .toast-icon { background: var(--color-info); }

.toast-content {
  flex: 1;
  font-size: 14px;
  color: #334155;
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  color: #94A3B8;
  font-size: 20px;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #475569;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.1;
  animation: progress linear forwards;
}

.success .toast-progress { background: var(--color-success); }
.error .toast-progress { background: var(--color-error); }
.warning .toast-progress { background: var(--color-warning); }
.info .toast-progress { background: var(--color-info); }

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}
</style>
