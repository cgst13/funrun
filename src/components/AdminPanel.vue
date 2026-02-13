<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEventSettings } from '../composables/useEventSettings'
import { googleSheetsService } from '../services/googleSheets'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const emit = defineEmits(['close'])

const { settings, updateSettings, saveSettingsToCloud, isLoading: isSettingsLoading } = useEventSettings()
const { addToast } = useToast()
const { showConfirm } = useConfirm()

const newPassword = ref('')
const confirmPassword = ref('')

const handleSaveSettings = async () => {
  if (newPassword.value) {
    if (newPassword.value !== confirmPassword.value) {
      addToast({
        message: "Passwords don't match!",
      type: 'error'
    })
    return
    }
    
    showConfirm({
      title: 'Update Password?',
      message: 'Are you sure you want to change the admin password?',
      type: 'warning',
      confirmText: 'Yes, Update',
      onConfirm: async () => {
        updateSettings({ adminPassword: newPassword.value })
        await proceedSave()
      }
    })
    return
  }

  await proceedSave()
}

const proceedSave = async () => {
  const success = await saveSettingsToCloud()
  if (success) {
    addToast({
      message: 'Settings updated successfully!',
      type: 'success'
    })
    newPassword.value = ''
    confirmPassword.value = ''
  } else {
    addToast({
      message: 'Failed to update settings.',
      type: 'error'
    })
  }
}

// Login State
const isLoggedIn = ref(false)
const password = ref('')
const loginError = ref('')
const isLoading = ref(false)

const isOffline = ref(false)

// Data State
const registrations = ref<any[]>([])
const activeTab = ref<'registrations' | 'settings'>('registrations')
const editingRegistration = ref<any>(null)
const filterBarangay = ref('')

// Computed
const barangayOptions = computed(() => {
  const barangays = new Set(registrations.value.map(r => r.barangay))
  return Array.from(barangays).sort()
})

const filteredRegistrations = computed(() => {
  let filtered = registrations.value
  
  if (filterBarangay.value) {
    filtered = filtered.filter(r => r.barangay === filterBarangay.value)
  }
  
  return filtered
})

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString // Return original if invalid
  
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  
  return `${mm}-${dd}-${yyyy}`
}

const openEditModal = (reg: any) => {
  const copy = { ...reg }
  // Ensure birthdate is YYYY-MM-DD for the input
  if (copy.birthdate) {
    const d = new Date(copy.birthdate)
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      copy.birthdate = `${yyyy}-${mm}-${dd}`
    }
  }
  editingRegistration.value = copy
}

const closeEditModal = () => {
  editingRegistration.value = null
}

const saveEdit = async () => {
  if (!editingRegistration.value) return
  
  // Recalculate age if birthdate changed
  if (editingRegistration.value.birthdate) {
    const birthDate = new Date(editingRegistration.value.birthdate)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    editingRegistration.value.age = age
  }

  const success = await googleSheetsService.updateRegistration(editingRegistration.value)
  
  if (success) {
    // Update local state
    const index = registrations.value.findIndex(r => r.registrationId === editingRegistration.value.registrationId)
    if (index !== -1) {
      registrations.value[index] = { ...editingRegistration.value }
    }
    
    addToast({
      message: 'Registration updated successfully',
      type: 'success'
    })
    closeEditModal()
  } else {
    addToast({
      message: 'Failed to update registration',
      type: 'error'
    })
  }
}

const handleDelete = (reg: any) => {
  showConfirm({
    title: 'Delete Registration?',
    message: `Are you sure you want to delete the registration for ${reg.fullName}?`,
    type: 'danger',
    confirmText: 'Yes, Delete',
    onConfirm: async () => {
      const success = await googleSheetsService.deleteRegistration(reg.registrationId)
      if (success) {
        registrations.value = registrations.value.filter(r => r.registrationId !== reg.registrationId)
        addToast({
          message: 'Registration deleted successfully',
          type: 'success'
        })
      } else {
        addToast({
          message: 'Failed to delete registration',
          type: 'error'
        })
      }
    }
  })
}

onMounted(() => {
  // We can load initial data from local storage if needed, but let's wait for login
})

