<script setup lang="ts">
import { useConfirm } from '../../composables/useConfirm'

const { isVisible, options, hideConfirm } = useConfirm()

const handleConfirm = () => {
  options.value.onConfirm()
  hideConfirm()
}

const handleCancel = () => {
  if (options.value.onCancel) {
    options.value.onCancel()
  }
  hideConfirm()
}
</script>

<template>
  <transition name="fade">
    <div v-if="isVisible" class="confirm-overlay" @click.self="handleCancel">
      <div class="confirm-modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title" :class="options.type">{{ options.title }}</h3>
        </div>
        
        <div class="modal-body">
          <p>{{ options.message }}</p>
        </div>
        
        <div class="modal-actions">
          <button @click="handleCancel" class="btn-cancel">
            {{ options.cancelText }}
          </button>
          <button 
            @click="handleConfirm" 
            class="btn-confirm"
            :class="options.type"
          >
            {{ options.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.confirm-modal {
  background: white;
  width: 100%;
  max-width: 400px;
  border-radius: var(--radius-lg);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: scaleIn 0.2s ease-out;
}

.modal-header {
  padding: 1.5rem 1.5rem 0.5rem;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-title.danger { color: var(--color-red); }
.modal-title.warning { color: var(--color-orange); }
.modal-title.info { color: var(--color-ocean); }

.modal-body {
  padding: 0.5rem 1.5rem 1.5rem;
  color: #64748B;
  line-height: 1.6;
}

.modal-actions {
  padding: 1rem 1.5rem;
  background: #F8FAFC;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  color: #64748B;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #E2E8F0;
  color: #475569;
}

.btn-confirm {
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-confirm:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-confirm.danger { background: var(--color-red); }
.btn-confirm.warning { background: var(--color-orange); }
.btn-confirm.info { background: var(--color-blue); }

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
