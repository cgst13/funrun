<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { googleSheetsService } from '../services/googleSheets'
import { useEventSettings } from '../composables/useEventSettings'

const { settings } = useEventSettings()

const router = useRouter()
const searchId = ref('')
const searchResult = ref<any>(null)
const searchError = ref('')
const isSearching = ref(false)
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const goToRegister = () => {
  router.push('/register')
}

const goToAdmin = () => {
  router.push('/admin')
}

const handleSearch = async () => {
  if (!searchId.value) return
  
  isSearching.value = true
  searchError.value = ''
  searchResult.value = null
  
  try {
    let registrations = []
    try {
      registrations = await googleSheetsService.getRegistrations()
      // Sync to local storage on successful fetch
      localStorage.setItem('funrun_registrations', JSON.stringify(registrations))
    } catch (e) {
      console.warn("Sheet fetch failed, falling back to local storage", e)
      const saved = localStorage.getItem('funrun_registrations')
      if (saved) {
        registrations = JSON.parse(saved)
      }
    }

    const found = registrations.find((r: any) => r.registrationId === searchId.value)
    if (found) {
      searchResult.value = found
    } else {
      searchError.value = 'Registration ID not found.'
    }
  } catch (error) {
    console.error("Search error", error)
    searchError.value = 'Error searching registration.'
  } finally {
    isSearching.value = false
  }
}
</script>

<template>
  <div class="landing-container">
    <!-- Navbar -->
    <nav class="navbar gradient-border-bottom">
      <div class="container navbar-content">
        <div class="logo-wrapper">
          <img src="/logo.png" alt="Fun Run Logo" class="nav-logo" @error="(e) => (e.target as HTMLImageElement).style.display='none'">
          <div class="logo">{{ settings.eventName }}</div>
        </div>
        <div class="nav-links">
          <a href="#" class="nav-item">Home</a>
          <a href="#details" class="nav-item">Event Details</a>
          <a href="#" @click.prevent="goToAdmin" class="nav-item">Admin Login</a>
        </div>

        <!-- Mobile Menu Button -->
        <button class="menu-btn" @click="toggleMenu" aria-label="Toggle Menu">
          <span class="hamburger" :class="{ 'active': isMenuOpen }"></span>
        </button>
      </div>

      <!-- Mobile Menu Overlay -->
      <transition name="fade">
        <div v-if="isMenuOpen" class="mobile-menu">
          <a href="#" class="mobile-nav-item" @click="closeMenu">Home</a>
          <a href="#details" class="mobile-nav-item" @click="closeMenu">Event Details</a>
          <a href="#" @click.prevent="goToAdmin(); closeMenu()" class="mobile-nav-item">Admin Login</a>
        </div>
      </transition>
    </nav>

    <!-- Hero Section -->
    <div class="hero-section">
      <div class="container hero-content">
        <h1 class="main-title">Join the <span class="gradient-text">{{ settings.eventName }}</span></h1>
        
        <div class="event-info">
          <p class="tagline">Experience the thrill, conquer the miles!</p>
          <div class="details-badges">
            <span class="badge date">📅 Date: {{ new Date(settings.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
            <span class="badge fee">💰 Fee: ₱{{ settings.registrationFee }}</span>
          </div>
        </div>

        <!-- Search Card -->
        <div class="search-card">
          <div class="input-group">
            <input 
              v-model="searchId" 
              type="text" 
              placeholder="Enter Registration ID"
              @keyup.enter="handleSearch"
            >
            <button @click="handleSearch" class="search-btn" :disabled="isSearching">
              {{ isSearching ? 'Searching...' : 'Search' }}
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="searchError" class="error-message">
            {{ searchError }}
          </div>

          <!-- Search Result -->
          <transition name="fade">
            <div v-if="searchResult" class="result-card">
              <div class="result-header">
                <h3>Participant Details</h3>
                <span class="status-badge" :class="searchResult.paymentStatus?.includes('Paid') ? 'paid' : 'pending'">
                  {{ searchResult.paymentStatus || 'Pending' }}
                </span>
              </div>
              
              <div class="result-grid">
                <div class="result-item">
                  <span class="label">Reg. ID</span>
                  <span class="value highlight">{{ searchResult.registrationId }}</span>
                </div>
                <div class="result-item">
                  <span class="label">Full Name</span>
                  <span class="value">{{ searchResult.fullName }}</span>
                </div>
                <div class="result-item">
                  <span class="label">Barangay</span>
                  <span class="value">{{ searchResult.barangay || 'N/A' }}</span>
                </div>
                <div class="result-item">
                  <span class="label">Birthdate</span>
                  <span class="value">{{ searchResult.birthdate || 'N/A' }}</span>
                </div>
                <div class="result-item">
                  <span class="label">Age</span>
                  <span class="value">{{ searchResult.age || 'N/A' }}</span>
                </div>
                <div class="result-item">
                  <span class="label">Gender</span>
                  <span class="value">{{ searchResult.gender || 'N/A' }}</span>
                </div>
                <div class="result-item">
                  <span class="label">Shirt Size</span>
                  <span class="value">{{ searchResult.tshirtSize || 'N/A' }}</span>
                </div>
                <div class="result-item">
                  <span class="label">Payment Method</span>
                  <span class="value">{{ searchResult.paymentMethod || 'N/A' }}</span>
                </div>
                <div class="result-item">
                  <span class="label">Payment Status</span>
                  <span class="value">{{ searchResult.paymentStatus || 'Pending' }}</span>
                </div>
                <div class="result-item">
                  <span class="label">Timestamp</span>
                  <span class="value">{{ searchResult.timestamp || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button @click="goToRegister" class="btn-primary">
            Register Now
          </button>
        </div>
      </div>
    </div>

    <!-- Event Details Section -->
    <div id="details" class="details-section">
      <div class="container">
        <h2 class="section-title">Event Details</h2>
        <div class="details-grid">
          <!-- Venue Card -->
          <div class="detail-card venue-card">
            <div class="card-icon">🏝️</div>
            <h3>The Venue</h3>
            <p class="location-text">Sibale Island, Concepcion, Romblon</p>
            <p class="description">
              Experience the "Masterpiece of Creation". Run through pristine beaches, 
              lush coconut groves, and scenic coastal roads. A paradise run like no other!
            </p>
            <div class="map-placeholder">
              <span>Island Map View</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modern Reset & Base */
.landing-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
}

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  z-index: 100;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
}

.logo {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.5px;
}

.accent {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  gap: 2.5rem;
}

.nav-item {
  color: #64748b;
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-normal);
  font-size: 1rem;
}

.nav-item:hover {
  color: var(--color-ocean);
}

/* Mobile Menu Button */
.menu-btn {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 102;
  position: relative;
}

.hamburger {
  width: 24px;
  height: 2px;
  background: #1e293b;
  position: relative;
  transition: all var(--transition-fast);
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background: #1e293b;
  transition: all var(--transition-fast);
  left: 0;
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  top: 8px;
}

.hamburger.active {
  background: transparent;
}

.hamburger.active::before {
  top: 0;
  transform: rotate(45deg);
}

.hamburger.active::after {
  top: 0;
  transform: rotate(-45deg);
}

/* Mobile Menu */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  z-index: 101;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 2rem;
}

.mobile-nav-item {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  text-decoration: none;
  transition: color var(--transition-normal);
}

.mobile-nav-item:hover {
  color: var(--color-ocean);
}

/* Hero Section */
.hero-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8rem 0 4rem;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.main-title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -1px;
  color: #1e293b;
}

