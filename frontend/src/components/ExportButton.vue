<template>
  <button
    class="fixed-btn"
    @click="downloadMarkdown"
    :disabled="downloading"
    title="Export plan as Markdown"
  >
    <img src="/markdown.svg" class="btn-icon" alt="Export Markdown" />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API_BASE } from '../config';

const downloading = ref(false);

const downloadMarkdown = async (): Promise<void> => {
  downloading.value = true;
  try {
    const res = await fetch(`${API_BASE}/phases/export`);
    if (!res.ok) throw new Error('Export failed');

    const blob = await res.blob();
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = `plan-${datePart}_${timePart}.md`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Markdown export failed:', err);
  } finally {
    downloading.value = false;
  }
};

defineExpose({ downloadMarkdown });
</script>
