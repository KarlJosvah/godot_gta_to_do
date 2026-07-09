<template>
  <aside class="sidebar">
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
      
      <!-- Add Phase Dashed Row -->
      <div class="add-phase-row" @click="$emit('add-phase')">
        <span class="plus-icon">+</span>
        <span class="btn-text">Add Phase</span>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import PhaseRowComponent from '../components/phase_row_component.vue';

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

defineEmits<{
  (e: 'select-phase', id: string): void;
  (e: 'add-phase'): void;
}>();
</script>

<style scoped>
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

@media (max-width: 900px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
}
</style>
