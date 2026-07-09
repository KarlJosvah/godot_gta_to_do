<template>
  <main class="main-content" v-if="phase">
    <header class="main-header">
      <div class="header-content title-hover-wrapper">
        <div class="title-row">
          <h1>{{ phase.title }}</h1>
          <!-- Edit Icon beside title, hover class logic -->
          <button class="edit-phase-btn" @click="$emit('edit-phase', phase)">
            <svg class="edit-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" />
            </svg>
          </button>
        </div>
        <p class="phase-description">{{ phase.description }}</p>
      </div>
    </header>

    <section class="content-section">
      <!-- Phase Images Gallery -->
      <div class="gallery phase-gallery">
        <div 
          v-for="(url, idx) in phase.image_urls" 
          :key="idx"
          class="gallery-img-container"
          @click="$emit('open-lightbox', url, `${phase.title} - Image ${idx + 1}`)"
        >
          <img :src="url.startsWith('http') ? url : `http://localhost:3000${url}`" :alt="phase.title" />
        </div>
      </div>

      <!-- Steps container -->
      <div class="steps-container">
        <StepRowComponent 
          v-for="step in steps" 
          :key="step.id"
          :step="step"
          @toggle="$emit('toggle-step', $event)"
          @open-lightbox="(url, caption) => $emit('open-lightbox', url, caption)"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import StepRowComponent from '../components/step_row_component.vue';

interface Phase {
  id: string;
  title: string;
  description: string;
  done: number;
  image_urls: string[];
}

interface Step {
  id: string;
  phase_id: string;
  title: string;
  task_type: string;
  details: any[];
  done: number;
  image_urls: string[];
}

defineProps<{
  phase: Phase | null;
  steps: Step[];
}>();

defineEmits<{
  (e: 'toggle-step', id: string): void;
  (e: 'open-lightbox', url: string, caption: string): void;
  (e: 'edit-phase', phase: Phase): void;
}>();
</script>

<style scoped>
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

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.main-header h1 {
  font-size: 2rem;
  font-weight: 800;
}

/* Edit icon styling only visible on hover */
.edit-phase-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all var(--transition-speed) ease;
}

.title-row:hover .edit-phase-btn {
  opacity: 1;
}

.edit-phase-btn:hover {
  color: var(--accent-color);
  background-color: rgba(255, 255, 255, 0.04);
}

.phase-description {
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 800px;
  margin-top: 0.5rem;
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

@media (max-width: 900px) {
  .main-content {
    margin-left: 0;
    padding: 1.5rem;
  }
}
</style>
