<template>
  <div class="gallery-backdrop" @click.self="$emit('close')">
    <div class="gallery-modal">
      <header class="gallery-header">
        <h2>Image Gallery</h2>
        <span class="modal-close" @click="$emit('close')">&times;</span>
      </header>

      <div class="gallery-body">
        <div v-if="loading" class="gallery-loading">
          <span class="spinner"></span>
          <p>Loading gallery…</p>
        </div>

        <div v-else-if="phases.length === 0" class="gallery-empty">
          No phases found.
        </div>

        <div v-else class="accordion-list">
          <div
            v-for="phase in phases"
            :key="phase.id"
            class="accordion-item"
          >
            <button
              type="button"
              class="accordion-header"
              @click="togglePhase(phase.id)"
            >
              <span class="accordion-title">{{ phase.title }}</span>
              <svg
                class="chevron"
                :class="{ open: openPhases.includes(phase.id) }"
                viewBox="0 0 24 24" width="16" height="16" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <div v-if="openPhases.includes(phase.id)" class="accordion-content">
              <!-- Phase-level images -->
              <div v-if="phase.image_urls?.length > 0" class="image-group">
                <p class="group-label">Phase Images</p>
                <div class="image-grid">
                  <div
                    v-for="url in phase.image_urls"
                    :key="url"
                    class="gallery-img-item"
                    :class="{ selected: isSelected(url) }"
                    @click="toggleSelect(url)"
                  >
                    <img :src="url" :alt="phase.title" />
                    <div v-if="isSelected(url)" class="selected-overlay">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Steps for this phase -->
              <div v-if="stepsLoading[phase.id]" class="steps-loading">
                <span class="spinner-sm"></span> Loading steps…
              </div>

              <template v-else-if="steps[phase.id]">
                <template v-for="step in steps[phase.id]" :key="step.id">
                  <div v-if="step.image_urls?.length > 0" class="image-group">
                    <p class="group-label step-label">{{ step.title }}</p>
                    <div class="image-grid">
                      <div
                        v-for="url in step.image_urls"
                        :key="url"
                        class="gallery-img-item"
                        :class="{ selected: isSelected(url) }"
                        @click="toggleSelect(url)"
                      >
                        <img :src="url" :alt="step.title" />
                        <div v-if="isSelected(url)" class="selected-overlay">
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Empty state: no images anywhere -->
                <div
                  v-if="!phase.image_urls?.length && !steps[phase.id]?.some(s => s.image_urls?.length)"
                  class="no-images"
                >
                  No images in this phase.
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <footer class="gallery-footer">
        <span class="selection-count">{{ selectedUrls.length }} selected</span>
        <div class="right-buttons">
          <button type="button" class="btn btn-cancel" @click="$emit('close')">Cancel</button>
          <button
            type="button"
            class="btn btn-save"
            :disabled="selectedUrls.length === 0"
            @click="confirmSelection"
          >
            Add Selected
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { API_BASE } from '../../config';

interface Phase {
  id: string;
  title: string;
  image_urls: string[];
}

interface Step {
  id: string;
  title: string;
  image_urls: string[];
}

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', urls: string[]): void;
}>();

const phases = ref<Phase[]>([]);
const loading = ref(true);
const openPhases = ref<string[]>([]);
const steps = ref<Record<string, Step[]>>({});
const stepsLoading = ref<Record<string, boolean>>({});
const selectedUrls = ref<string[]>([]);

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/phases`);
    phases.value = await res.json();
  } finally {
    loading.value = false;
  }
});

const togglePhase = async (phaseId: string) => {
  const idx = openPhases.value.indexOf(phaseId);
  if (idx !== -1) {
    openPhases.value.splice(idx, 1);
    return;
  }
  openPhases.value.push(phaseId);

  // Lazy-load steps if not already fetched
  if (steps.value[phaseId] === undefined) {
    stepsLoading.value[phaseId] = true;
    try {
      const res = await fetch(`${API_BASE}/phases/${phaseId}/steps`);
      steps.value[phaseId] = await res.json();
    } finally {
      stepsLoading.value[phaseId] = false;
    }
  }
};

const isSelected = (url: string) => selectedUrls.value.includes(url);

const toggleSelect = (url: string) => {
  const idx = selectedUrls.value.indexOf(url);
  if (idx !== -1) {
    selectedUrls.value.splice(idx, 1);
  } else {
    selectedUrls.value.push(url);
  }
};

const confirmSelection = () => {
  emit('select', [...selectedUrls.value]);
};
</script>

<style scoped>
.gallery-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.gallery-modal {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 680px;
  max-height: 82vh;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalSlide 0.25s ease;
}

@keyframes modalSlide {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.gallery-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color var(--transition-speed) ease;
  line-height: 1;
}
.modal-close:hover { color: var(--text-primary); }

/* Body */
.gallery-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.gallery-loading,
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

/* Accordion */
.accordion-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.accordion-item {
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  overflow: hidden;
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  text-align: left;
  transition: background-color var(--transition-speed) ease;
}

.accordion-header:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.accordion-title { flex: 1; }

.chevron {
  flex-shrink: 0;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}
.chevron.open { transform: rotate(180deg); }

.accordion-content {
  padding: 0.75rem 1rem 1rem;
  border-top: 1px solid var(--border-color);
  background-color: rgba(0,0,0,0.1);
}

/* Image groups */
.image-group {
  margin-bottom: 1rem;
}

.group-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
}

.step-label {
  color: var(--accent-color);
  opacity: 0.8;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.gallery-img-item {
  position: relative;
  width: 96px;
  height: 54px;
  border-radius: 0.4rem;
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
  flex-shrink: 0;
}

.gallery-img-item:hover {
  transform: scale(1.04);
  border-color: var(--border-color);
}

.gallery-img-item.selected {
  border-color: var(--accent-color);
}

.gallery-img-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.selected-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(99, 102, 241, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-images {
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 0.5rem 0;
  font-style: italic;
}

.steps-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding: 0.5rem 0;
}

/* Spinners */
.spinner, .spinner-sm {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-color);
  animation: spin 0.7s linear infinite;
}
.spinner { width: 24px; height: 24px; }
.spinner-sm { width: 14px; height: 14px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer */
.gallery-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  background-color: var(--bg-secondary);
}

.selection-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.right-buttons {
  display: flex;
  gap: 0.75rem;
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
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
