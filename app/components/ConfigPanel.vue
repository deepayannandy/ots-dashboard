<template>
  <UCard
    class="flex-shrink-0 rounded-none border-none ring-none ring-0 overflow-y-auto"
  >
    <UForm class="space-y-3">
      <UFormField label="Reactor Shape" class="w-full">
        <UFieldGroup class="flex justify-between w-full" variant="outline">
          <UButton
            icon="i-mdi-circle-outline"
            square
            size="lg"
            :variant="localState.shape === 'circle' ? 'solid' : 'outline'"
            @click="localState.shape = 'circle'"
            :aria-label="'Circle'"
          />
          <UButton
            icon="i-mdi-square-outline"
            square
            size="lg"
            :variant="localState.shape === 'square' ? 'solid' : 'outline'"
            @click="localState.shape = 'square'"
            :aria-label="'Square'"
          />
          <UButton
            icon="i-mdi-rectangle-outline"
            square
            size="lg"
            :variant="localState.shape === 'rectangle' ? 'solid' : 'outline'"
            @click="localState.shape = 'rectangle'"
            :aria-label="'Rectangle'"
          />
          <UButton
            icon="i-mdi-hexagon-outline"
            square
            size="lg"
            :variant="localState.shape === 'hexagon' ? 'solid' : 'outline'"
            @click="localState.shape = 'hexagon'"
            :aria-label="'Hexagon'"
          />
          <UButton
            icon="i-lucide-torus"
            square
            size="lg"
            :variant="localState.shape === 'doughnut' ? 'solid' : 'outline'"
            @click="localState.shape = 'doughnut'"
            :aria-label="'Doughnut'"
          />
        </UFieldGroup>
      </UFormField>

      <!-- Dimensions -->
      <template v-if="localState.shape === 'rectangle'">
        <UFormField label="Width">
          <UInputNumber :step="0.5" v-model="localState.width" type="number" />
        </UFormField>
        <UFormField label="Height">
          <UInputNumber :step="0.5" v-model="localState.height" type="number" />
        </UFormField>
      </template>

      <template v-if="localState.shape === 'doughnut'">
        <UFormField label="Inner Radius">
          <UInputNumber
            :step="0.5"
            v-model="localState.innerRadius"
            type="number"
          />
        </UFormField>
      </template>

      <UFormField label="Reactor Dimension / Radius">
        <UInputNumber
          :step="0.5"
          v-model="localState.outerDimension"
          type="number"
        />
      </UFormField>

      <UFormField label="Tube Radius">
        <UInputNumber
          :step="0.5"
          v-model="localState.tubeRadius"
          type="number"
        />
      </UFormField>

      <UFormField label="Reactor Padding">
        <UInputNumber :step="0.5" v-model="localState.padding" type="number" />
        <template #description>
          <span class="text-xs text-slate-500"
            >Size: {{ localState.padding }} units</span
          >
        </template>
      </UFormField>

      <div class="grid grid-cols-2 gap-3">
        <UFormField label="Reactor Color">
          <UInput
            type="color"
            v-model="localState.shapeColor"
            class="h-10 p-1 w-full"
          />
        </UFormField>
        <UFormField label="Padding Color">
          <UInput
            type="color"
            v-model="localState.paddingColor"
            class="h-10 p-1 w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Pitch">
        <UInputNumber :step="0.5" v-model="localState.pitch" type="number" />
      </UFormField>

      <UFormField label="Arrangement">
        <UFieldGroup class="flex justify-between w-full" variant="outline">
          <UButton
            icon="i-mdi-triangle-outline"
            square
            :variant="localState.lattice === 'triangular' ? 'solid' : 'outline'"
            @click="localState.lattice = 'triangular'"
            :aria-label="'Triangular (30° / 60°)'"
          />
          <UButton
            icon="i-mdi-square"
            square
            :variant="localState.lattice === 'square' ? 'solid' : 'outline'"
            @click="localState.lattice = 'square'"
            :aria-label="'Square (45° / 90°)'"
          />
        </UFieldGroup>
      </UFormField>

      <UFormField label="Angle">
        <UFieldGroup class="flex justify-between w-full" variant="outline">
          <UButton
            v-for="deg in localState.lattice === 'square' ? [45, 90] : [30, 60]"
            :key="deg"
            :label="`${deg}°`"
            :variant="localState.angle === deg ? 'solid' : 'outline'"
            @click="localState.angle = deg as 30 | 45 | 60 | 90"
          />
        </UFieldGroup>
      </UFormField>

      <!-- Tube Actions -->
      <div class="space-y-3">
        <div class="text-sm font-medium text-slate-700">Tube Actions</div>
        <div class="grid grid-cols-4 gap-3">
          <UButton
            icon="solar:square-academic-cap-2-bold-duotone"
            variant="outline"
            class="justify-center"
            :style="{ color: localState.capColor }"
            @click="$emit('cap', localState.capColor)"
          />

          <UInput v-model="localState.capColor" type="color" />

          <UButton
            icon="i-mdi-block-helper"
            variant="outline"
            class="justify-center"
            @click="$emit('block')"
          />

          <UButton
            icon="i-mdi-delete-outline"
            square
            color="error"
            class="justify-center"
            @click="$emit('delete')"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3 mt-6 justify-between">
        <UButton icon="i-mdi-play" @click="applyConfig">Generate</UButton>
        <UButton icon="i-mdi-download" @click="$emit('download')">SVG</UButton>
        <UButton
          icon="i-mdi-content-copy"
          variant="soft"
          @click="$emit('copyJson')"
          >JSON</UButton
        >
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import type { ReactorConfig } from "@/types";

const props = defineProps<{
  model: ReactorConfig;
  tubesCount: number;
}>();

const emit = defineEmits([
  "update:model",
  "generate",
  "cap",
  "block",
  "delete",
  "download",
  "copyJson",
]);

const localState = reactive({
  ...props.model,
  capColor: "#facc15",
  angle: props.model.angle as 30 | 45 | 60 | 90 | undefined,
});

watch(
  () => props.model,
  (v) => Object.assign(localState, v)
);

function applyConfig() {
  emit("update:model", { ...localState });
  emit("generate");
}
</script>
