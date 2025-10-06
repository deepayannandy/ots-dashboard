<template>
  <div class="flex items-center gap-2">
    <UInput
      ref="input"
      v-model="term"
      placeholder="Search R1C3..."
      name="term"
    />
    <UButton @click="$emit('search', term.trim())"> Search </UButton>
  </div>
</template>

<script setup lang="ts">
const term = ref("");
const input = useTemplateRef("input");
const emit = defineEmits(["search"]);
defineShortcuts({
  meta_k: () => input?.value?.inputRef.focus(),
  enter: {
    usingInput: "term",
    handler: () => emit("search", term.value.trim()),
  },
});

console.log(input);
</script>
