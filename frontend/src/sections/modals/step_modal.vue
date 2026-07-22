<template>
  <div class="crud-modal-backdrop" @click.self="$emit('close')">
    <div class="crud-modal">
      <header class="modal-header">
        <h2>{{ isEditMode ? 'Edit Step' : 'Create Step' }}</h2>
        <span class="modal-close" @click="$emit('close')">&times;</span>
      </header>

      <form @submit.prevent="submitForm" class="modal-form">
        <!-- Step Title -->
        <div class="form-group">
          <label for="step-title">Title <span class="required">*</span></label>
          <input 
            id="step-title" 
            type="text" 
            v-model="form.title" 
            placeholder="Step Title" 
            required
          />
        </div>

        <!-- Task Type (Step level) -->
        <div class="form-group">
          <label>Task Type</label>
          <div class="task-type-toggle-group">
            <button
              v-for="type in taskTypes"
              :key="type.value"
              type="button"
              :class="['toggle-btn', { active: form.task_type === type.value }]"
              @click="form.task_type = type.value"
            >
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- Details List -->
        <div class="form-group">
          <label>Details Checklist</label>
          <div class="details-checklist">
            <div 
              v-for="(detail, idx) in form.details" 
              :key="idx" 
              class="detail-row"
            >
              <input 
                type="text" 
                v-model="detail.text" 
                placeholder="Checklist detail description..." 
                required
              />
              <div class="task-type-toggle-group mini">
                <button
                  v-for="type in taskTypes"
                  :key="type.value"
                  type="button"
                  :class="['toggle-btn', { active: detail.task_type === type.value }]"
                  @click="detail.task_type = type.value"
                >
                  {{ type.label }}
                </button>
              </div>
              <button type="button" class="remove-detail-btn" @click="removeDetail(idx)">
                &times;
              </button>
            </div>
          </div>
          <button type="button" class="add-detail-btn" @click="addDetail">
            + Add Detail
          </button>
        </div>

        <!-- Image Upload -->
        <div class="form-group">
          <label>Images</label>
          <div class="upload-row">
            <label for="step-files" class="btn btn-upload">Upload Files</label>
            <input
              id="step-files"
              type="file"
              multiple
              accept="image/*"
              @change="handleFileChange"
              style="display: none"
            />
            <span class="or-divider">or choose from</span>
            <button type="button" class="btn btn-gallery" @click="showGallery = true">Gallery</button>
          </div>
          <div class="file-preview-list" v-if="images.length > 0">
            <div
              v-for="img in images"
              :key="img.id"
              class="preview-item"
            >
              <img :src="resolveAssetUrl(img.url)" alt="Preview" />
              <button type="button" class="remove-img-btn" @click="removeImage(img.id)">&times;</button>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button 
            v-if="isEditMode" 
            type="button" 
            class="btn btn-delete" 
            @click="triggerConfirmDelete"
          >
            Delete
          </button>
          
          <div class="right-buttons">
            <button type="button" class="btn btn-cancel" @click="$emit('close')">
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

    <!-- Gallery Modal -->
    <GalleryModal
      v-if="showGallery"
      @close="showGallery = false"
      @select="addFromGallery"
    />

    <!-- Custom Delete Confirmation Modal -->
    <div v-if="showConfirmModal" class="confirm-modal-backdrop" @click.self="showConfirmModal = false">
      <div class="confirm-modal">
        <header class="confirm-header">
          <h3>Delete Step</h3>
        </header>
        <div class="confirm-body">
          <p>Are you sure you want to delete the step <strong>"{{ form.title }}"</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
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
import GalleryModal from './GalleryModal.vue';

interface StepDetail {
  text: string;
  task_type: string;
}

interface Step {
  id: string;
  phase_id: string;
  title: string;
  task_type: string;
  details: StepDetail[];
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
  step: Step | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', data: FormData): void;
  (e: 'delete'): void;
}>();

const taskTypes = [
  { value: 'NONE', label: 'None' },
  { value: 'ASSET', label: 'Asset' },
  { value: 'CODE', label: 'Code' },
];

const form = reactive({
  title: '',
  task_type: 'NONE',
  details: [] as StepDetail[],
});

const images = ref<ImageItem[]>([]);
const showConfirmModal = ref(false);
const showGallery = ref(false);

const initialState = reactive({
  title: '',
  task_type: 'NONE',
  detailsJson: '',
  imageUrlsJson: ''
});

