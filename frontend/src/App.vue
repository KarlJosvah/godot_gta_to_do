<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">GTA ROADMAP</div>
      </div>
      <nav class="phases-nav">
        <div 
          v-for="phase in phases" 
          :key="phase.id"
          :class="['nav-item', { active: activePhaseId === phase.id }]"
          @click="selectPhase(phase.id)"
        >
          <span class="nav-item-title">{{ phase.title }}</span>
          <span :class="['nav-badge', phase.done === 1 ? 'done' : 'todo']">
            {{ phase.done === 1 ? 'done' : 'todo' }}
          </span>
        </div>
      </nav>
    </aside>

    <!-- Main Section -->
    <main class="main-content">
      <header class="main-header" v-if="activePhase">
        <div class="header-content">
          <h1>{{ activePhase.title }}</h1>
          <p class="phase-description">{{ activePhase.description }}</p>
        </div>
      </header>

      <section class="content-section" v-if="activePhase">
        <!-- Phase Images Gallery -->
        <div class="gallery phase-gallery">
          <div 
            v-for="(url, idx) in activePhase.image_urls" 
            :key="idx"
            class="gallery-img-container"
            @click="openLightbox(url, `${activePhase.title} - Image ${idx + 1}`)"
          >
            <img :src="url" :alt="activePhase.title" />
          </div>
        </div>

        <!-- Steps container -->
        <div class="steps-container">
          <div 
            v-for="step in steps" 
            :key="step.id"
            :class="['step-card', { done: step.done === 1 }]"
          >
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                :checked="step.done === 1"
                @change="toggleStep(step.id)"
              />
              <span class="checkmark"></span>
              <span class="step-title-text">{{ step.title }}</span>
            </label>

            <div class="step-body">
              <!-- Left Column: Details -->
              <div class="step-details-col">
                <ul class="step-details-list">
                  <li v-for="(detail, index) in step.details" :key="index">
                    {{ detail }}
                  </li>
                </ul>
              </div>

              <!-- Right Column: Images -->
              <div class="step-images-col" v-if="step.image_urls && step.image_urls.length > 0">
                <div 
                  v-for="(url, imgIdx) in step.image_urls" 
                  :key="imgIdx"
                  class="gallery-img-container"
                  @click="openLightbox(url, `${step.title} - Step Image ${imgIdx + 1}`)"
                >
                  <img :src="url" :alt="step.title" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

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

interface Phase {
  id: string; // Changed type from number to string to match Mongo ObjectId representation
  title: string;
  description: string;
  done: number;
  image_urls: string[];
}

interface Step {
  id: string; // Changed type from number to string to match Mongo ObjectId representation
  phase_id: string;
  title: string;
  details: string[];
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
      
      // Update sidebar phase state
      const phase = phases.value.find(p => p.id === data.phaseId);
      if (phase) {
        phase.done = data.phaseDone;
      }

      // Update step status
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
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 10;
  overflow-y: auto;
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.logo {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  background: linear-gradient(135deg, #a78bfa, var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.phases-nav {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-secondary);
  border: 1px solid transparent;
}

.nav-item:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: rgba(99, 102, 241, 0.1);
  color: var(--text-primary);
  border-color: rgba(99, 102, 241, 0.2);
}

.nav-item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 0.5rem;
}

.nav-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-weight: 600;
  text-transform: uppercase;
}

.nav-badge.todo {
  background-color: rgba(107, 114, 128, 0.2);
  color: var(--text-secondary);
}

.nav-badge.done {
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--success-color);
}

/* Main Content */
.main-content {
  margin-left: var(--sidebar-width);
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 2.5rem;
}

.main-header {
  margin-bottom: 2.5rem;
}

.main-header h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.phase-description {
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 800px;
}

/* Image Galleries */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.gallery-img-container {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--border-color);
  cursor: pointer;
  background-color: var(--bg-tertiary);
  transition: transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
}

.gallery-img-container:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.gallery-img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Steps Section */
.steps-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.step-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-speed) ease;
}

.step-card.done {
  border-color: rgba(16, 185, 129, 0.2);
}

/* Custom Checkbox styling */
.checkbox-container {
  display: block;
  position: relative;
  padding-left: 2rem;
  margin-bottom: 1.2rem;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 700;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0.2rem;
  left: 0;
  height: 1.35rem;
  width: 1.35rem;
  background-color: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 0.35rem;
  transition: all var(--transition-speed) ease;
}

.checkbox-container:hover input ~ .checkmark {
  border-color: var(--accent-color);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--success-color);
  border-color: var(--success-color);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 0.4rem;
  top: 0.15rem;
  width: 0.3rem;
  height: 0.6rem;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.step-title-text {
  transition: color var(--transition-speed) ease;
}

.step-card.done .step-title-text {
  color: var(--text-secondary);
  text-decoration: line-through;
}

/* Step Details & Inner Layout */
.step-body {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.step-details-col {
  flex: 1 1 500px;
}

.step-details-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-left: 0.5rem;
}

.step-details-list li {
  position: relative;
  padding-left: 1.5rem;
  color: var(--text-secondary);
}

.step-details-list li::before {
  content: "•";
  position: absolute;
  left: 0.25rem;
  color: var(--accent-color);
  font-weight: bold;
}

.step-card.done .step-details-list li {
  color: var(--text-muted);
}

.step-images-col {
  flex: 1 1 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.step-images-col .gallery-img-container {
  flex: 1 1 200px;
  max-width: 250px;
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

/* Responsive adjustment */
@media (max-width: 900px) {
  .app-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  .main-content {
    margin-left: 0;
    padding: 1.5rem;
  }
}
</style>
