<template>
  <UCard
    class="flex-shrink-0 rounded-none border-none overflow-scroll h-screen"
  >
    <template #header>
      <div class="text-xl font-semibold text-slate-800">
        Reactor Configuration
      </div>
    </template>

    <UForm class="space-y-6">
      <!-- Reactor Shape -->
      <UFormField label="Reactor shape" class="w-full">
        <UFieldGroup
          label="Reactor Shape"
          class="space-x-2 justify-between w-full"
          variant="outline"
        >
          <UButton
            icon="i-mdi-circle"
            @click="localState.shape = 'circle'"
            :variant="localState?.shape === 'circle' ? 'solid' : 'outline'"
          >
          </UButton>
          <UButton
            icon="i-mdi-square"
            @click="localState.shape = 'square'"
            :variant="localState?.shape === 'square' ? 'solid' : 'outline'"
          >
          </UButton>
          <UButton
            icon="i-mdi-rectangle"
            @click="localState.shape = 'rectangle'"
            :variant="localState?.shape === 'rectangle' ? 'solid' : 'outline'"
          ></UButton>
          <UButton
            icon="i-mdi-hexagon"
            @click="localState.shape = 'hexagon'"
            :variant="localState?.shape === 'hexagon' ? 'solid' : 'outline'"
          >
          </UButton>
          <UButton
            icon="lucide:torus"
            @click="localState.shape = 'doughnut'"
            :variant="localState?.shape === 'doughnut' ? 'solid' : 'outline'"
          >
          </UButton>
        </UFieldGroup>
      </UFormField>

      <!-- Shape Dimensions -->
      <template v-if="localState.shape === 'rectangle'">
        <UFormField class="w-full" label="Reactor Width">
          <UInputNumber
            v-model.number="localState.width"
            type="number"
            class="w-full"
          />
        </UFormField>
        <UFormField class="w-full" label="Reactor Height">
          <UInputNumber
            v-model.number="localState.height"
            type="number"
            class="w-full"
          />
        </UFormField>
      </template>

      <template v-if="localState.shape === 'doughnut'">
        <UFormField class="w-full" label="Inner Radius">
          <UInputNumber
            v-model.number="localState.innerRadius"
            type="number"
            class="w-full"
          />
        </UFormField>
      </template>

      <UFormField class="w-full" label="Reactor Dimension / Radius">
        <UInputNumber
          v-model.number="localState.outerDimension"
          type="number"
          class="w-full"
        />
      </UFormField>

      <UFormField class="w-full" label="Tube Radius">
        <UInputNumber
          v-model.number="localState.tubeRadius"
          type="number"
          class="w-full"
        />
      </UFormField>

      <UFormField class="w-full" label="Reactor Padding">
        <UInputNumber
          v-model.number="localState.padding"
          type="number"
          class="w-full"
        />
        <template #description>
          <span class="text-xs text-slate-500"
            >Padding size: {{ localState.padding }} units</span
          >
        </template>
      </UFormField>

      <div class="grid grid-cols-2 gap-3">
        <UFormField class="w-full" label="Reactor Color">
          <UInput
            type="color"
            v-model="localState.shapeColor"
            class="h-10 p-1 w-full"
          />
        </UFormField>
        <UFormField class="w-full" label="Padding Color">
          <UInput
            type="color"
            v-model="localState.paddingColor"
            class="h-10 p-1 w-full"
          />
        </UFormField>
      </div>

      <UFormField class="w-full" label="Pitch">
        <UInputNumber
          v-model.number="localState.pitch"
          type="number"
          class="w-full"
        />
      </UFormField>

      <UFormField class="w-full" label="Arrangement">
        <UFieldGroup
          label="Reactor Shape"
          class="space-x-2 justify-between w-full"
          variant="outline"
        >
          <UButton
            icon="i-mdi-triangle"
            @click="localState.lattice = 'triangular'"
            label=" 30° / 60°"
            :variant="
              localState?.lattice === 'triangular' ? 'solid' : 'outline'
            "
          >
          </UButton>
          <UButton
            icon="i-mdi-square"
            @click="localState.lattice = 'square'"
            label=" 45° / 90°"
            :variant="localState?.lattice === 'square' ? 'solid' : 'outline'"
          >
          </UButton>
        </UFieldGroup>
      </UFormField>

      <!-- Tube actions -->
      <div class="space-y-3">
        <div class="text-sm font-medium">Selected Tube Actions</div>
        <div class="grid grid-cols-2 gap-3">
          <UButton @click="$emit('cap', localState.capColor)">Cap</UButton>
          <UInput
            v-model="localState.capColor"
            type="color"
            class="rounded-md border p-1 h-10"
          />
          <UButton @click="$emit('block')">Block</UButton>
          <UButton @click="$emit('delete')">Delete</UButton>
        </div>
      </div>

      <!-- Bottom buttons -->
      <div class="flex flex-wrap gap-3 mt-4">
        <UButton @click="applyConfig">Generate</UButton>
        <UButton @click="$emit('download')">Download SVG</UButton>
        <UButton variant="soft" @click="$emit('copyJson')">Copy JSON</UButton>
      </div>

      <div class="text-sm mt-3 font-semibold">
        Tube count: <span>{{ tubesCount }}</span>
      </div>
      <div v-if="error" class="text-xs text-red-600 mt-1">{{ error }}</div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import type { ReactorConfig } from "@/types";

const props = defineProps<{
  model: ReactorConfig;
  tubesCount: number;
  error: string | null;
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
