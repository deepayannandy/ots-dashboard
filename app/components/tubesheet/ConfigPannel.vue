<template>
  <div v-if="!collapsed" class="">
    <UForm
      :schema="schema"
      :state="state"
      class="space-y-6"
      :class="{ 'opacity-50 pointer-events-none': disabled }"
      @submit="onSubmit"
    >
      <!-- Shape Selection -->
      <UFormField label="Project Shape" name="shape" class="w-full">
        <URadioGroup
          v-model="state.shape"
          indicator="hidden"
          variant="table"
          orientation="horizontal"
          default-value="CIRCLE"
          :items="shapes"
          class="w-full"
          :ui="{ item: 'w-full' }"
        >
          <template #label="{ item }">
            <div class="flex flex-col items-center justify-between">
              <UIcon :name="item.icon" class="size-5" />
              <span class="text-[8px] m-1">{{ item.label }}</span>
            </div>
          </template>
        </URadioGroup>
      </UFormField>

      <!-- Numeric Inputs -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Radius -->
        <UFormField v-if="showRadius" label="Radius (mm)" name="radius">
          <UInput
            v-model.number="state.outerDimension"
            type="number"
            placeholder="Enter radius"
          />
        </UFormField>

        <!-- Inner Radius -->
        <UFormField
          v-if="showInnerRadius"
          label="Inner Radius (mm)"
          name="innerRadius"
        >
          <UInput
            v-model.number="state.innerRadius"
            type="number"
            placeholder="Enter inner radius"
          />
        </UFormField>

        <!-- Length -->
        <UFormField v-if="showLengthWidth" label="Length (mm)" name="length">
          <UInput
            v-model.number="state.height"
            type="number"
            placeholder="Enter length"
          />
        </UFormField>

        <!-- Width -->
        <UFormField v-if="showLengthWidth" label="Width (mm)" name="width">
          <UInput
            v-model.number="state.width"
            type="number"
            placeholder="Enter width"
          />
        </UFormField>

        <!-- Sides -->
        <UFormField v-if="showSides" label="Sides" name="sides">
          <UInput
            v-model.number="state.outerDimension"
            type="number"
            placeholder="Enter sides count"
          />
        </UFormField>

        <!-- Padding -->
        <UFormField label="Padding (mm)" name="padding">
          <UInput
            v-model.number="state.padding"
            type="number"
            placeholder="Enter padding"
          />
        </UFormField>

        <!-- Pitch -->
        <UFormField label="Pitch (mm)" name="pitch">
          <UInput
            v-model.number="state.pitch"
            type="number"
            placeholder="Enter pitch"
          />
        </UFormField>
        <UFormField label="Tube Radius" name="tubeRadius">
          <UInput
            v-model.number="state.tubeRadius"
            type="number"
            placeholder="Enter Tube Radius"
          />
        </UFormField>
      </div>

      <!-- Arrangement -->
      <UFormField label="Arrangement" name="angle">
        <URadioGroup
          v-model="state.angle"
          indicator="hidden"
          type="number"
          orientation="horizontal"
          :items="arrangements"
          variant="table"
          :default-value="60"
          class="w-full"
          :ui="{ item: 'w-full' }"
        >
          <template #label="{ item }">
            <div class="flex flex-col items-center justify-between">
              <UIcon :name="item.icon" class="size-5" :class="item.iconClass" />
              <span class="text-xs">{{ item.label }}</span>
            </div>
          </template>
        </URadioGroup>
      </UFormField>

      <!-- Submit -->
      <div class="pt-4 flex justify-end">
        <UButton type="submit" block>
          Create
        </UButton>
      </div>
    </UForm>
  </div>
  <div v-else class="flex flex-col justify-between font-bold text-2xl text-center gap-10">
    <span>C</span>
    <span>O</span>
    <span>N</span>
    <span>F</span>
    <span>I</span>
    <span>G</span>
    <UDashboardSidebarCollapse />
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useUserSettings } from '~/stores/userSettings'
import type { ReactorConfig } from '~/types'

const { validateAndGenerate, setConfig, config } = useReactorGenerator()

defineProps<{ collapsed?: boolean, disabled?: boolean }>()

const { shapes } = useUserSettings()

const arrangements = [
  {
    label: '45°',
    value: 45,
    icon: 'i-lucide-square',
    iconClass: 'rotate-45'
  },
  { label: '90°', value: 90, icon: 'i-lucide-square', iconClass: 'rotate-0' },
  {
    label: '30°',
    value: 30,
    icon: 'i-lucide-triangle',
    iconClass: 'rotate-30'
  },
  {
    label: '60°',
    value: 60,
    icon: 'i-lucide-triangle',
    iconClass: 'rotate-0'
  }
]

// Validation Schema
const schema = z.object({
  shape: z.enum(['CIRCLE', 'RECTANGLE', 'HEXAGONE', 'DONUT']),
  outerDimension: z.number().optional(),
  innerRadius: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  padding: z.number().min(0),
  pitch: z.number().min(0),
  angle: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  property: z.string().optional()
})

type Schema = z.output<typeof schema>

// Default State
const state = reactive<ReactorConfig>({
  ...config.value
})

watch(() => state.angle, () => [30, 60].includes(state.angle) ? state.lattice = 'triangular' : state.lattice = 'square')

// Computed visibility logic
const showLengthWidth = computed(() =>
  ['RECTANGLE', 'HEXAGONE'].includes(state.shape!)
)
const showRadius = computed(() => ['CIRCLE', 'DONUT'].includes(state.shape!))
const showInnerRadius = computed(() => state.shape === 'DONUT')
const showSides = computed(() => state.shape === 'HEXAGONE')

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  setConfig(state)
  validateAndGenerate()
}
</script>