const loadRegistrations = async () => {
  isLoading.value = true
  isOffline.value = false
  try {
    // Try fetching from Google Sheets first
    const sheetData = await googleSheetsService.getRegistrations()
    
    // Save chronological data to local storage (source of truth backup)
    localStorage.setItem('funrun_registrations', JSON.stringify(sheetData))
    
    // Display newest first
    registrations.value = [...sheetData].reverse()
    
    addToast({
      message: 'Data refreshed successfully',
      type: 'success',
      duration: 2000
    })
  } catch (e) {
    console.error("Failed to load registrations from Google Sheets", e)
    isOffline.value = true
    // Fallback to local storage only if network request failed
    const data = localStorage.getItem('funrun_registrations')
    if (data) {
      const parsed = JSON.parse(data)
      registrations.value = [...parsed].reverse()
      addToast({
        message: 'Loaded offline data. Check connection.',
        type: 'warning'
      })
    } else {
      addToast({
        message: 'Failed to load data. No offline backup.',
        type: 'error'
      })
    }
  } finally {
    isLoading.value = false
  }
}

const handleLogin = () => {
  const currentAdminPassword = settings.value.adminPassword || 'admin123'
  if (password.value === currentAdminPassword) {
    isLoggedIn.value = true
    loginError.value = ''
    loadRegistrations()
    addToast({
      message: 'Welcome back, Admin!',
      type: 'success'
    })
  } else {
    loginError.value = 'Invalid password'
    addToast({
      message: 'Invalid password attempt',
      type: 'error'
    })
  }
}

const handleLogout = () => {
  showConfirm({
    title: 'Logout?',
    message: 'Are you sure you want to logout?',
    type: 'info',
    confirmText: 'Logout',
    onConfirm: () => {
      isLoggedIn.value = false
      password.value = ''
      emit('close')
    }
  })
}

const totalSales = computed(() => {
  return registrations.value.reduce((acc, curr) => {
    // Only count if status implies payment (simplified logic)
    return acc + (curr.fee || 0)
  }, 0)
})

