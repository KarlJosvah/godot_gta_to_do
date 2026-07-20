<template>
  <div class="roadmap-page">
    <!-- Sidebar navigation section -->
    <PhaseSideSection 
      :phases="phases"
      :activePhaseId="activePhaseId"
      @select-phase="selectPhase"
      @add-phase="openAddPhaseModal"
    />

    <!-- Main Phase details section -->
    <PhaseSection 
      :phase="activePhase"
      :steps="steps"
      @toggle-step="toggleStep"
      @open-lightbox="openLightbox"
      @edit-phase="openEditPhaseModal"
      @add-step="openAddStepModal"
      @edit-step="openEditStepModal"
    />

    <!-- Lightbox Modal -->
    <div 
      :class="['lightbox', { open: lightboxOpen }]" 
      :style="{ display: lightboxOpen ? 'block' : 'none' }"
      @click.self="closeLightbox"
    >
      <span class="lightbox-close" @click="closeLightbox">&times;</span>
      <img class="lightbox-content" :src="resolveAssetUrl(lightboxImg)" alt="Enlarged Image" />
      <div class="lightbox-caption">{{ lightboxCaption }}</div>
    </div>

    <!-- Phase Create / Edit Modal -->
    <PhaseModal 
      v-if="phaseModalOpen"
      :isEditMode="isPhaseEditMode"
      :phase="modalPhaseData"
      @close="closePhaseModal"
      @submit="handlePhaseModalSubmit"
      @delete="handlePhaseModalDelete"
    />

    <!-- Step Create / Edit Modal -->
    <StepModal 
      v-if="stepModalOpen"
      :isEditMode="isStepEditMode"
      :step="modalStepData"
      @close="closeStepModal"
      @submit="handleStepModalSubmit"
      @delete="handleStepModalDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import PhaseSideSection from '../sections/phase_side_section.vue';
import PhaseSection from '../sections/phase_section.vue';
import PhaseModal from '../sections/modals/phase_modal.vue';
import StepModal from '../sections/modals/step_modal.vue';
import { API_BASE, resolveAssetUrl } from '../config';
import { useAuth } from '../composables/useAuth';

const { authFetch } = useAuth();

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

const phases = ref<Phase[]>([]);
const activePhaseId = ref<string | null>(null);
const steps = ref<Step[]>([]);

// Lightbox state
const lightboxOpen = ref(false);
const lightboxImg = ref('');
const lightboxCaption = ref('');

// Phase modal state
const phaseModalOpen = ref(false);
const isPhaseEditMode = ref(false);
const modalPhaseData = ref<Phase | null>(null);

// Step modal state
const stepModalOpen = ref(false);
const isStepEditMode = ref(false);
const modalStepData = ref<Step | null>(null);

const activePhase = computed(() => {
  return phases.value.find(p => p.id === activePhaseId.value) || null;
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
  try {
    const res = await fetch(`${API_BASE}/phases/${id}/steps`);
    steps.value = await res.json();
  } catch (err) {
    console.error('Error fetching steps:', err);
  }
};

const refreshSteps = async () => {
  if (!activePhaseId.value) return;
  try {
    const res = await fetch(`${API_BASE}/phases/${activePhaseId.value}/steps`);
    steps.value = await res.json();
    // Also refresh phase done status
    const pRes = await fetch(`${API_BASE}/phases`);
    phases.value = await pRes.json();
  } catch (err) {
    console.error('Error refreshing steps:', err);
  }
};

const toggleStep = async (stepId: string) => {
  try {
    const res = await authFetch(`${API_BASE}/steps/${stepId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      const phase = phases.value.find(p => p.id === data.phaseId);
      if (phase) phase.done = data.phaseDone;
      const step = steps.value.find(s => s.id === data.stepId);
      if (step) step.done = data.stepDone;
    }
  } catch (err) {
    console.error('Error toggling step:', err);
  }
};

// Lightbox
const openLightbox = (url: string, caption: string) => {
  lightboxImg.value = url;
  lightboxCaption.value = caption;
  lightboxOpen.value = true;
};
const closeLightbox = () => { lightboxOpen.value = false; };

// Phase modal
const openAddPhaseModal = () => {
  isPhaseEditMode.value = false;
  modalPhaseData.value = null;
  phaseModalOpen.value = true;
};
const openEditPhaseModal = (phase: Phase) => {
  isPhaseEditMode.value = true;
  modalPhaseData.value = phase;
  phaseModalOpen.value = true;
};
const closePhaseModal = () => { phaseModalOpen.value = false; };

const handlePhaseModalSubmit = async (formData: FormData) => {
  try {
    if (isPhaseEditMode.value && modalPhaseData.value) {
      const res = await authFetch(`${API_BASE}/phases/${modalPhaseData.value.id}`, {
        method: 'PATCH',
        body: formData
      });
      if (res.ok) { closePhaseModal(); await fetchPhases(modalPhaseData.value.id); }
    } else {
      const res = await authFetch(`${API_BASE}/phases`, { method: 'POST', body: formData });
      if (res.ok) {
        const newPhase = await res.json();
        closePhaseModal();
        await fetchPhases(newPhase.id);
      }
    }
  } catch (err) { console.error('Error submitting phase form:', err); }
};

const handlePhaseModalDelete = async () => {
  if (!modalPhaseData.value) return;
  try {
    const res = await authFetch(`${API_BASE}/phases/${modalPhaseData.value.id}`, { method: 'DELETE' });
    if (res.ok) { closePhaseModal(); await fetchPhases(); }
  } catch (err) { console.error('Error deleting phase:', err); }
};

// Step modal
const openAddStepModal = () => {
  isStepEditMode.value = false;
  modalStepData.value = null;
  stepModalOpen.value = true;
};
const openEditStepModal = (step: Step) => {
  isStepEditMode.value = true;
  modalStepData.value = step;
  stepModalOpen.value = true;
};
const closeStepModal = () => { stepModalOpen.value = false; };

const handleStepModalSubmit = async (formData: FormData) => {
  try {
    if (isStepEditMode.value && modalStepData.value) {
      const res = await authFetch(`${API_BASE}/steps/${modalStepData.value.id}`, {
        method: 'PATCH',
        body: formData
      });
      if (res.ok) { closeStepModal(); await refreshSteps(); }
    } else {
      // Inject the current active phase_id
      formData.append('phase_id', activePhaseId.value!);
      const res = await authFetch(`${API_BASE}/steps`, { method: 'POST', body: formData });
      if (res.ok) { closeStepModal(); await refreshSteps(); }
    }
  } catch (err) { console.error('Error submitting step form:', err); }
};

const handleStepModalDelete = async () => {
  if (!modalStepData.value) return;
  try {
    const res = await authFetch(`${API_BASE}/steps/${modalStepData.value.id}`, { method: 'DELETE' });
    if (res.ok) { closeStepModal(); await refreshSteps(); }
  } catch (err) { console.error('Error deleting step:', err); }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') { closeLightbox(); closePhaseModal(); closeStepModal(); }
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

/* Lightbox */
.lightbox {
  position: fixed;
  z-index: 999;
  padding-top: 5vh;
  left: 0; top: 0;
  width: 100%; height: 100%;
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

.lightbox.open .lightbox-content { transform: scale(1); }

.lightbox-close {
  position: absolute;
  top: 20px; right: 35px;
  color: #f1f1f1;
  font-size: 40px;
  font-weight: bold;
  transition: 0.3s;
  cursor: pointer;
}

.lightbox-close:hover { color: #bbb; }

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

@media (max-width: 900px) {
  .roadmap-page { flex-direction: column; }
}
</style>
