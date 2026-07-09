<template>
  <div class="crud-modal-backdrop" @click.self="$emit('close')">
    <div class="crud-modal">
      <header class="modal-header">
        <h2>{{ isEditMode ? 'Edit Phase' : 'Create Phase' }}</h2>
        <span class="modal-close" @click="$emit('close')">&times;</span>
      </header>

      <form @submit.prevent="submitForm" class="modal-form">
        <div class="form-group">
          <label for="phase-title">Title <span class="required">*</span></label>
          <input 
            id="phase-title" 
            type="text" 
            v-model="form.title" 
            placeholder="Phase Title" 
            required
          />
        </div>

        <div class="form-group">
          <label for="phase-desc">Description</label>
          <textarea 
            id="phase-desc" 
            v-model="form.description" 
            placeholder="Phase description details..."
            rows="4"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="phase-images">Images (Comma-separated URLs)</label>
          <input 
            id="phase-images" 
            type="text" 
            v-model="form.imageUrlsString" 
            placeholder="/images/phase1.png, /images/phase2.png" 
          />
        </div>

        <footer class="modal-footer">
          <!-- Delete Button (Only present during Edit mode) -->
          <button 
            v-if="isEditMode" 
            type="button" 
            class="btn btn-delete" 
            @click="triggerConfirmDelete"
          >
            Delete
          </button>
          
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
              :disabled="isSaveDisabled"
            >
              {{ isEditMode ? 'Save' : 'Create' }}
            </button>
          </div>
        </footer>
      </form>
    </div>

    <!-- Nested Custom Delete Confirmation Modal -->
    <div v-if="showConfirmModal" class="confirm-modal-backdrop" @click.self="showConfirmModal = false">
      <div class="confirm-modal">
        <header class="confirm-header">
          <h3>Delete Phase</h3>
        </header>
        <div class="confirm-body">
          <p>Are you sure you want to delete the phase <strong>"{{ form.title }}"</strong>?</p>
          <p class="warning-text">This will also delete all associated steps. This action cannot be undone.</p>
        </div>
        <footer class="confirm-footer">
          <button type="button" class="btn btn-cancel" @click="showConfirmModal = false">Cancel</button>
          <button type="button" class="btn btn-danger" @click="confirmDelete">Yes, Delete</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';

interface Phase {
  id: string;
  title: string;
  description: string;
  done: number;
  image_urls: string[];
}

const props = defineProps<{
  isEditMode: boolean;
  phase: Phase | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', data: { title: string; description: string; image_urls: string[] }): void;
  (e: 'delete'): void;
}>();

const form = reactive({
  title: '',
  description: '',
  imageUrlsString: ''
});

const showConfirmModal = ref(false);

// Capture initial state to track alterations
const initialFormState = reactive({
  title: '',
  description: '',
  imageUrlsString: ''
});

// Watch phase changes to populate inputs
watch(
  () => props.phase,
  (newPhase) => {
    if (props.isEditMode && newPhase) {
      form.title = newPhase.title;
      form.description = newPhase.description;
      form.imageUrlsString = (newPhase.image_urls || []).join(', ');
    } else {
      form.title = '';
      form.description = '';
      form.imageUrlsString = '';
    }
    initialFormState.title = form.title;
    initialFormState.description = form.description;
    initialFormState.imageUrlsString = form.imageUrlsString;
  },
  { immediate: true }
);

import { ref } from 'vue';

const isSaveDisabled = computed(() => {
  if (!props.isEditMode) return false;
  return (
    form.title === initialFormState.title &&
    form.description === initialFormState.description &&
    form.imageUrlsString === initialFormState.imageUrlsString
  );
});

const submitForm = () => {
  const imageUrls = form.imageUrlsString
    ? form.imageUrlsString.split(',').map((url) => url.trim()).filter((url) => url.length > 0)
    : [];

  emit('submit', {
    title: form.title,
    description: form.description,
    image_urls: imageUrls
  });
};

const triggerConfirmDelete = () => {
  showConfirmModal.value = true;
};

const confirmDelete = () => {
  showConfirmModal.value = false;
  emit('delete');
};
</script>

<style scoped>
/* CRUD Modal Design */
.crud-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  max-width: 500px;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: modalSlide 0.25s ease;
}

@keyframes modalSlide {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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

.modal-close:hover {
  color: var(--text-primary);
}

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

.form-group label .required {
  color: #ef4444;
}

.form-group input[type="text"],
.form-group textarea {
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
}

.form-group input[type="text"]:focus,
.form-group textarea:focus {
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

.btn-cancel:hover {
  background-color: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.btn-save {
  background-color: var(--accent-color);
  color: white;
}

.btn-save:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-delete:hover {
  background-color: #ef4444;
  color: white;
}

/* Delete Confirmation Modal Backdrop & Styles */
.confirm-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-modal {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 400px;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  animation: modalSlide 0.2s ease;
}

.confirm-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.confirm-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ef4444;
}

.confirm-body {
  padding: 1.5rem 1.25rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.warning-text {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}
</style>
