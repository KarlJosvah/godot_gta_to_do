<template>
  <div 
    :class="['nav-item', { active: isActive }]"
    @click="$emit('select')"
  >
    <span class="nav-item-title">{{ phase.title }}</span>
    <span :class="['nav-badge', phase.done === 1 ? 'done' : 'todo']">
      {{ phase.done === 1 ? 'done' : 'todo' }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Phase {
  id: string;
  title: string;
  description: string;
  done: number;
  image_urls: string[];
}

defineProps<{
  phase: Phase;
  isActive: boolean;
}>();

defineEmits<{
  (e: 'select'): void;
}>();
</script>

<style scoped>
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
</style>
