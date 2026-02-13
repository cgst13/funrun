<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastContainer from './components/ui/ToastContainer.vue'
import ConfirmDialog from './components/ui/ConfirmDialog.vue'
</script>

<template>
  <div class="app-container">
    <RouterView />
    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-image: linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.75)),
                    url('https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=2070&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
</style>