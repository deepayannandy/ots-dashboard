<template>
  <g class="ruler">
    <template v-for="x in verticalLines" :key="'x' + x">
      <line :x1="x" y1="0" :x2="x" :y2="height" stroke="#e2e8f0" stroke-width="0.5" />
      <text :x="x + 2" y="12" fill="#64748b" font-size="8">{{ (x / 10).toFixed(1) }} u</text>
    </template>

    <template v-for="y in horizontalLines" :key="'y' + y">
      <line x1="0" :y1="y" :x2="width" :y2="y" stroke="#e2e8f0" stroke-width="0.5" />
      <text x="2" :y="y - 2" fill="#64748b" font-size="8">{{ (y / 10).toFixed(1) }} u</text>
    </template>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ width: number; height: number }>()
const step = 50

const verticalLines = computed(() =>
  Array.from({ length: Math.ceil(props.width / step) + 1 }, (_, i) => i * step)
)
const horizontalLines = computed(() =>
  Array.from({ length: Math.ceil(props.height / step) + 1 }, (_, i) => i * step)
)
</script>

<style>
.ruler line {
  pointer-events: none;
}
.ruler text {
  pointer-events: none;
  user-select: none;
}
</style>
