<template>
  <div :class="['step-card', { done: step.done === 1 }]">
    <div class="checkbox-row-wrapper">
      <label class="checkbox-container">
        <input 
          type="checkbox" 
          :checked="step.done === 1"
          :disabled="!isLoggedIn"
          @change="$emit('toggle', step.id)"
        />
        <span class="checkmark"></span>
        <span class="step-title-text">{{ step.title }}</span>
        <span 
          v-if="step.task_type !== 'NONE'" 
          :class="['task-badge', step.task_type.toLowerCase()]"
        >
          {{ step.task_type }}
        </span>
      </label>

      <!-- Edit icon beside title visible on hover -->
      <button v-if="isLoggedIn" class="edit-step-btn" @click="$emit('edit-step', step)">
        <svg class="edit-icon" viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" />
        </svg>
      </button>
    </div>

    <div class="step-body">
      <!-- Left Column: Details -->
      <div class="step-details-col">
        <ul class="step-details-list">
          <li v-for="(detail, index) in step.details" :key="index">
            <span class="detail-text">{{ detail.text }}</span>
            <span 
              v-if="detail.task_type !== 'NONE'" 
              :class="['task-badge', 'mini', detail.task_type.toLowerCase()]"
            >
              {{ detail.task_type }}
            </span>
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
          <img :src="resolveAssetUrl(url)" :alt="step.title" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { resolveAssetUrl } from '../config';
import { useAuth } from '../composables/useAuth';

const { isLoggedIn } = useAuth();

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

defineProps<{
  step: Step;
}>();

defineEmits<{
  (e: 'toggle', id: string): void;
  (e: 'open-lightbox', url: string, caption: string): void;
  (e: 'edit-step', step: Step): void;
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

.checkbox-row-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}

/* Custom Checkbox styling */
.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 2rem;
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
  top: 50%;
  transform: translateY(-50%);
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

/* Edit icon styling only visible on hover */
.edit-step-btn {
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

.checkbox-row-wrapper:hover .edit-step-btn {
  opacity: 1;
}

.edit-step-btn:hover {
  color: var(--accent-color);
  background-color: rgba(255, 255, 255, 0.04);
}

/* Badges styling */
.task-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  margin-left: 1rem;
  letter-spacing: 0.05em;
}

.task-badge.asset {
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.task-badge.code {
  background-color: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.task-badge.mini {
  font-size: 0.6rem;
  padding: 0.1rem 0.4rem;
  margin-left: 0.5rem;
  vertical-align: middle;
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
