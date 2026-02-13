import { ref, watch } from 'vue'
import { googleSheetsService } from '../services/googleSheets'

const STORAGE_KEY = 'funrun_settings'

interface EventSettings {
  eventName: string
  registrationFee: number
  eventDate: string
  adminPassword?: string
}

const defaultSettings: EventSettings = {
  eventName: 'Fun Run 2026',
  registrationFee: 200,
  eventDate: '2026-02-14',
  adminPassword: 'admin123'
}

// Singleton state
const settings = ref<EventSettings>({ ...defaultSettings })
const isLoading = ref(false)

// Initialize from storage (Fast load)
const stored = localStorage.getItem(STORAGE_KEY)
if (stored) {
  try {
    settings.value = { ...defaultSettings, ...JSON.parse(stored) }
  } catch (e) {
    console.error('Failed to parse settings', e)
  }
}

// Then try to fetch from Google Sheets (Source of Truth)
// We do this lazily or when the composable is first used
let isInitialized = false

const syncWithSheet = async () => {
  if (isInitialized) return
  isInitialized = true
  isLoading.value = true
  
  try {
    const sheetSettings = await googleSheetsService.getSettings()
    if (sheetSettings && Object.keys(sheetSettings).length > 0) {
      // Merge with defaults to ensure all fields exist
      // Convert strings to numbers where necessary
      const merged = {
        ...defaultSettings,
        ...sheetSettings,
        registrationFee: Number(sheetSettings.registrationFee) || defaultSettings.registrationFee
      }
      
      settings.value = merged
      // Update local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    }
  } catch (e) {
    console.warn('Failed to sync settings from sheet', e)
  } finally {
    isLoading.value = false
  }
}

// Watch for changes and save locally
watch(settings, async (newSettings) => {
  // 1. Save to Local Storage immediately
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
}, { deep: true })

export function useEventSettings() {
  // Trigger sync on first use
  syncWithSheet()

  const updateSettings = (newSettings: Partial<EventSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  const saveSettingsToCloud = async () => {
    isLoading.value = true
    try {
      // Explicitly only send these fields
      const payload = {
        eventName: settings.value.eventName,
        registrationFee: settings.value.registrationFee,
        eventDate: settings.value.eventDate,
        adminPassword: settings.value.adminPassword
      }
      return await googleSheetsService.saveSettings(payload)
    } catch (e) {
      console.warn('Failed to save settings to sheet', e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const resetSettings = () => {
    settings.value = { ...defaultSettings }
  }

  return {
    settings,
    updateSettings,
    saveSettingsToCloud,
    resetSettings,
    isLoading
  }
}
