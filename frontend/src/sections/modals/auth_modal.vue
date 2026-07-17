<template>
  <div class="crud-modal-backdrop" @click.self="$emit('close')">
    <div class="crud-modal auth-modal">
      <header class="modal-header">
        <h2>{{ isLoggedIn ? 'Logout Confirmation' : 'User Login' }}</h2>
        <span class="modal-close" @click="$emit('close')">&times;</span>
      </header>

      <!-- LOGGED OUT: LOGIN FORM -->
      <form v-if="!isLoggedIn" @submit.prevent="handleLogin" class="modal-form">
        <div class="form-group">
          <label for="auth-username">Username <span class="required">*</span></label>
          <input 
            id="auth-username" 
            type="text" 
            v-model="usernameInput" 
            placeholder="Username" 
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="auth-password">Password <span class="required">*</span></label>
          <div class="password-wrapper">
            <input 
              id="auth-password" 
              :type="showPassword ? 'text' : 'password'" 
              v-model="passwordInput" 
              placeholder="••••••••" 
              required
              autocomplete="current-password"
            />
            <button 
              type="button" 
              class="eye-toggle" 
              @click="showPassword = !showPassword"
              :title="showPassword ? 'Hide password' : 'Show password'"
            >
              <!-- Eye closed (slashed) — shown when password is hidden -->
              <svg v-if="!showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <!-- Eye open — shown when password is visible -->
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <footer class="modal-footer">
          <div class="right-buttons">
            <button 
              type="button" 
              class="btn btn-cancel" 
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn btn-save" 
              :disabled="loading"
            >
              {{ loading ? 'Logging in...' : 'Login' }}
            </button>
          </div>
        </footer>
      </form>

      <!-- LOGGED IN: LOGOUT CONFIRMATION -->
      <div v-else class="modal-form">
        <div class="logout-body">
          <p>You are logged in as <strong>{{ username }}</strong>.</p>
          <p class="muted-text">Are you sure you want to log out?</p>
        </div>

        <footer class="modal-footer">
          <div class="right-buttons">
            <button 
              type="button" 
              class="btn btn-cancel" 
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-delete" 
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../../composables/useAuth';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { isLoggedIn, username, login, logout } = useAuth();

const usernameInput = ref('');
const passwordInput = ref('');
const errorMessage = ref('');
const loading = ref(false);
const showPassword = ref(false);

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';
  const success = await login(usernameInput.value, passwordInput.value);
  loading.value = false;
  if (success) {
    emit('close');
  } else {
    errorMessage.value = 'Invalid username or password';
  }
};

const handleLogout = () => {
  logout();
  emit('close');
};
</script>

<style scoped>
.auth-modal {
  max-width: 400px !important;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  width: 100%;
  padding-right: 2.75rem;
}

.eye-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #9ca3af);
  padding: 0;
  display: flex;
  align-items: center;
  transition: color var(--transition-speed) ease;
}

.eye-toggle:hover {
  color: var(--text-primary);
}

.error-msg {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.logout-body {
  padding: 1rem 0;
  text-align: center;
}

.muted-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.crud-modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.crud-modal {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  width: 100%;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: modalSlide 0.25s ease;
}

@keyframes modalSlide {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close {
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color var(--transition-speed) ease;
}

.modal-close:hover { color: var(--text-primary); }

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.required { color: #ef4444; }

.form-group input[type="text"],
.form-group input[type="password"] {
  width: 100%;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: border-color var(--transition-speed) ease;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus,
.form-group input[type="password"]:focus {
  border-color: var(--accent-color);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}

.right-buttons {
  display: flex;
  gap: 0.75rem;
  margin-left: auto;
}

.btn {
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  border: none;
  transition: all var(--transition-speed) ease;
}

.btn-cancel {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
.btn-cancel:hover { background-color: rgba(255,255,255,0.04); color: var(--text-primary); }

.btn-save {
  background-color: var(--accent-color);
  color: white;
}
.btn-save:hover:not(:disabled) { background-color: var(--accent-hover); }

.btn-delete {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-delete:hover { background-color: #ef4444; color: white; }
</style>
