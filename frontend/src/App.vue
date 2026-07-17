<template>
  <div class="app-container">
    <!-- Fixed User Status Top Right Corner Button -->
    <button class="user-auth-trigger" @click="openAuthModal">
      <img src="/user-circle.svg" class="user-icon" alt="User Account" />
      <span v-if="isLoggedIn" class="user-status-dot done"></span>
      <span v-else class="user-status-dot todo"></span>
    </button>

    <RoadmapPage />

    <!-- Auth Modal -->
    <AuthModal v-if="authModalOpen" @close="authModalOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RoadmapPage from './pages/roadmap_page.vue';
import AuthModal from './sections/modals/auth_modal.vue';
import { useAuth } from './composables/useAuth';

const { isLoggedIn } = useAuth();
const authModalOpen = ref(false);

const openAuthModal = () => {
  authModalOpen.value = true;
};
</script>

<style>
.app-container {
  position: relative;
  min-height: 100vh;
}

.user-auth-trigger {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  box-shadow: var(--shadow-sm);
}

.user-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.user-auth-trigger:hover {
  color: var(--accent-color);
  border-color: var(--accent-color);
  transform: scale(1.05);
}

.user-status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}

.user-status-dot.done {
  background-color: var(--success-color);
}

.user-status-dot.todo {
  background-color: #6b7280;
}
</style>
