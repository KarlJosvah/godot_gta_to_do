<template>
  <main class="main-content" v-if="phase">
    <header class="main-header">
      <div class="header-content title-hover-wrapper">
        <div class="title-row">
          <h1>{{ phase.title }}</h1>
          <button v-if="isLoggedIn" class="edit-phase-btn" @click="$emit('edit-phase', phase)">
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
          <img :src="resolveAssetUrl(url)" :alt="phase.title" />
        </div>
      </div>

      <!-- Steps container -->
      <div class="steps-container" :class="{ 'no-select': isDragging }">
        <div
          v-for="(step, index) in localSteps"
          :key="step.id"
          class="step-drag-wrapper"
          :class="{ 'is-lifted': dragIdx === index }"
          :ref="el => { if (el) wrapperEls[index] = el as HTMLElement }"
          :style="getItemStyle(index)"
        >
          <StepRowComponent
            :step="step"
            @toggle="$emit('toggle-step', $event)"
            @open-lightbox="(url, caption) => $emit('open-lightbox', url, caption)"
            @edit-step="$emit('edit-step', $event)"
            @drag-handle-mousedown="startDrag($event, index)"
          />
        </div>

        <!-- Add Step Dashed Button -->
        <div v-if="isLoggedIn" class="add-step-row" @click="$emit('add-step')">
          <span class="plus-icon">+</span>
          <span class="btn-text">Add Step</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import StepRowComponent from '../components/step_row_component.vue';
import { resolveAssetUrl, API_BASE } from '../config';
import { useAuth } from '../composables/useAuth';

const { isLoggedIn, authFetch } = useAuth();

const GAP_PX = 24; // matches gap: 1.5rem in .steps-container

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
  order?: number;
  image_urls: string[];
}

const props = defineProps<{
  phase: Phase | null;
  steps: Step[];
}>();

const emit = defineEmits<{
  (e: 'toggle-step', id: string): void;
  (e: 'open-lightbox', url: string, caption: string): void;
  (e: 'edit-phase', phase: Phase): void;
  (e: 'add-step'): void;
  (e: 'edit-step', step: Step): void;
  (e: 'steps-reordered', steps: Step[]): void;
}>();

// ── Local reactive copy of steps ────────────────────────────────────────────
const localSteps = ref<Step[]>([...props.steps]);

watch(
  () => props.steps,
  (next) => {
    if (!isDragging.value) localSteps.value = [...next];
  },
);

// ── DOM refs & measurements ──────────────────────────────────────────────────
const wrapperEls = ref<HTMLElement[]>([]);
const cardHeights = ref<number[]>([]);

// ── Drag state ───────────────────────────────────────────────────────────────
const isDragging = ref(false);
const dragIdx    = ref(-1);   // which card is being dragged
const overIdx    = ref(-1);   // where it would land right now
const startY     = ref(0);    // mouse Y at drag start
const currentY   = ref(0);    // mouse Y right now

// ── Start drag (called from the handle mousedown emit) ───────────────────────
const startDrag = (e: MouseEvent, index: number) => {
  // Measure heights once before anything moves
  cardHeights.value = wrapperEls.value.map(el =>
    el ? el.getBoundingClientRect().height : 0
  );

  isDragging.value = true;
  dragIdx.value    = index;
  overIdx.value    = index;
  startY.value     = e.clientY;
  currentY.value   = e.clientY;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup',   onMouseUp);
};

// ── Track mouse ──────────────────────────────────────────────────────────────
const onMouseMove = (e: MouseEvent) => {
  currentY.value = e.clientY;
  const dy = e.clientY - startY.value;

  let newOver = dragIdx.value;

  if (dy < 0) {
    // Moving up — check each card above the dragged one
    let threshold = 0;
    for (let i = dragIdx.value - 1; i >= 0; i--) {
      const cellSize = cardHeights.value[i] + GAP_PX;
      threshold -= cellSize;
      // Swap when dragged card's centre passes the middle of card i
      if (dy < threshold + cellSize * 0.5) {
        newOver = i;
      }
    }
  } else {
    // Moving down — check each card below
    let threshold = 0;
    for (let i = dragIdx.value + 1; i < localSteps.value.length; i++) {
      const cellSize = cardHeights.value[i] + GAP_PX;
      threshold += cellSize;
      if (dy > threshold - cellSize * 0.5) {
        newOver = i;
      }
    }
  }

  overIdx.value = newOver;
};

