<script setup lang="ts">
import { useRouter } from 'vue-router'
import RegistrationForm from '../components/RegistrationForm.vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const handleRegistrationSuccess = (data: any) => {
  // Store in localStorage for demo purposes
  const savedData = localStorage.getItem('funrun_registrations')
  const registrations = savedData ? JSON.parse(savedData) : []
  registrations.push(data)
  localStorage.setItem('funrun_registrations', JSON.stringify(registrations))
  
  // RegistrationForm handles the alert, we just navigate
  // Or we could stay here? Let's go home for now.
  // goHome()
}
</script>

<template>
  <div class="registration-view">
    <button @click="goHome" class="back-btn">← Back to Home</button>
    <RegistrationForm @success="handleRegistrationSuccess" @close="goHome" />
  </div>
</template>

<style scoped>
.registration-view {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.back-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  font-weight: 600;
  transition: all 0.3s ease;
}

.back-btn:hover {
  color: var(--color-indigo);
  transform: translateX(-4px);
}
</style>