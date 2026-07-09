<template>
  <div class="crud-modal-backdrop" @click.self="$emit('close')">
    <div class="crud-modal">
      <header class="modal-header">
        <h2>{{ isEditMode ? 'Edit Step' : 'Add Step' }}</h2>
        <span class="modal-close" @click="$emit('close')">&times;</span>
      </header>

      <form @submit.prevent="submitForm" class="modal-form">
        <!-- Title -->
        <div class="form-group">
          <label for="step-title">Title <span class="required">*</span></label>
          <input 
            id="step-title" 
            type="text" 
            v-model="form.title" 
            placeholder="Step title"
            required
          />
        </div>

        <!-- Task Type -->
        <div class="form-group">
          <label>Task Type</label>
          <div class="task-type-selector">
            <button 
              v-for="type in taskTypes" 
              :key="type.value"
              type="button"
              :class="['type-btn', type.value.toLowerCase(), { active: form.task_type === type.value }]"
              @click="form.task_type = type.value"
            >
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- Details (dynamic list) -->
        <div class="form-group">
          <label>Details</label>
          <div class="details-list">
            <div 
              v-for="(detail, idx) in form.details" 
              :key="idx"
              class="detail-item"
            >
              <input 
                type="text" 
                v-model="detail.text"
                placeholder="Detail text..."
                class="detail-input"
              />
              <div class="detail-type-mini">
                <button 
                  v-for="type in taskTypes" 
                  :key="type.value"
                  type="button"
                  :class="['mini-type-btn', type.value.toLowerCase(), { active: detail.task_type === type.value }]"
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
          <label for="step-files">Upload Images</label>
          <input 
            id="step-files" 
            type="file" 
            multiple 
            accept="image/*"
            @change="handleFileChange"
            class="file-input"
          />
          <div class="file-preview-list" v-if="previewUrls.length > 0">
            <div 
              v-for="(url, idx) in previewUrls" 
              :key="idx" 
              class="preview-item"
            >
              <img :src="url.startsWith('blob:') || url.startsWith('http') ? url : `http://localhost:3000${url}`" alt="Preview" />
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

const selectedFiles = ref<File[]>([]);
const previewUrls = ref<string[]>([]);
const showConfirmModal = ref(false);

const initialState = reactive({ title: '', task_type: 'NONE', detailsJson: '' });

watch(
  () => props.step,
  (s) => {
    if (props.isEditMode && s) {
      form.title = s.title;
      form.task_type = s.task_type || 'NONE';
      form.details = s.details.map(d => ({ ...d }));
      previewUrls.value = [...(s.image_urls || [])];
    } else {
      form.title = '';
      form.task_type = 'NONE';
      form.details = [];
      previewUrls.value = [];
    }
    selectedFiles.value = [];
    initialState.title = form.title;
    initialState.task_type = form.task_type;
    initialState.detailsJson = JSON.stringify(form.details);
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
    selectedFiles.value = files;
    previewUrls.value = files.map(f => URL.createObjectURL(f));
  }
};

const isSaveDisabled = computed(() => {
  if (!form.title.trim()) return true;
  if (!props.isEditMode) return false;
  if (selectedFiles.value.length > 0) return false;
  return (
    form.title === initialState.title &&
    form.task_type === initialState.task_type &&
    JSON.stringify(form.details) === initialState.detailsJson
  );
});

const submitForm = () => {
  const formData = new FormData();
  formData.append('title', form.title);
  formData.append('task_type', form.task_type);
  // Serialize details as JSON string to pass via FormData
  formData.append('details', JSON.stringify(form.details));
  selectedFiles.value.forEach(f => formData.append('files', f));
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
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
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
  position: sticky;
  top: 0;
  background-color: var(--bg-secondary);
  z-index: 1;
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

.form-group input[type="text"]:focus { border-color: var(--accent-color); }

/* Task Type Selector */
.task-type-selector {
  display: flex;
  gap: 0.5rem;
}

.type-btn {
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.4rem 0.9rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  transition: all var(--transition-speed) ease;
}

.type-btn.none.active   { background: rgba(255,255,255,0.08); color: var(--text-primary); border-color: var(--text-muted); }
.type-btn.asset.active  { background: rgba(245,158,11,0.15);  color: #fbbf24; border-color: rgba(245,158,11,0.3); }
.type-btn.code.active   { background: rgba(99,102,241,0.15);  color: #818cf8; border-color: rgba(99,102,241,0.3); }
.type-btn:hover         { border-color: var(--text-secondary); color: var(--text-primary); }

/* Details list */
.details-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-input {
  flex: 1;
}

.detail-type-mini {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.mini-type-btn {
  font-family: inherit;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  transition: all var(--transition-speed) ease;
}

.mini-type-btn.none.active   { background: rgba(255,255,255,0.08); color: var(--text-primary); }
.mini-type-btn.asset.active  { background: rgba(245,158,11,0.15);  color: #fbbf24; border-color: rgba(245,158,11,0.4); }
.mini-type-btn.code.active   { background: rgba(99,102,241,0.15);  color: #818cf8; border-color: rgba(99,102,241,0.4); }

.remove-detail-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 0.25rem;
  transition: color var(--transition-speed) ease;
  flex-shrink: 0;
}

.remove-detail-btn:hover { color: #ef4444; }

.add-detail-btn {
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-color);
  background: none;
  border: 1px dashed var(--accent-color);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  width: 100%;
  margin-top: 0.25rem;
}

.add-detail-btn:hover {
  background-color: rgba(99, 102, 241, 0.06);
}

/* File Upload */
.file-input {
  display: block;
  width: 100%;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.file-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.preview-item {
  width: 80px;
  height: 45px;
  border-radius: 0.25rem;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.preview-item img {
  width: 100%; height: 100%;
  object-fit: cover;
}

/* Footer */
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
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-delete {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-delete:hover { background-color: #ef4444; color: white; }

/* Confirmation Modal */
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
.confirm-header h3 { font-size: 1.1rem; font-weight: 700; color: #ef4444; }

.confirm-body {
  padding: 1.5rem 1.25rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}
.warning-text { color: var(--text-muted); font-size: 0.85rem; margin-top: 0.5rem; }

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.btn-danger { background-color: #ef4444; color: white; }
.btn-danger:hover { background-color: #dc2626; }
</style>