const exportData = () => {
  const headers = ['Registration ID', 'Full Name', 'Barangay', 'Birthdate', 'Age', 'Gender', 'Shirt Size', 'Payment Method', 'Fee', 'Payment Status', 'Timestamp']
  const rows = registrations.value.map(r => [
    r.registrationId,
    r.fullName,
    r.barangay,
    r.birthdate,
    r.age,
    r.gender,
    r.tshirtSize,
    r.paymentMethod,
    r.fee,
    r.paymentStatus,
    r.timestamp || new Date().toLocaleDateString()
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'funrun_registrations.csv'
  a.click()
}
</script>

<template>
  <div class="admin-container">
    <div class="header">
      <h2 class="title">Admin <span class="accent">Panel</span></h2>
      <button v-if="isLoggedIn" @click="handleLogout" class="logout-btn">Logout</button>
      <button v-else @click="$emit('close')" class="close-btn">Close</button>
    </div>

    <!-- Login View -->
    <div v-if="!isLoggedIn" class="login-wrapper">
      <div class="login-card">
        <h3>Welcome Back</h3>
        <p class="subtitle">Please enter your admin credentials</p>
        <div class="input-group">
          <input 
            v-model="password" 
            type="password" 
            placeholder="Password"
            @keyup.enter="handleLogin"
          >
        </div>
        <button @click="handleLogin" class="login-btn">
          {{ isLoading ? 'Checking...' : 'Login' }}
        </button>
        <p v-if="loginError" class="error">{{ loginError }}</p>
      </div>
    </div>

    <!-- Dashboard View -->
    <div v-else class="dashboard">
      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'registrations' }"
          @click="activeTab = 'registrations'"
        >
          Registrations
        </button>
        <button 
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          Event Settings
        </button>
      </div>

      <!-- Registrations Tab -->
      <div v-if="activeTab === 'registrations'" class="tab-content">
        <div class="stats-row">
          <div class="stat-card">
            <span class="label">Total Registered</span>
            <span class="value">{{ filteredRegistrations.length }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Total Sales (Est.)</span>
            <span class="value">₱{{ totalSales.toLocaleString() }}</span>
          </div>
          <div class="actions">
            <select v-model="filterBarangay" class="filter-select">
              <option value="">All Barangays</option>
              <option v-for="b in barangayOptions" :key="b" :value="b">{{ b }}</option>
            </select>
            <button @click="loadRegistrations" class="refresh-btn" :disabled="isLoading">
              {{ isLoading ? 'Loading...' : 'Refresh' }}
            </button>
            <button @click="exportData" class="export-btn">Export CSV</button>
          </div>
        </div>

        <div v-if="isOffline" class="offline-warning">
          ⚠️ You are viewing offline data. Some records may be out of date.
        </div>

        <div v-if="isLoading" class="loading-state">
          Loading data from Google Sheets...
        </div>

        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Barangay</th>
                <th>Birthdate</th>
                <th>Age</th>
                <th>Gender</th>
                <th>T-Shirt Size</th>
                <th>Payment Method</th>
                <th>Fee</th>
                <th>Payment Status</th>
                <th>Registration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reg in filteredRegistrations" :key="reg.registrationId">
                <td class="mono">{{ reg.registrationId }}</td>
                <td>{{ reg.fullName }}</td>
                <td>{{ reg.barangay }}</td>
                <td>{{ formatDate(reg.birthdate) }}</td>
                <td>{{ reg.age }}</td>
                <td>{{ reg.gender }}</td>
                <td>{{ reg.tshirtSize }}</td>
                <td>{{ reg.paymentMethod }}</td>
                <td>₱{{ reg.fee }}</td>
                <td>
                  <span :class="['badge', reg.paymentStatus?.includes('Online') ? 'online' : 'cash']">
                    {{ reg.paymentStatus }}
                  </span>
                </td>
                <td class="small-date">{{ formatDate(reg.timestamp) }}</td>
                <td class="actions-cell">
                  <button @click="openEditModal(reg)" class="icon-btn edit" title="Edit">✏️</button>
                  <button @click="handleDelete(reg)" class="icon-btn delete" title="Delete">🗑️</button>
                </td>
              </tr>
              <tr v-if="filteredRegistrations.length === 0">
                <td colspan="12" class="empty">No registrations found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="tab-content settings-form">
        <div class="form-group">
          <label>Event Name</label>
          <input v-model="settings.eventName" type="text">
        </div>
        
        <div class="form-group">
          <label>Event Date</label>
          <input v-model="settings.eventDate" type="date">
        </div>

        <div class="form-group">
          <label>Registration Fee (₱)</label>
          <input v-model.number="settings.registrationFee" type="number">
        </div>

        <div class="divider"></div>
        <h3>Admin Security</h3>
        
        <div class="form-group">
          <label>New Password</label>
          <input v-model="newPassword" type="password" placeholder="Leave blank to keep current">
        </div>

        <div class="form-group">
          <label>Confirm Password</label>
          <input v-model="confirmPassword" type="password" placeholder="Confirm new password">
        </div>

        <div class="actions-row">
          <button 
            @click="handleSaveSettings" 
            class="save-btn" 
            :disabled="isSettingsLoading"
          >
            {{ isSettingsLoading ? 'Updating...' : 'Update Settings' }}
          </button>
        </div>

        <div class="info-box">
          <p>ℹ️ Click "Update Settings" to save changes to the cloud.</p>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editingRegistration" class="modal-overlay">
      <div class="modal-content">
        <h3>Edit Registration</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="editingRegistration.fullName" type="text">
          </div>
          <div class="form-group">
            <label>Barangay</label>
            <input v-model="editingRegistration.barangay" type="text">
          </div>
          <div class="form-group">
            <label>Birthdate</label>
            <input v-model="editingRegistration.birthdate" type="date">
          </div>
          <div class="form-group">
            <label>Gender</label>
            <select v-model="editingRegistration.gender" class="form-select">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div class="form-group">
            <label>T-Shirt Size</label>
            <select v-model="editingRegistration.tshirtSize" class="form-select">
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>
          <div class="form-group">
            <label>Payment Method</label>
            <select v-model="editingRegistration.paymentMethod" class="form-select">
              <option value="GCash">GCash</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fee (₱)</label>
            <input v-model.number="editingRegistration.fee" type="number">
          </div>
          <div class="form-group">
            <label>Payment Status</label>
            <select v-model="editingRegistration.paymentStatus" class="form-select">
              <option value="Pending">Pending</option>
              <option value="Paid (Cash)">Paid (Cash)</option>
              <option value="Paid (Online)">Paid (Online)</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeEditModal" class="cancel-btn">Cancel</button>
          <button @click="saveEdit" class="save-btn">Save Changes</button>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-container {
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  color: #1a202c;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}

/* Rainbow Top Border */
.admin-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: var(--gradient-primary);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.title {
  margin: 0;
  color: #1e293b;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.accent {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Login */
.login-wrapper {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  padding: 3rem;
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.login-card h3 {
  margin: 0 0 0.5rem;
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 700;
}

.subtitle {
  color: #64748b;
  margin-bottom: 2rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group input {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: var(--radius-md);
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.input-group input:focus {
  border-color: var(--color-ocean);
  background: white;
  box-shadow: 0 0 0 4px rgba(3, 105, 161, 0.1);
}

.login-btn, .logout-btn, .close-btn {
  padding: 0.875rem 1.5rem;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.login-btn {
  width: 100%;
  background: var(--gradient-primary);
  color: white;
  font-size: 1.1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  filter: brightness(110%);
}

.logout-btn {
  background: #fee2e2;
  color: var(--color-red);
}

.logout-btn:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

.close-btn {
  background: #f1f5f9;
  color: #64748b;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.error {
  color: var(--color-red);
  margin-top: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: #f1f5f9;
  padding: 0.5rem;
  border-radius: var(--radius-lg);
  width: fit-content;
}

.tabs button {
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  color: #64748b;
  cursor: pointer;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.2s ease;
}

.tabs button.active {
  background: white;
  color: var(--color-indigo);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.tabs button:hover:not(.active) {
  color: #475569;
  background: rgba(255,255,255,0.5);
}

/* Stats */
.stats-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid #f1f5f9;
  flex: 1;
  min-width: 200px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.stat-card .label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-card .value {
  display: block;
  font-size: 2.25rem;
  font-weight: 800;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.refresh-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: #f1f5f9;
  color: #475569;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.export-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: #1e293b;
  color: white;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #0f172a;
  transform: translateY(-1px);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

td {
  padding: 1rem;
  border-top: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}

tr:hover td {
  background: #f8fafc;
}

.mono {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: var(--color-ocean);
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.badge.online {
  background: #E0F2FE; /* Light sky blue/ocean */
  color: var(--color-ocean);
}

.badge.cash {
  background: #dcfce7;
  color: var(--color-green);
}

/* Settings Form */
.settings-form {
  max-width: 600px;
  background: white;
  padding: 2rem;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #475569;
  font-weight: 600;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: var(--color-teal);
  outline: none;
}

.save-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(110%);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.info-box {
  margin-top: 2rem;
  padding: 1rem;
  background: #eff6ff;
  border-radius: var(--radius-md);
  color: #1e40af;
  font-size: 0.9rem;
  border: 1px solid #dbeafe;
}
tr:last-child td {
  border-bottom: none;
}

.empty {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.actions-row {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.offline-warning {
  background: #fff7ed;
  color: #c2410c;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  border: 1px solid #ffedd5;
  text-align: center;
  font-weight: 600;
}

.small-date {
  font-size: 0.85rem;
  color: #64748b;
}

/* Filter Select */
.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  color: #475569;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  background: white;
}

/* Actions Cell */
.actions-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f1f5f9;
  transform: scale(1.1);
}

.icon-btn.edit:hover {
  color: var(--color-indigo);
}

.icon-btn.delete:hover {
  color: var(--color-red);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

@media (min-width: 1024px) {
  .table-wrapper {
    overflow-x: visible;
  }
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-top: 0;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s;
  background: white;
}

.form-select:focus {
  border-color: var(--color-teal);
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f8fafc;
  color: #475569;
}
</style>