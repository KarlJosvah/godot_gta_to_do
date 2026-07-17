<template>
  <aside class="sidebar" :style="{ width: sidebarWidth + 'px' }">
    <div class="sidebar-header">
      <div class="logo">GTA ROADMAP</div>
    </div>
    <nav class="phases-nav">

      <PhaseRowComponent 
        v-for="phase in phases" 
        :key="phase.id"
        :phase="phase"
        :isActive="activePhaseId === phase.id"
        @select="$emit('select-phase', phase.id)"
      />
      
      <div v-if="isLoggedIn" class="add-phase-row" @click="$emit('add-phase')">
        <span class="plus-icon">+</span>
        <span class="btn-text">Add Phase</span>
      </div>
    </nav>

    <!-- Resize Handle -->
    <div class="resize-handle" @mousedown="startResize"></div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import PhaseRowComponent from '../components/phase_row_component.vue';
import { useAuth } from '../composables/useAuth';

const { isLoggedIn } = useAuth();

interface Phase {
  id: string;
  title: string;
  description: string;
  done: number;
  image_urls: string[];
}

defineProps<{
  phases: Phase[];
  activePhaseId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select-phase', id: string): void;
  (e: 'add-phase'): void;
  (e: 'width-change', width: number): void;
}>();

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;

const sidebarWidth = ref(DEFAULT_WIDTH);
let isResizing = false;

const startResize = (e: MouseEvent) => {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
};

const onMouseMove = (e: MouseEvent) => {
  if (!isResizing) return;
  const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
  sidebarWidth.value = newWidth;
  // Update global CSS variable so main content margin adjusts automatically
  document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
  emit('width-change', newWidth);
};

const onMouseUp = () => {
  if (!isResizing) return;
  isResizing = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

onMounted(() => {
  // Sync CSS variable to match the actual initial width
  document.documentElement.style.setProperty('--sidebar-width', DEFAULT_WIDTH + 'px');
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
});
</script>

<style scoped>
.sidebar {
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 10;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  /* Smooth width transition when not actively dragging */
  transition: width 0s;
}

.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.2);
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
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.phases-nav {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Add Phase dashed layout */
.add-phase-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-muted);
  border: 2px dashed rgba(255, 255, 255, 0.12);
  transition: all var(--transition-speed) ease;
  background-color: transparent;
  margin-bottom: 0.5rem;
  white-space: nowrap;
}

.add-phase-row:hover {
  border-color: var(--accent-color);
  color: var(--text-primary);
  background-color: rgba(99, 102, 241, 0.04);
}

.plus-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

/* Resize handle */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background var(--transition-speed) ease;
  z-index: 20;
}

.resize-handle:hover,
.resize-handle:active {
  background: var(--accent-color);
  opacity: 0.5;
}

@media (max-width: 900px) {
  .sidebar {
    width: 100% !important;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .resize-handle {
    display: none;
  }
}
</style>