watch(
  () => props.step,
  (s) => {
    if (props.isEditMode && s) {
      form.title = s.title;
      form.task_type = s.task_type || 'NONE';
      form.details = s.details.map(d => ({ ...d }));
      images.value = (s.image_urls || []).map(url => ({
        id: 'existing-' + Math.random().toString(36).substring(2, 9),
        url,
        file: null
      }));
    } else {
      form.title = '';
      form.task_type = 'NONE';
      form.details = [];
      images.value = [];
    }
    initialState.title = form.title;
    initialState.task_type = form.task_type;
    initialState.detailsJson = JSON.stringify(form.details);
    initialState.imageUrlsJson = JSON.stringify((s?.image_urls || []));
  },
  { immediate: true }
);

const addDetail = () => {
  form.details.push({ text: '', task_type: 'NONE' });
};

const removeDetail = (idx: number) => {
  form.details.splice(idx, 1);
};

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

const addFromGallery = (urls: string[]) => {
  showGallery.value = false;
  const existing = new Set(images.value.map(img => img.url));
  for (const url of urls) {
    if (!existing.has(url)) {
      images.value.push({
        id: 'gallery-' + Math.random().toString(36).substring(2, 9),
        url,
        file: null
      });
      existing.add(url);
    }
  }
};


const isSaveDisabled = computed(() => {
  if (!form.title.trim()) return true;
  if (!props.isEditMode) return false;

  const currentExistingUrls = images.value.filter(img => !img.file).map(img => img.url);
  const hasNewFiles = images.value.some(img => img.file !== null);

  const titleChanged = form.title !== initialState.title;
  const taskTypeChanged = form.task_type !== initialState.task_type;
  const detailsChanged = JSON.stringify(form.details) !== initialState.detailsJson;
  const imagesChanged = hasNewFiles || JSON.stringify(currentExistingUrls) !== initialState.imageUrlsJson;

  return !titleChanged && !taskTypeChanged && !detailsChanged && !imagesChanged;
});

const submitForm = () => {
  const formData = new FormData();
  formData.append('title', form.title);
  formData.append('task_type', form.task_type);
  formData.append('details', JSON.stringify(form.details));

  const existingImages = images.value
    .filter(img => !img.file)
    .map(img => img.url);

  formData.append('existing_images', JSON.stringify(existingImages));

  images.value
    .filter(img => img.file !== null)
    .forEach(img => {
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

.upload-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  user-select: none;
}
.btn-upload:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.or-divider {
  font-size: 0.82rem;
  color: var(--text-muted, #6b7280);
}

.btn-gallery {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: rgba(99, 102, 241, 0.1);
  color: var(--accent-color);
  border: 1px solid rgba(99, 102, 241, 0.35);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
}
.btn-gallery:hover {
  background-color: rgba(99, 102, 241, 0.2);
}

.file-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
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

.form-group input[type="text"] {
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

.form-group input[type="text"]:focus {
  border-color: var(--accent-color);
}

/* Task Type Toggle Button styles */
.task-type-toggle-group {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  flex: 1;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.6rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all var(--transition-speed) ease;
}

.toggle-btn:hover {
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.toggle-btn.active {
  background-color: rgba(99, 102, 241, 0.15);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

/* Checklist details */
.details-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 0.75rem;
  border-radius: 0.75rem;
}

.detail-row input {
  flex: 1;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.detail-row input:focus {
  border-color: var(--accent-color);
}

.task-type-toggle-group.mini {
  flex-shrink: 0;
  width: 200px;
}

.task-type-toggle-group.mini .toggle-btn {
  padding: 0.4rem;
  font-size: 0.8rem;
}

.remove-detail-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color var(--transition-speed) ease;
}

.remove-detail-btn:hover {
  color: #ef4444;
}

.add-detail-btn {
  background-color: transparent;
  border: 1px dashed var(--border-color);
  color: var(--text-secondary);
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all var(--transition-speed) ease;
}

.add-detail-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background-color: rgba(99, 102, 241, 0.02);
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
.btn-cancel:hover { background-color: rgba(255,255,255,0.04); color: var(--text-primary); }

.btn-save {
  background-color: var(--accent-color);
  color: white;
}
.btn-save:hover:not(:disabled) { background-color: var(--accent-hover); }
.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-delete:hover { background-color: #ef4444; color: white; }

/* Custom Delete Confirmation Modal */
.confirm-modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
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
.btn-danger:hover { background-color: #dc2626; }
</style>
