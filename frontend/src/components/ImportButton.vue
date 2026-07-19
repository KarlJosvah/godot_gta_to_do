<template>
  <div class="import-btn-wrapper" v-if="isLoggedIn">
    <button
      class="fixed-btn"
      @click="triggerUpload"
      title="Import plan from Markdown"
    >
      <img src="/import.svg" class="btn-icon" alt="Import Markdown" />
    </button>

    <!-- Hidden file input for markdown files -->
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      accept=".md"
      @change="handleFileSelected"
    />

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
import { useAuth } from '../composables/useAuth';
import { API_BASE } from '../config';

const props = defineProps<{
  exportRef?: { downloadMarkdown: () => Promise<void> } | null;
}>();

const emit = defineEmits<{
  (e: 'imported'): void;
}>();

const { isLoggedIn, authFetch } = useAuth();

// Import flow state
const fileInput = ref<HTMLInputElement | null>(null);
const confirmModalOpen = ref(false);
const selectedFile = ref<File | null>(null);

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
  
  if (shouldBackup && props.exportRef) {
    await props.exportRef.downloadMarkdown();
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
      emit('imported');
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
