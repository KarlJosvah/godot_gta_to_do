<template>
  <div class="roadmap-page">
    <!-- Sidebar navigation section -->
    <PhaseSideSection 
      :phases="phases"
      :activePhaseId="activePhaseId"
      @select-phase="selectPhase"
      @add-phase="openAddModal"
    />

    <!-- Main Phase details section -->
    <PhaseSection 
      :phase="activePhase"
      :steps="steps"
      @toggle-step="toggleStep"
      @open-lightbox="openLightbox"
      @edit-phase="openEditModal"
    />

    <!-- Lightbox Modal -->
    <div 
      :class="['lightbox', { open: lightboxOpen }]" 
      :style="{ display: lightboxOpen ? 'block' : 'none' }"
      @click.self="closeLightbox"
    >
      <span class="lightbox-close" @click="closeLightbox">&times;</span>
      <img class="lightbox-content" :src="lightboxImg" alt="Enlarged Image" />
      <div class="lightbox-caption">{{ lightboxCaption }}</div>
    </div>

    <!-- Phase Create / Edit CRUD Modal -->
    <div 
      v-if="modalOpen" 
      class="crud-modal-backdrop" 
      @click.self="closeModal"
    >
      <div class="crud-modal">
        <header class="modal-header">
          <h2>{{ isEditMode ? 'Edit Phase' : 'Create Phase' }}</h2>
          <span class="modal-close" @click="closeModal">&times;</span>
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
              @click="deletePhase"
            >
              Delete
            </button>
            
            <div class="right-buttons">
              <button 
                type="button" 
                class="btn btn-cancel" 
                @click="closeModal"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, reactive } from 'vue';
import PhaseSideSection from '../sections/phase_side_section.vue';
import PhaseSection from '../sections/phase_section.vue';

interface Phase {
  id: string;
  title: string;
  description: string;
  done: number;
  image_urls: string[];
}

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

const API_BASE = 'http://localhost:3000/api';

const phases = ref<Phase[]>([]);
const activePhaseId = ref<string | null>(null);
const steps = ref<Step[]>([]);

// Lightbox state
const lightboxOpen = ref(false);
const lightboxImg = ref('');
const lightboxCaption = ref('');

// Modal state
const modalOpen = ref(false);
const isEditMode = ref(false);
const editingPhaseId = ref<string | null>(null);

const form = reactive({
  title: '',
  description: '',
  imageUrlsString: ''
});

// Capture initial state to detect changes
let initialFormState = {
  title: '',
  description: '',
  imageUrlsString: ''
};

const activePhase = computed(() => {
  return phases.value.find(p => p.id === activePhaseId.value) || null;
});

// Save button is only disabled in EDIT mode if no modifications are made.
// It is always enabled in CREATE mode if the form validates.
const isSaveDisabled = computed(() => {
  if (!isEditMode.value) return false;
  return (
    form.title === initialFormState.title &&
    form.description === initialFormState.description &&
    form.imageUrlsString === initialFormState.imageUrlsString
  );
});

const fetchPhases = async (targetActiveId: string | null = null) => {
  try {
    const res = await fetch(`${API_BASE}/phases`);
    phases.value = await res.json();
    
    if (phases.value.length > 0) {
      if (targetActiveId && phases.value.some(p => p.id === targetActiveId)) {
        selectPhase(targetActiveId);
      } else if (activePhaseId.value === null || !phases.value.some(p => p.id === activePhaseId.value)) {
        selectPhase(phases.value[0].id);
      } else {
        // Refresh steps for active phase
        selectPhase(activePhaseId.value);
      }
    } else {
      activePhaseId.value = null;
      steps.value = [];
    }
  } catch (err) {
    console.error('Error fetching phases:', err);
  }
};

const selectPhase = async (id: string) => {
  activePhaseId.value = id;
  try {
    const res = await fetch(`${API_BASE}/phases/${id}/steps`);
    steps.value = await res.json();
  } catch (err) {
    console.error('Error fetching steps:', err);
  }
};

const toggleStep = async (stepId: string) => {
  try {
    const res = await fetch(`${API_BASE}/steps/${stepId}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      
      const phase = phases.value.find(p => p.id === data.phaseId);
      if (phase) {
        phase.done = data.phaseDone;
      }

      const step = steps.value.find(s => s.id === data.stepId);
      if (step) {
        step.done = data.stepDone;
      }
    }
  } catch (err) {
    console.error('Error toggling step status:', err);
  }
};

// Lightbox callbacks
const openLightbox = (url: string, caption: string) => {
  lightboxImg.value = url;
  lightboxCaption.value = caption;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
};

// Modal Operations
const openAddModal = () => {
  isEditMode.value = false;
  editingPhaseId.value = null;
  form.title = '';
  form.description = '';
  form.imageUrlsString = '';
  modalOpen.value = true;
};

const openEditModal = (phase: Phase) => {
  isEditMode.value = true;
  editingPhaseId.value = phase.id;
  form.title = phase.title;
  form.description = phase.description;
  form.imageUrlsString = (phase.image_urls || []).join(', ');
  
  initialFormState = {
    title: form.title,
    description: form.description,
    imageUrlsString: form.imageUrlsString
  };
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
};

const submitForm = async () => {
  const imageUrls = form.imageUrlsString
    ? form.imageUrlsString.split(',').map((url) => url.trim()).filter((url) => url.length > 0)
    : [];

  const body = {
    title: form.title,
    description: form.description,
    image_urls: imageUrls
  };

  try {
    if (isEditMode.value && editingPhaseId.value) {
      // Patch Phase
      const res = await fetch(`${API_BASE}/phases/${editingPhaseId.value}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        closeModal();
        await fetchPhases(editingPhaseId.value);
      }
    } else {
      // Post Phase
      const res = await fetch(`${API_BASE}/phases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const newPhase = await res.json();
        closeModal();
        await fetchPhases(newPhase.id);
      }
    }
  } catch (err) {
    console.error('Error submitting form:', err);
  }
};

const deletePhase = async () => {
  if (!editingPhaseId.value) return;
  if (!confirm('Are you sure you want to delete this phase and all associated steps? This action cannot be undone.')) return;

  try {
    const res = await fetch(`${API_BASE}/phases/${editingPhaseId.value}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      closeModal();
      await fetchPhases();
    }
  } catch (err) {
    console.error('Error deleting phase:', err);
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeModal();
  }
};

onMounted(() => {
  fetchPhases();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.roadmap-page {
  display: flex;
  min-height: 100vh;
}

/* Lightbox Modal */
.lightbox {
  position: fixed;
  z-index: 999;
  padding-top: 5vh;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(8px);
}

.lightbox-content {
  margin: auto;
  display: block;
  max-width: 90%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  transform: scale(0.95);
  transition: transform 0.3s ease;
}

.lightbox.open .lightbox-content {
  transform: scale(1);
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 35px;
  color: #f1f1f1;
  font-size: 40px;
  font-weight: bold;
  transition: 0.3s;
  cursor: pointer;
}

.lightbox-close:hover,
.lightbox-close:focus {
  color: #bbb;
  text-decoration: none;
}

.lightbox-caption {
  margin: auto;
  display: block;
  width: 80%;
  max-width: 700px;
  text-align: center;
  color: #ccc;
  padding: 15px 0;
  font-weight: 500;
}

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

@media (max-width: 900px) {
  .roadmap-page {
    flex-direction: column;
  }
}
</style>
