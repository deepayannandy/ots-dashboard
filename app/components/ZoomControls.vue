<template>
  <div class="flex items-center gap-1.5 gradient-card rounded-xl p-2 elevation-3 border border-neutral-200/60 dark:border-neutral-700/40">
    <!-- <button
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'zoomIn' ? 'bg-primary-700 scale-95' : 'bg-primary-500'
      ]"
      @click="handleZoomIn"
    >
      ＋
    </button>
    <button
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'zoomOut' ? 'bg-primary-700 scale-95' : 'bg-primary-500'
      ]"
      @click="handleZoomOut"
    >
      －
    </button>
    <button
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'left' ? 'bg-slate-600 scale-95' : 'bg-slate-400'
      ]"
      @click="handlePan(-40, 0, 'left')"
    >
      ◀︎
    </button>
    <button
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'right' ? 'bg-slate-600 scale-95' : 'bg-slate-400'
      ]"
      @click="handlePan(40, 0, 'right')"
    >
      ▶︎
    </button>
    <button
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'up' ? 'bg-slate-600 scale-95' : 'bg-slate-400'
      ]"
      @click="handlePan(0, -40, 'up')"
    >
      ▲
    </button>
    <button
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'down' ? 'bg-slate-600 scale-95' : 'bg-slate-400'
      ]"
      @click="handlePan(0, 40, 'down')"
    >
      ▼
    </button> -->
    <button
      v-if="!hideRotation"
      :class="[
        'px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border',
        activeButton === 'rotateLeft'
          ? 'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 scale-95'
          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-150 dark:hover:bg-neutral-750'
      ]"
      @click="handleRotateLeft"
    >
      ↺
    </button>
    <button
      v-if="!hideRotation"
      :class="[
        'px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border',
        activeButton === 'rotateRight'
          ? 'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 scale-95'
          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-150 dark:hover:bg-neutral-750'
      ]"
      @click="handleRotateRight"
    >
      ↻
    </button>
    <div v-if="!hideRotation" class="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
    <button
      :class="[
        'px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border',
        activeButton === 'reset'
          ? 'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 scale-95'
          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-150 dark:hover:bg-neutral-750'
      ]"
      @click="handleReset"
    >
      Center
    </button>
    <button
      :class="[
        'px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border',
        activeButton === 'fitToScreen'
          ? 'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 scale-95'
          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-150 dark:hover:bg-neutral-750'
      ]"
      title="Fit to Screen"
      @click="handleFitToScreen"
    >
      ⛶
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

defineProps<{
  hideRotation?: boolean
}>()

const emit = defineEmits(['zoomIn', 'zoomOut', 'pan', 'reset', 'rotateLeft', 'rotateRight', 'fitToScreen'])
const activeButton = ref<string | null>(null)

function triggerActive(key: string) {
  activeButton.value = key
  setTimeout(() => (activeButton.value = null), 150)
}

function handleZoomIn() {
  emit('zoomIn')
  triggerActive('zoomIn')
}
function handleZoomOut() {
  emit('zoomOut')
  triggerActive('zoomOut')
}
function handlePan(x: number, y: number, key: string) {
  emit('pan', x, y)
  triggerActive(key)
}
function handleRotateLeft() {
  emit('rotateLeft')
  triggerActive('rotateLeft')
}
function handleRotateRight() {
  emit('rotateRight')
  triggerActive('rotateRight')
}
function handleReset() {
  emit('reset')
  triggerActive('reset')
}
function handleFitToScreen() {
  emit('fitToScreen')
  triggerActive('fitToScreen')
}

defineShortcuts({
  'ArrowUp': () => handlePan(0, -40, 'up'),
  'ArrowDown': () => handlePan(0, 40, 'down'),
  'ArrowLeft': () => handlePan(-40, 0, 'left'),
  'ArrowRight': () => handlePan(40, 0, 'right'),
  '+': handleZoomIn,
  '-': handleZoomOut,
  '0': handleReset,
  '[': handleRotateLeft,
  ']': handleRotateRight
})
</script>
