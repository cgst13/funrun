<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { googleSheetsService } from '../services/googleSheets'

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const isSuccess = ref(false)
const error = ref('')

const registrationId = route.query.ref as string

onMounted(async () => {
  if (!registrationId) {
    error.value = 'Invalid registration reference.'
    isLoading.value = false
    return
  }

  try {
    // Attempt to update status in Google Sheets
    const success = await googleSheetsService.updatePaymentStatus(registrationId, 'Paid (Online)')
    
    if (success) {
      isSuccess.value = true
    } else {
      // Even if update failed, the payment might be successful, but we couldn't record it.
      // We should warn the user.
      error.value = 'Payment successful, but failed to update record. Please contact admin with ID: ' + registrationId
    }
  } catch (e: any) {
    console.error('Failed to verify payment', e)
    error.value = 'An error occurred while verifying payment. Please contact admin.'
  } finally {
    isLoading.value = false
  }
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="success-container">
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Verifying payment...</p>
    </div>

    <div v-else-if="isSuccess" class="success-card">
      <div class="icon">✅</div>
      <h1>Payment Successful!</h1>
      <p>Your registration is now confirmed.</p>
      <div class="details">
        <span class="label">Reference ID:</span>
        <span class="value">{{ registrationId }}</span>
      </div>
      <p class="note">Please save your Reference ID for the event.</p>
      <button @click="goHome" class="home-btn">Return to Home</button>
    </div>

    <div v-else class="error-card">
      <div class="icon">⚠️</div>
      <h1>Verification Issue</h1>
      <p>{{ error }}</p>
      <button @click="goHome" class="home-btn">Return to Home</button>
    </div>
  </div>
</template>

<style scoped>
.success-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

/* Background decoration */
.success-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: var(--gradient-primary);
  z-index: 10;
}

.success-card, .error-card, .loading {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  padding: 3rem;
  border-radius: var(--radius-xl);
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.success-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--gradient-primary);
}

.icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); }
}

h1 {
  color: #1e293b;
  margin-bottom: 1rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

p {
  color: #64748b;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.details {
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: var(--radius-md);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e2e8f0;
}

.label {
  color: #64748b;
  font-weight: 600;
}

.value {
  color: var(--color-ocean);
  font-weight: 700;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  background: rgba(3, 105, 161, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.note {
  font-size: 0.9rem;
  color: #94a3b8;
}

.home-btn {
  background: var(--gradient-primary);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.home-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
  filter: brightness(110%);
}

.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid var(--color-ocean);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
