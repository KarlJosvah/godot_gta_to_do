<template>
  <div class="app-container">
    <!-- Fixed action buttons column, top right -->
    <div class="fixed-actions">
      <!-- User auth button -->
      <AuthButton />

      <!-- Export markdown button -->
      <ExportButton ref="exportBtn" />

      <!-- Import markdown button (authenticated only) -->
      <ImportButton :exportRef="exportBtn" @imported="refreshKey++" />
    </div>

    <!-- Keyed RoadmapPage to force component refresh on import -->
    <RoadmapPage :key="refreshKey" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RoadmapPage from './pages/roadmap_page.vue';
import AuthButton from './components/AuthButton.vue';
import ExportButton from './components/ExportButton.vue';
import ImportButton from './components/ImportButton.vue';

const refreshKey = ref(0);
const exportBtn = ref<{ downloadMarkdown: () => Promise<void> } | null>(null);
</script>

<style>
.app-container {
  position: relative;
  min-height: 100vh;
}

/* Fixed action column */
.fixed-actions {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fixed-btn {
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
  position: relative;
}

.fixed-btn:hover:not(:disabled) {
  color: var(--accent-color);
  border-color: var(--accent-color);
  transform: scale(1.05);
}

.fixed-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
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

/* Confirm modal overlay styling */
.confirm-modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-modal-box {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 440px;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: modalSlide 0.25s ease;
}

@keyframes modalSlide {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.confirm-modal-box .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.confirm-modal-box .modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.confirm-modal-box .modal-close {
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color var(--transition-speed) ease;
}

.confirm-modal-box .modal-close:hover {
  color: var(--text-primary);
}

.confirm-modal-box .modal-body {
  padding: 1.5rem;
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.confirm-modal-box .warning-text {
  color: #ef4444;
  margin-top: 1rem;
  font-weight: 600;
  font-size: 0.85rem;
}

.confirm-modal-box .modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-color);
  padding: 1.25rem 1.5rem;
  margin-top: 1.5rem;
}

.confirm-modal-box .right-buttons {
  display: flex;
  gap: 0.75rem;
  margin-left: auto;
}

.confirm-modal-box .btn {
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  border: none;
  transition: all var(--transition-speed) ease;
}

.confirm-modal-box .btn-cancel {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.confirm-modal-box .btn-cancel:hover {
  background-color: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.confirm-modal-box .btn-save {
  background-color: var(--accent-color);
  color: white;
}

.confirm-modal-box .btn-save:hover {
  background-color: var(--accent-hover);
}
</style>
