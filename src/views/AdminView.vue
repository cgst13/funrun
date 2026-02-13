<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPanel from '../components/AdminPanel.vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="admin-view">
    <AdminPanel @close="goHome" />
  </div>
</template>

<style scoped>
.admin-view {
  width: fit-content;
  min-width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>