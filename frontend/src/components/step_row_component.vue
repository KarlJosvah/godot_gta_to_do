<template>
  <div :class="['step-card', { done: step.done === 1 }]">
    <label class="checkbox-container">
      <input 
        type="checkbox" 
        :checked="step.done === 1"
        @change="$emit('toggle', step.id)"
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
          @click="$emit('open-lightbox', url, `${step.title} - Step Image ${imgIdx + 1}`)"
        >
          <img :src="url" :alt="step.title" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Step {
  id: string;
  phase_id: string;
  title: string;
  details: string[];
  done: number;
  image_urls: string[];
}

defineProps<{
  step: Step;
}>();

defineEmits<{
  (e: 'toggle', id: string): void;
  (e: 'open-lightbox', url: string, caption: string): void;
}>();
</script>

<style scoped>
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
</style>