.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.event-info {
  margin-bottom: 3rem;
  width: 100%;
}

.tagline {
  font-size: 1.25rem;
  color: #64748b;
  margin-bottom: 2rem;
}

.details-badges {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.badge.date {
  background: #ECFEFF; /* Cyan-50 equivalent for teal theme */
  color: var(--color-teal);
}

.badge.fee {
  background: #ECFDF5;
  color: var(--color-green);
}

/* Search Card */
.search-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 600px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  transition: transform var(--transition-normal);
  border: 1px solid #F1F5F9;
}

.search-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
}

.input-group {
  display: flex;
  gap: 1rem;
  position: relative;
}

.input-group input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: 2px solid #E2E8F0;
  border-radius: var(--radius-md);
  font-size: 1rem;
  outline: none;
  transition: all var(--transition-fast);
  background: #F8FAFC;
}

.input-group input:focus {
  border-color: var(--color-ocean);
  box-shadow: 0 0 0 4px rgba(3, 105, 161, 0.1); /* Ocean color with opacity */
  background: white;
}

.search-btn {
  padding: 0 2rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  transition: all var(--transition-normal);
  font-size: 1rem;
}

.search-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.search-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Result Card */
.result-card {
  margin-top: 2rem;
  background: #F8FAFC;
  border-radius: var(--radius-lg);
  padding: 2rem;
  border: 1px solid #E2E8F0;
  animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #E2E8F0;
  padding-bottom: 1rem;
}

.result-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #334155;
  font-weight: 700;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.paid {
  background: #DCFCE7;
  color: #166534;
}

.status-badge.pending {
  background: #FFEDD5;
  color: #9A3412;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  text-align: left;
}

.result-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.875rem;
  color: #64748B;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.value {
  font-weight: 600;
  color: #1E293B;
  font-size: 1.125rem;
}

.value.highlight {
  color: var(--color-indigo);
  font-family: 'Courier New', monospace;
  font-weight: 700;
  letter-spacing: 1px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
}

.btn-primary, .btn-outline {
  padding: 1rem 3rem;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 9999px;
  transition: all var(--transition-normal);
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.3);
}

.btn-outline {
  background: white;
  color: #1E293B;
  border: 2px solid #E2E8F0;
}

.btn-outline:hover {
  border-color: var(--color-blue);
  color: var(--color-blue);
  transform: translateY(-3px);
}

.error-message {
  background: #FEF2F2;
  color: #DC2626;
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-top: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #FECACA;
}

/* Logo */
.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-logo {
  height: 48px;
  width: auto;
}

/* Event Details Section */
.details-section {
  padding: 6rem 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  position: relative;
  z-index: 1;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 4rem;
  position: relative;
  display: inline-block;
  left: 50%;
  transform: translateX(-50%);
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 6px;
  background: var(--gradient-primary);
  border-radius: 3px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.detail-card {
  background: white;
  padding: 2.5rem;
  border-radius: var(--radius-xl);
  border: 1px solid #E2E8F0;
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.detail-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-color: var(--color-teal);
}

.venue-card {
  grid-column: 1 / -1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  background: #ECFEFF; /* Cyan-50 */
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--color-teal);
  border: 1px solid #CCFBF1;
}

.location-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-teal);
  margin-bottom: 1rem;
}

.description {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 600px;
}

.map-placeholder {
  width: 100%;
  height: 250px;
  background: #F8FAFC;
  border: 2px dashed #CBD5E1;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  font-weight: 600;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-section {
    padding: 6rem 0 2rem;
  }
  
  .navbar-content {
    height: 60px;
  }
  
  .nav-links {
    display: none;
  }

  .menu-btn {
    display: flex;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
    max-width: 400px;
    gap: 1rem;
  }

  .btn-primary, .btn-outline {
    width: 100%;
  }

  .input-group {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
    padding: 1rem;
  }
  
  .search-card {
    padding: 1.5rem;
  }
}
</style>