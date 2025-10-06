<template>
  <div class="flex items-center gap-2">
    <input v-model="term" @keyup.enter="$emit('search', term.trim())" placeholder="Search R1C3..." class="border p-2 rounded-md" />
    <button @click="$emit('search', term.trim())" class="bg-blue-500 text-white px-3 py-2 rounded-md">Search</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const term = ref('')
</script>
