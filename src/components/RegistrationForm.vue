<script setup lang="ts">
import { ref, computed } from 'vue'
import { createCheckoutSession } from '../services/paymongo'
import { useEventSettings } from '../composables/useEventSettings'
import { googleSheetsService } from '../services/googleSheets'
import { useToast } from '../composables/useToast'

const { settings } = useEventSettings()
const { addToast } = useToast()

const barangays = [
  "Poblacion", 
  "San Vicente", 
  "Dalajican", 
  "Masudsud", 
  "Bakhawan", 
  "Sampong", 
  "Calabasahan", 
  "San Pedro"
].sort((a, b) => a.localeCompare(b))

const tshirtSizes = ["XS", "S", "M", "L", "XL", "XXL"]

const isSubmitting = ref(false)
const formData = ref({
  fullName: '',
  barangay: '',
  birthdate: '',
  gender: '',
  tshirtSize: '',
  paymentMethod: 'cash' // 'cash' or 'online'
})

const age = computed(() => {
  if (!formData.value.birthdate) return 0
  const birthDate = new Date(formData.value.birthdate)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 0 ? age : 0
})

const emit = defineEmits(['success', 'close'])

const submitForm = async () => {
  if (!formData.value.fullName || !formData.value.barangay || !formData.value.birthdate || !formData.value.gender || !formData.value.tshirtSize) {
    addToast({
      message: 'Please fill in all fields',
      type: 'warning'
    })
    return
  }

  isSubmitting.value = true
  
  try {
    // Generate Registration ID
    const registrationId = 'RUN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const currentFee = settings.value.registrationFee

    // Prepare payload
    const payload = {
      ...formData.value,
      registrationId,
      age: age.value,
      fee: currentFee,
      paymentStatus: formData.value.paymentMethod === 'cash' ? 'Pending (Cash)' : 'Pending (Online)',
      timestamp: new Date().toISOString()
    }

    // Save to Google Sheets regardless of payment method
    await googleSheetsService.saveRegistration(payload)

    // Handle Online Payment
    if (formData.value.paymentMethod === 'online') {
      try {
        const response = await createCheckoutSession(currentFee, registrationId)
        
        if (response.errors) {
          throw new Error(response.errors[0].detail || 'Payment initialization failed')
        }

        const checkoutUrl = response.data.attributes.checkout_url
        if (checkoutUrl) {
          // Open payment in new tab or redirect
          window.location.href = checkoutUrl
          return // Stop execution here, waiting for return
        }
      } catch (paymentError: any) {
        console.error("Payment Error", paymentError)
        addToast({
          message: "Online payment initialization failed: " + paymentError.message,
          type: 'error'
        })
        isSubmitting.value = false
        return
      }
    }

    // For Cash Payment
    emit('success', payload)
    
    // Reset form
    formData.value = {
      fullName: '',
      barangay: '',
      birthdate: '',
      gender: '',
      tshirtSize: '',
      paymentMethod: 'cash'
    }
    
    addToast({
      message: `Registration Successful! ID: ${registrationId}`,
      type: 'success',
      duration: 5000
    })
    
    emit('close')
    
  } catch (error: any) {
    console.error("Registration Error", error)
    addToast({
      message: "An error occurred: " + error.message,
      type: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="registration-container">
    <div class="header">
      <div class="icon-wrapper">
        <span class="runner-icon">🏃</span>
      </div>
      <h1>{{ settings.eventName }}</h1>
      <p>Join the biggest community race of the year!</p>
    </div>
    
    <form @submit.prevent="submitForm">
      <!-- Form fields ... -->
      <!-- ... -->
      
      <div class="form-group">
        <label for="fullName">Full Name</label>
        <input 
          id="fullName" 
          v-model="formData.fullName" 
          type="text" 
          required 
          placeholder="e.g. Juan Dela Cruz"
          class="form-control"
        />
      </div>

      <div class="row">
        <div class="form-group half">
          <label for="barangay">Barangay</label>
          <div class="select-wrapper">
            <select id="barangay" v-model="formData.barangay" required class="form-control">
              <option value="" disabled>Select</option>
              <option v-for="b in barangays" :key="b" :value="b">
                {{ b }}
              </option>
            </select>
            <div class="select-arrow">▼</div>
          </div>
        </div>

        <div class="form-group half">
          <label for="gender">Gender</label>
          <div class="select-wrapper">
            <select id="gender" v-model="formData.gender" required class="form-control">
              <option value="" disabled>Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <div class="select-arrow">▼</div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="form-group half">
          <label for="birthdate">Birthdate</label>
          <input 
            id="birthdate" 
            v-model="formData.birthdate" 
            type="date" 
            required 
            class="form-control"
          />
        </div>

        <div class="form-group half">
          <label for="age">Age</label>
          <input 
            id="age" 
            :value="age" 
            type="text" 
            readonly 
            disabled
            class="form-control read-only"
            placeholder="-"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="tshirtSize">T-shirt Size</label>
        <div class="size-selector">
          <div 
            v-for="size in tshirtSizes" 
            :key="size"
            :class="['size-option', { selected: formData.tshirtSize === size }]"
            @click="formData.tshirtSize = size"
          >
            {{ size }}
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Registration Fee</label>
        <div class="fee-display">
          ₱{{ settings.registrationFee.toFixed(2) }}
        </div>
      </div>

      <div class="form-group">
        <label>Payment Method</label>
        <div class="payment-options">
          <label class="radio-label">
            <input type="radio" v-model="formData.paymentMethod" value="cash">
            <span>Cash (Pay On-Site)</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="formData.paymentMethod" value="online">
            <span>Online (GCash/GrabPay via QRPH)</span>
          </label>
        </div>
      </div>

      <button type="submit" class="submit-btn" :disabled="isSubmitting">
        <span v-if="!isSubmitting">
          {{ formData.paymentMethod === 'online' ? 'Pay & Register' : 'Register Now' }}
        </span>
        <span v-else>Processing...</span>
        <span v-if="!isSubmitting" class="btn-arrow">→</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.registration-container {
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 20px 25px -5px rgba(0, 0, 0, 0.1), 
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 3rem;
  color: #1a202c;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: transform 0.3s ease;
  position: relative;
  overflow: hidden;
}

.registration-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: var(--gradient-primary);
}

.registration-container:hover {
  transform: translateY(-5px);
}

.header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}

.runner-icon {
  font-size: 32px;
}

h1 {
  font-size: 2.25rem;
  color: #1a202c;
  margin: 0 0 0.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

p {
  color: #64748b;
  margin: 0;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.row {
  display: flex;
  gap: 1rem;
}

.half {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #475569;
  font-weight: 600;
  font-size: 0.95rem;
  text-align: left;
}

.form-control {
  width: 100%;
  padding: 0.85rem 1rem;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f8fafc;
  color: #2d3748;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-ocean);
  background-color: #fff;
  box-shadow: 0 0 0 4px rgba(3, 105, 161, 0.15);
}

.read-only {
  background-color: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
  text-align: center;
  font-weight: 600;
}

/* Custom Select Style */
.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #94a3b8;
  font-size: 0.8rem;
}

.form-group.half {
  flex: 1;
}

.row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.size-selector {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.size-option {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e2e8f0;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  font-size: 0.9rem;
}

.size-option:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.size-option.selected {
  background: var(--gradient-primary);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transform: scale(1.05);
}

.submit-btn {
  width: 100%;
  padding: 1.1rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
  filter: brightness(110%);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-arrow {
  transition: transform 0.3s ease;
}

.submit-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.fee-display {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: var(--radius-md);
  border: 1px solid #e2e8f0;
  text-align: center;
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-label:hover {
  border-color: var(--color-ocean);
  background: #f8fafc;
}

.radio-label input[type="radio"] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-ocean);
}

/* Mobile Responsiveness */
@media (max-width: 640px) {
  .registration-container {
    padding: 2rem;
  }
  
  .row {
    flex-direction: column;
    gap: 0;
  }
  
  h1 {
    font-size: 1.75rem;
  }
}
</style>
