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