// ── Release ──────────────────────────────────────────────────────────────────
const onMouseUp = () => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup',   onMouseUp);

  const from = dragIdx.value;
  const to   = overIdx.value;

  // Commit reorder first (before clearing state) so the last transform frame
  // renders with the new array, avoiding a visual jump
  if (from !== to && from !== -1) {
    const reordered = [...localSteps.value];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    localSteps.value = reordered;
    persistOrder(reordered);
    emit('steps-reordered', reordered);
  }

  isDragging.value = false;
  dragIdx.value    = -1;
  overIdx.value    = -1;
  startY.value     = 0;
  currentY.value   = 0;
};

// ── Per-card style (translateY) ───────────────────────────────────────────────
const getItemStyle = (index: number): Record<string, string> => {
  if (!isDragging.value) return {};

  const from     = dragIdx.value;
  const to       = overIdx.value;
  const dy       = currentY.value - startY.value;
  const liftedH  = (cardHeights.value[from] ?? 0) + GAP_PX;

  // The card being dragged follows the mouse — no CSS transition
  if (index === from) {
    return {
      transform:  `translateY(${dy}px)`,
      zIndex:     '100',
      transition: 'box-shadow 0.15s ease',
    };
  }

  // Other cards shift smoothly to fill / make room
  if (from < to) {
    // Dragging downward: cards between (from+1 … to) shift UP
    if (index > from && index <= to) {
      return { transform: `translateY(-${liftedH}px)` };
    }
  } else if (from > to) {
    // Dragging upward: cards between (to … from-1) shift DOWN
    if (index >= to && index < from) {
      return { transform: `translateY(${liftedH}px)` };
    }
  }

  return {};
};

// ── Persist order to backend ──────────────────────────────────────────────────
const persistOrder = async (ordered: Step[]) => {
  const items = ordered.map((step, idx) => ({ id: step.id, order: idx }));
  try {
    await authFetch(`${API_BASE}/steps/reorder`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items }),
    });
  } catch (err) {
    console.error('Failed to persist step order:', err);
  }
};

// Clean up if component unmounts while dragging
onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup',   onMouseUp);
});
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
  padding-left: 2rem;
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
  padding-left: 2rem;
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
  gap: 1.5rem;           /* = 24px = GAP_PX */
  padding-left: 2rem;    /* room for the absolutely-positioned drag handle */
}

/* Prevent text selection while dragging */
.no-select {
  user-select: none;
  cursor: grabbing;
}

/* Each draggable wrapper */
.step-drag-wrapper {
  position: relative;
  /* Smooth slide for non-dragged cards */
  transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1);
}

/* The card being dragged gets a lifted look */
.step-drag-wrapper.is-lifted :deep(.step-card) {
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55),
              0 0 0 1px rgba(99, 102, 241, 0.4);
  border-color: rgba(99, 102, 241, 0.4);
}

/* Add Step dashed styling */
.add-step-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border-radius: 1rem;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-muted);
  border: 2px dashed rgba(255, 255, 255, 0.12);
  transition: all var(--transition-speed) ease;
  background-color: transparent;
  margin-top: 0.5rem;
}

.add-step-row:hover {
  border-color: var(--accent-color);
  color: var(--text-primary);
  background-color: rgba(99, 102, 241, 0.03);
}

.plus-icon {
  font-size: 1.3rem;
  font-weight: bold;
}

@media (max-width: 900px) {
  .main-content {
    margin-left: 0;
    padding: 1.5rem;
  }
}
</style>
