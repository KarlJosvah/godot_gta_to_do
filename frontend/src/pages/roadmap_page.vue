<template>
  <div class="roadmap-page">
    <!-- Sidebar navigation section -->
    <PhaseSideSection 
      :phases="phases"
      :activePhaseId="activePhaseId"
      @select-phase="selectPhase"
    />

    <!-- Main Phase details section -->
    <PhaseSection 
      :phase="activePhase"
      :steps="steps"
      @toggle-step="toggleStep"
      @open-lightbox="openLightbox"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
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

const activePhase = computed(() => {
  return phases.value.find(p => p.id === activePhaseId.value) || null;
});

const fetchPhases = async () => {
  try {
    const res = await fetch(`${API_BASE}/phases`);
    phases.value = await res.json();
    if (phases.value.length > 0 && activePhaseId.value === null) {
      selectPhase(phases.value[0].id);
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

const openLightbox = (url: string, caption: string) => {
  lightboxImg.value = url;
  lightboxCaption.value = caption;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeLightbox();
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

@media (max-width: 900px) {
  .roadmap-page {
    flex-direction: column;
  }
}
</style>
