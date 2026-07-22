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

        <!-- Image Upload Input Area -->
        <div class="form-group">
          <label for="phase-files">Upload Images</label>
          <input 
            id="phase-files" 
            type="file" 
            multiple 
            accept="image/*"
            @change="handleFileChange"
            class="file-input"
          />
          <div class="file-preview-list" v-if="images.length > 0">
            <div 
              v-for="img in images" 
              :key="img.id" 
              class="preview-item"
            >
              <img :src="resolveAssetUrl(img.url)" alt="Preview Image" />
              <button type="button" class="remove-img-btn" @click="removeImage(img.id)">&times;</button>
            </div>
          </div>
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
import { reactive, computed, watch, ref } from 'vue';
import { resolveAssetUrl } from '../../config';

interface Phase {
  id: string;
  title: string;
  description: string;
  done: number;
  image_urls: string[];
}

interface ImageItem {
  id: string;
  url: string;
  file: File | null;
}

const props = defineProps<{
  isEditMode: boolean;
  phase: Phase | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', data: FormData): void;
  (e: 'delete'): void;
}>();

const form = reactive({
  title: '',
  description: ''
});

const images = ref<ImageItem[]>([]);
const showConfirmModal = ref(false);

// Capture initial state to track alterations
const initialFormState = reactive({
  title: '',
  description: '',
  imageUrlsJson: ''
});

// Watch phase changes to populate inputs
watch(
  () => props.phase,
  (newPhase) => {
    if (props.isEditMode && newPhase) {
      form.title = newPhase.title;
      form.description = newPhase.description;
      images.value = (newPhase.image_urls || []).map(url => ({
        id: 'existing-' + Math.random().toString(36).substring(2, 9),
        url,
        file: null
      }));
    } else {
      form.title = '';
      form.description = '';
      images.value = [];
    }
    initialFormState.title = form.title;
    initialFormState.description = form.description;
    initialFormState.imageUrlsJson = JSON.stringify((newPhase?.image_urls || []));
  },
  { immediate: true }
);

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    const files = Array.from(target.files);
    files.forEach(file => {
      images.value.push({
        id: 'new-' + Math.random().toString(36).substring(2, 9),
        url: URL.createObjectURL(file),
        file
      });
    });
    // Clear input selection so user can choose same files again if needed
    target.value = '';
  }
};

const removeImage = (id: string) => {
  const idx = images.value.findIndex(img => img.id === id);
  if (idx !== -1) {
    const img = images.value[idx];
    if (img.file && img.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url);
    }
    images.value.splice(idx, 1);
  }
};

const isSaveDisabled = computed(() => {
  if (!form.title.trim()) return true;
  if (!props.isEditMode) return false;
  
  // Track alterations compared to initial state
  const currentExistingUrls = images.value.filter(img => !img.file).map(img => img.url);
  const hasNewFiles = images.value.some(img => img.file !== null);

  const titleChanged = form.title !== initialFormState.title;
  const descChanged = form.description !== initialFormState.description;
  const imagesChanged = hasNewFiles || JSON.stringify(currentExistingUrls) !== initialFormState.imageUrlsJson;

  return !titleChanged && !descChanged && !imagesChanged;
});

const submitForm = () => {
  const formData = new FormData();
  formData.append('title', form.title);
  formData.append('description', form.description);

  // Extract remaining existing image URLs
  const existingImages = images.value
    .filter(img => !img.file)
    .map(img => img.url);

  formData.append('existing_images', JSON.stringify(existingImages));
  
  // Append new files
  images.value
    .filter(img => img.file !== null)
    .forEach((img) => {
      formData.append('files', img.file!);
    });

  emit('submit', formData);
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
.preview-item {
  position: relative;
  width: 80px;
  height: 45px;
  border-radius: 0.25rem;
  border: 1px solid var(--border-color);
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.25rem;
}

.remove-img-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: background-color var(--transition-speed) ease;
}

.remove-img-btn:hover {
  background-color: #dc2626;
}

.file-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

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
  max-width: 600px;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: modalSlide 0.25s ease;
}

@keyframes modalSlide {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
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

.file-input {
  display: block;
  width: 100%;
  color: var(--text-secondary);
  font-size: 0.9rem;
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

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}
</style>
