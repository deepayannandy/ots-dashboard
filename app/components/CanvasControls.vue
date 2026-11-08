<template>
  <div
    class="flex flex-col items-center gap-1 rounded-lg p-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border border-neutral-200 dark:border-neutral-700 shadow-lg"
  >
    <UTooltip
      v-for="control in controls"
      :key="control.key"
      :text="control.label"
      :content="{ side: 'right' }"
    >
      <UButton
        :icon="control.icon"
        :aria-label="control.label"
        :color="control.key === 'drag' && dragMode ? 'primary' : 'neutral'"
        :variant="control.key === 'drag' && dragMode ? 'soft' : 'ghost'"
        size="lg"
        square
        @click="control.action"
      />
    </UTooltip>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  dragMode?: boolean
}>()

const emit = defineEmits(['zoomIn', 'zoomOut', 'reset', 'fitToScreen', 'toggleDrag'])

const controls = [
  { key: 'zoomIn', label: 'Zoom in', icon: 'i-lucide-plus', action: () => emit('zoomIn') },
  { key: 'zoomOut', label: 'Zoom out', icon: 'i-lucide-minus', action: () => emit('zoomOut') },
  { key: 'reset', label: 'Reset view', icon: 'i-lucide-rotate-ccw', action: () => emit('reset') },
  { key: 'fitToScreen', label: 'Fit to screen', icon: 'i-lucide-scan', action: () => emit('fitToScreen') },
  { key: 'drag', label: 'Drag to pan', icon: 'i-lucide-move', action: () => emit('toggleDrag') }
]
</script>
