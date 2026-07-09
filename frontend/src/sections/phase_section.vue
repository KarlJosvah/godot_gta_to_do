<template>
  <main class="main-content" v-if="phase">
    <header class="main-header">
      <div class="header-content">
        <h1>{{ phase.title }}</h1>
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
          <img :src="url" :alt="phase.title" />
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
  details: string[];
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

@media (max-width: 900px) {
  .main-content {
    margin-left: 0;
    padding: 1.5rem;
  }
}
</style>
