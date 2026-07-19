<template>
  <div class="app-container">
    <!-- Fixed action buttons column, top right -->
    <div class="fixed-actions">
      <!-- User auth button -->
      <button class="fixed-btn" @click="openAuthModal" title="Account">
        <img src="/user-circle.svg" class="btn-icon" alt="User Account" />
        <span v-if="isLoggedIn" class="user-status-dot done"></span>
        <span v-else class="user-status-dot todo"></span>
      </button>

      <!-- Export markdown button -->
      <button
        class="fixed-btn"
        @click="downloadMarkdown"
        :disabled="downloading"
        title="Export plan as Markdown"
      >
        <img src="/markdown.svg" class="btn-icon" alt="Export Markdown" />
      </button>

      <!-- Import markdown button (authenticated only) -->
      <button
        v-if="isLoggedIn"
        class="fixed-btn"
        @click="triggerUpload"
        title="Import plan from Markdown"
      >
        <img src="/upload.svg" class="btn-icon" alt="Import Markdown" />
      </button>

      <!-- Hidden file input for markdown files -->
      <input
        type="file"
        ref="fileInput"
        style="display: none"
        accept=".md"
        @change="handleFileSelected"
      />
    </div>

    <!-- Keyed RoadmapPage to force component refresh on import -->
    <RoadmapPage :key="refreshKey" />

    <!-- Auth Modal -->
    <AuthModal v-if="authModalOpen" @close="authModalOpen = false" />

    <!-- Custom Import Confirmation Modal -->
    <div v-if="confirmModalOpen" class="confirm-modal-backdrop" @click.self="cancelImport">
      <div class="confirm-modal-box">
        <header class="modal-header">
          <h2>Backup Database?</h2>
          <span class="modal-close" @click="cancelImport">&times;</span>
        </header>
        <div class="modal-body">
          <p>Before importing, would you like to download a backup of the current database phases and steps?</p>
          <p class="warning-text">Warning: Importing will entirely overwrite your current roadmap data.</p>
        </div>
        <footer class="modal-footer">
          <div class="right-buttons">
            <button class="btn btn-cancel" @click="proceedWithImport(false)">No, Skip Backup</button>
            <button class="btn btn-save" @click="proceedWithImport(true)">Yes, Backup & Import</button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RoadmapPage from './pages/roadmap_page.vue';
import AuthModal from './sections/modals/auth_modal.vue';
import { useAuth } from './composables/useAuth';
import { API_BASE } from './config';

const { isLoggedIn, authFetch } = useAuth();
const authModalOpen = ref(false);
const downloading = ref(false);
const refreshKey = ref(0);

// Import flow state
const fileInput = ref<HTMLInputElement | null>(null);
const confirmModalOpen = ref(false);
const selectedFile = ref<File | null>(null);

const openAuthModal = () => {
  authModalOpen.value = true;
};

const downloadMarkdown = async (): Promise<void> => {
  downloading.value = true;
  try {
    const res = await fetch(`${API_BASE}/phases/export`);
    if (!res.ok) throw new Error('Export failed');

    const blob = await res.blob();
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = `plan-${datePart}_${timePart}.md`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Markdown export failed:', err);
  } finally {
    downloading.value = false;
  }
};

const triggerUpload = () => {
  if (fileInput.value) {
    fileInput.value.value = '';
    fileInput.value.click();
  }
};

const handleFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
    confirmModalOpen.value = true;
  }
};

const cancelImport = () => {
  confirmModalOpen.value = false;
  selectedFile.value = null;
};

const proceedWithImport = async (shouldBackup: boolean) => {
  confirmModalOpen.value = false;
  
  if (shouldBackup) {
    await downloadMarkdown();
  }

  if (!selectedFile.value) return;

  const formData = new FormData();
  formData.append('file', selectedFile.value);

  try {
    const res = await authFetch(`${API_BASE}/phases/import`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      // Re-render the entire RoadmapPage to reflect new db status
      refreshKey.value++;
    } else {
      alert('Import failed. Please check the markdown file format.');
    }
  } catch (err) {
    console.error('Markdown import failed:', err);
  } finally {
    selectedFile.value = null;
  }
};
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
