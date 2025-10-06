<template>
  <UCard class="w-96 flex-shrink-0 overflow-auto shadow-xl rounded-2xl border border-slate-200 p-4">
    <template #header>
      <div class="text-xl font-semibold text-slate-800">Reactor Configuration</div>
    </template>

    <UForm :state="local" class="space-y-6">
      <!-- Reactor Shape -->
      <UFormField label="Reactor Shape">
        <USelectMenu v-model="local.shape" :items="[
          'circle',
          'square',
          'rectangle',
          'hexagon',
          'doughnut',
        ]" @update:modelValue="emitChange" />
      </UFormField>

      <!-- Shape Dimensions -->
      <template v-if="local.shape === 'rectangle'">
        <UFormField label="Reactor Width">
          <UInput v-model.number="local.width" type="number" @input="emitChange" />
        </UFormField>
        <UFormField label="Reactor Height">
          <UInput v-model.number="local.height" type="number" @input="emitChange" />
        </UFormField>
      </template>

      <template v-if="local.shape === 'doughnut'">
        <UFormField label="Inner Radius">
          <UInput v-model.number="local.innerRadius" type="number" @input="emitChange" />
        </UFormField>
      </template>

      <UFormField label="Reactor Dimension / Radius">
        <UInput v-model.number="local.outerDimension" type="number" @input="emitChange" />
      </UFormField>

      <UFormField label="Tube Radius">
        <UInput v-model.number="local.tubeRadius" type="number" @input="emitChange" />
      </UFormField>

      <UFormField label="Reactor Padding">
        <UInput v-model.number="local.padding" type="number" @input="emitChange" />
        <template #description>
          <span class="text-xs text-slate-500">Padding size: {{ local.padding }} units</span>
        </template>
      </UFormField>

      <div class="grid grid-cols-2 gap-3">
        <UFormField label="Reactor Color">
          <UInput type="color" v-model="local.shapeColor" @input="emitChange" class="h-10 p-1" />
        </UFormField>
        <UFormField label="Padding Color">
          <UInput type="color" v-model="local.paddingColor" @input="emitChange" class="h-10 p-1" />
        </UFormField>
      </div>

      <UFormField label="Pitch">
        <UInput v-model.number="local.pitch" type="number" @input="emitChange" />
      </UFormField>

      <UFormField label="Arrangement">
        <USelectMenu v-model="local.lattice" :options="[
          { label: 'Triangular (30° / 60°)', value: 'triangular' },
          { label: 'Square (45° / 90°)', value: 'square' }
        ]" @update:modelValue="emitChange" />
      </UFormField>

      <!-- Tube actions -->
      <div class="space-y-3">
        <div class="text-sm font-medium">Selected Tube Actions</div>
        <div class="grid grid-cols-2 gap-3">
          <UButton @click="$emit('cap')">Cap</UButton>
          <UInput v-model="local.capColor" type="color" class="rounded-md border p-1 h-10" />
          <UButton @click="$emit('block')">Block</UButton>
          <UButton @click="$emit('delete')">Delete</UButton>
        </div>
      </div>

      <!-- Bottom buttons -->
      <div class="flex flex-wrap gap-3 mt-4">
        <UButton @click="$emit('generate')">Generate</UButton>
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
import { reactive, watch } from 'vue'
import type { ReactorConfig } from '@/types'

const props = defineProps<{ model: ReactorConfig; tubesCount: number; error: string | null }>()
const emit = defineEmits(['update:model', 'generate', 'cap', 'block', 'delete', 'download', 'copyJson'])

const local = reactive({ ...props.model, capColor: '#facc15' })

watch(() => props.model, (v) => Object.assign(local, v))

function emitChange() {
  const out: ReactorConfig = {
    shape: local.shape,
    outerDimension: local.outerDimension,
    width: local.width,
    height: local.height,
    innerRadius: local.innerRadius,
    tubeRadius: local.tubeRadius,
    padding: local.padding,
    shapeColor: local.shapeColor,
    paddingColor: local.paddingColor,
    pitch: local.pitch,
    lattice: local.lattice,
  }
  emit('update:model', out)
}
</script>
