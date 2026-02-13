import { ref } from 'vue'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel?: () => void
}

const isVisible = ref(false)
const options = ref<ConfirmOptions>({
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'info',
  onConfirm: () => {},
})

export function useConfirm() {
  const showConfirm = (opts: ConfirmOptions) => {
    options.value = {
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'info',
      ...opts
    }
    isVisible.value = true
  }

  const hideConfirm = () => {
    isVisible.value = false
  }

  return {
    isVisible,
    options,
    showConfirm,
    hideConfirm
  }
}
