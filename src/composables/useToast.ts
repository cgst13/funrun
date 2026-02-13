import { ref } from 'vue'

export interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface Toast extends ToastOptions {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
}

const toasts = ref<Toast[]>([])

export function useToast() {
  const addToast = (messageOrOptions: string | ToastOptions, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000) => {
    let message: string
    let toastType: 'success' | 'error' | 'warning' | 'info'
    let toastDuration: number

    if (typeof messageOrOptions === 'string') {
      message = messageOrOptions
      toastType = type
      toastDuration = duration
    } else {
      message = messageOrOptions.message
      toastType = messageOrOptions.type || 'info'
      toastDuration = messageOrOptions.duration || 3000
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9)
    toasts.value.push({ id, message, type: toastType, duration: toastDuration })

    if (toastDuration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, toastDuration)
    }
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => addToast(message, 'success', duration)
  const error = (message: string, duration?: number) => addToast(message, 'error', duration)
  const warning = (message: string, duration?: number) => addToast(message, 'warning', duration)
  const info = (message: string, duration?: number) => addToast(message, 'info', duration)

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
