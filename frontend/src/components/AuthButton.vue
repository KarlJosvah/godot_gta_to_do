<template>
  <div class="auth-btn-wrapper">
    <button class="fixed-btn" @click="authModalOpen = true" title="Account">
      <img src="/user-circle.svg" class="btn-icon" alt="User Account" />
      <span v-if="isLoggedIn" class="user-status-dot done"></span>
      <span v-else class="user-status-dot todo"></span>
    </button>

    <!-- Auth Modal -->
    <AuthModal v-if="authModalOpen" @close="authModalOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AuthModal from '../sections/modals/auth_modal.vue';
import { useAuth } from '../composables/useAuth';

const { isLoggedIn } = useAuth();
const authModalOpen = ref(false);
</script>
