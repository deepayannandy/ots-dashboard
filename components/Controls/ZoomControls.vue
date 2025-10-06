<template>
  <div class="flex items-center gap-2">
    <button
      @click="handleZoomIn"
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'zoomIn' ? 'bg-blue-700 scale-95' : 'bg-blue-500',
      ]"
    >
      ＋
    </button>
    <button
      @click="handleZoomOut"
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'zoomOut' ? 'bg-blue-700 scale-95' : 'bg-blue-500',
      ]"
    >
      －
    </button>
    <button
      @click="handlePan(-40, 0, 'left')"
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'left' ? 'bg-slate-600 scale-95' : 'bg-slate-400',
      ]"
    >
      ◀︎
    </button>
    <button
      @click="handlePan(40, 0, 'right')"
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'right' ? 'bg-slate-600 scale-95' : 'bg-slate-400',
      ]"
    >
      ▶︎
    </button>
    <button
      @click="handlePan(0, -40, 'up')"
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'up' ? 'bg-slate-600 scale-95' : 'bg-slate-400',
      ]"
    >
      ▲
    </button>
    <button
      @click="handlePan(0, 40, 'down')"
      :class="[
        'px-2 py-1 rounded text-white transition-all duration-150',
        activeButton === 'down' ? 'bg-slate-600 scale-95' : 'bg-slate-400',
      ]"
    >
      ▼
    </button>
    <button
      @click="handleReset"
      :class="[
        'px-2 py-1 rounded text-slate-800 transition-all duration-150',
        activeButton === 'reset' ? 'bg-slate-300 scale-95' : 'bg-slate-200',
      ]"
    >
      Center
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const emit = defineEmits(["zoomIn", "zoomOut", "pan", "reset"]);
const activeButton = ref<string | null>(null);

function triggerActive(key: string) {
  activeButton.value = key;
  setTimeout(() => (activeButton.value = null), 150);
}

function handleZoomIn() {
  emit("zoomIn");
  triggerActive("zoomIn");
}
function handleZoomOut() {
  emit("zoomOut");
  triggerActive("zoomOut");
}
function handlePan(x: number, y: number, key: string) {
  emit("pan", x, y);
  triggerActive(key);
}
function handleReset() {
  emit("reset");
  triggerActive("reset");
}

defineShortcuts({
  ArrowUp: () => handlePan(0, -40, "up"),
  ArrowDown: () => handlePan(0, 40, "down"),
  ArrowLeft: () => handlePan(-40, 0, "left"),
  ArrowRight: () => handlePan(40, 0, "right"),
  "+": handleZoomIn,
  "-": handleZoomOut,
  "0": handleReset,
});
</script>
