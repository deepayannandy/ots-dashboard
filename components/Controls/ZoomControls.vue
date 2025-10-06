<template>
  <div class="flex items-center gap-2">
    <button @click="$emit('zoomIn')" class="px-2 py-1 rounded bg-blue-500 text-white">＋</button>
    <button @click="$emit('zoomOut')" class="px-2 py-1 rounded bg-blue-500 text-white">－</button>
    <button @click="$emit('pan', -40, 0)" class="px-2 py-1 rounded bg-slate-400 text-white">◀︎</button>
    <button @click="$emit('pan', 40, 0)" class="px-2 py-1 rounded bg-slate-400 text-white">▶︎</button>
    <button @click="$emit('pan', 0, -40)" class="px-2 py-1 rounded bg-slate-400 text-white">▲</button>
    <button @click="$emit('pan', 0, 40)" class="px-2 py-1 rounded bg-slate-400 text-white">▼</button>
    <button @click="$emit('reset')" class="px-2 py-1 rounded bg-slate-200 text-slate-800">Center</button>
  </div>
</template>
