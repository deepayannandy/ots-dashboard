<template>
  <!-- Modal -->
  <UModal
    v-model:open="open"
    :description="`Status: ${getLabel(localState.status)}`"
  >
    <template #body>
      <UForm :state="localState" class="grid grid-cols-1 gap-2">
        <UFieldGroup class="grid grid-cols-2  w-full">
          <UBadge variant="ghost" class="text-xl">
            Date
          </UBadge>
          <UInputDate v-model="localState.date" class="rounded-l-none" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <UBadge variant="ghost" class="text-xl">
            Project Start Date
          </UBadge>
          <UInputDate v-model="localState.projectStartDate" class="rounded-l-none" />
        </UFieldGroup>

        <UFieldGroup class="grid grid-cols-2  w-full">
          <UBadge variant="ghost" class="text-xl">
            Equipment ID
          </UBadge>
          <UInput v-model="localState.equipmentId" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <UBadge variant="ghost" class="text-xl">
            Equipment Name
          </UBadge>
          <USelect v-model="localState.equipmentName" :items="tubeSheetTypeItems" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <UBadge variant="ghost" class="text-xl">
            Type of Phases
          </UBadge>
          <USelect
            v-model="localState.typeOfPhases"
            :items="typeOfPhases"
            multiple
            :ui="{ content: 'min-w-fit' }"
            class="w-full"
          />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <UBadge variant="ghost" class="text-xl">
            Client Name
          </UBadge>
          <UInput v-model="localState.clientName" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full place-items-start">
          <UBadge variant="ghost" class="text-xl">
            Client Address
          </UBadge>
          <UTextarea v-model="localState.clientAddress" class="w-full" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <UBadge variant="ghost" class="text-xl">
            Material
          </UBadge>
          <UInput v-model="localState.material" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <UBadge variant="ghost" class="text-xl">
            Total No Of Tubes
          </UBadge>
          <UInput v-model="localState.totalNoOfTubes" />
        </UFieldGroup>
        <UDivider />
        <UFieldGroup class="grid grid-cols-2  w-full">
          <UBadge variant="ghost" class="text-xl">
            Number of Cameras
          </UBadge>
          <UInput v-model="localState.numberOfCameras" />
        </UFieldGroup>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-4 w-full">
        <UButton label="Reset" variant="ghost" @click="open = false" />
        <UButton
          :label="isEditing ? 'Save' : 'Save'"
          color="primary"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>

  <!-- Add New Card -->
  <UPageCard
    v-if="addNew"
    class="cursor-pointer border border-dashed ring-0 border-neutral-200 "
    @click="open = true"
  >
    <div class="flex flex-col items-center justify-center gap-2 text-neutral-400 dark:text-neutral-500">
      <UIcon name="i-lucide-plus" class="size-8 opacity-60 group-hover:opacity-100" />
      <p class="text-sm font-medium opacity-70">
        Add Tube Sheet
      </p>
    </div>
  </UPageCard>

  <!-- Tube Sheet Card -->
  <UPageCard
    v-else
    :spotlight-color="statusColor(localState.status)"
    spotlight
    class="cursor-pointer"
    @click="open = true"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
        {{ localState.clientName }}
      </h3>
      <UBadge :color="statusColor(localState.status)" variant="soft">
        {{ getLabel(localState.status) }}
      </UBadge>
    </div>

    <!-- Info -->
    <div class="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
      <p><span class="font-medium">Site:</span> {{ localState.clientAddress }}</p>
      <p><span class="font-medium">Type:</span> {{ readableType(localState.type) }}</p>
      <p class="text-[11px] opacity-70">
        Created: {{ formatDate(localState.createdAt) }}<br>
        Updated: {{ formatDate(localState.updatedAt) }}
      </p>
    </div>

    <!-- Progress -->
    <div class="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
      <div
        class="h-full transition-all duration-500"
        :class="{
          'bg-primary': localState.status === 'SHAPE_CREATION',
          'bg-secondary': localState.status === 'SHAPE_CREATED',
          'bg-warning': localState.status === 'UNDER_SURVEY',
          'bg-error': localState.status === 'IDLE',
          'bg-neutral': !localState.status
        }"
        :style="{ width: `${progressValue(localState.status)}%` }"
      />
    </div>

    <!-- Action Button -->
    <UButton
      block
      size="xs"
      :label="getLabel(localState.status)"
      :color="statusColor(localState.status)"
      variant="outline"
      class="mt-auto"
      @click.stop="handleNextStep(localState.status, localState._id, localState.reactorId)"
    />
    <UButton
      v-if="localState.status !=='SHAPE_CREATION'"
      block
      size="xs"
      label="Edit Shape & Congif"
      :color="statusColor(localState.status)"
      variant="outline"
      class="mt-auto"
      @click.stop="navigateTo(`/create-reactor/${localState._id}/${localState.reactorId??''}`)"
    />
  </UPageCard>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useTubeSheets } from '@/stores/tubesheets'
import type { TubeSheet } from '@/types'
import { USelect } from '#components'

const props = defineProps<{ modelValue: Partial<TubeSheet>, addNew?: boolean }>()
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const store = useTubeSheets()

const tubeSheetTypeItems = [
  { label: 'Heat Exchanger', value: 'HEAT_EXCHANGER' },
  { label: 'Boiler', value: 'BOILER' },
  { label: 'EOEG Reactor', value: 'EOEG_REACTOR' },
  { label: 'Glycol', value: 'GLYCOL_REACTOR' },
  { label: 'Aerylic Reactor', value: 'AERYLIC_REACTOR' },
  { label: 'Gas Cooler', value: 'GAS_COOLER' }
]

const typeOfPhases = [
  { label: 'Initial tube sheet inspection top and bottom. Front and back', value: 'INITIAL_TUBE_SHEET_INSPECTION' },
  { label: 'High pressure cleaning- water and nozzle entry detection', value: 'HIGH_PRESSURE_CLEANING' },
  { label: 'Eddy current or RFT probe detection', value: 'EDDY_CURRENT_OR_RFT_PROBE_DETECTION' },
  { label: 'Boroscope inspection', value: 'BOROSCOPE_INSPECTION' },
  { label: 'Unloading of the catalyst', value: 'UNLOADING_OF_CATALYST' },
  { label: 'Foam swab cleaning and detection.', value: 'FOAM_SWAB_CLEANING_AND_DETECTION' },
  { label: 'Mechanical cleaner detection', value: 'MECHANICAL_CLEANER_DETECTION' },
  { label: 'Sand blasting- sand', value: 'SAND_BLASTING_SAND' },
  { label: 'Sand Blasting- sand blasting nozzle detection', value: 'SAND_BLASTING_NOZZLE_DETECTION' },
  { label: 'Color cap tracking', value: 'COLOR_CAP_TRACKING' },
  { label: 'Fish tape tracking', value: 'FISH_TAPE_TRACKING' },
  { label: 'Air lancing tip tracking', value: 'AIR_LANCING_TIP_TRACKING' },
  { label: 'Spring removal Tracking', value: 'SPRING_REMOVAL_TRACKING' },
  { label: 'Soring insertion Tracking', value: 'SPRING_INSERTION_TRACKING' }, // corrected spelling
  { label: 'Catalyst Outage Tracking', value: 'CATALYST_OUTAGE_TRACKING' }
]

const localState = reactive<Partial<TubeSheet>>({ ...props.modelValue })
watch(() => props.modelValue, v => Object.assign(localState, v), { deep: true })

const isEditing = computed(() => !!props.modelValue._id)

const handleSubmit = () => {
  if (!localState.clientName || !localState.clientAddress) return alert('Enter all fields')

  if (isEditing.value) {
    store.updateTubeSheet(localState)
  } else {
    store.addTubeSheet({
      ...localState
    })
  }

  emit('update:modelValue', localState)
  open.value = false
  try {
    useToast().add({ title: 'Saved!', color: 'primary' })
  } catch (err) {
    console.error('Toast error:', err)
  }
}

/* ✅ Dynamic color mapping */
const statusColor = (status?: string) => {
  switch (status) {
    case 'SHAPE_CREATION': return 'primary'
    case 'SHAPE_CREATED': return 'secondary'
    case 'UNDER_SURVEY': return 'warning'
    case 'IDLE': return 'error'
    default: return 'neutral'
  }
}

/* ✅ Dynamic label per status */
const getLabel = (status?: string) => {
  switch (status) {
    case 'SHAPE_CREATION': return 'Create Shape'
    case 'SHAPE_CREATED': return 'Start Survey'
    case 'UNDER_SURVEY': return 'View Survey'
    case 'IDLE': return 'Completed'
    default: return 'Open'
  }
}

/* ✅ Dynamic progress value */
const progressValue = (status?: string) => {
  switch (status) {
    case 'SHAPE_CREATION': return 25
    case 'SHAPE_CREATED': return 60
    case 'UNDER_SURVEY': return 85
    case 'IDLE': return 100
    default: return 10
  }
}

/* ✅ Utilities */
const readableType = (t?: string) => (t === 'REACTOR' ? 'Reactor' : 'Heat Exchanger')

const formatDate = (d?: Date | string) =>
  d && new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
const handleNextStep = (status?: string, sheetId?: string, reactorId?: string) => {
  if (status && reactorId && sheetId)
    switch (status) {
      case 'SHAPE_CREATION': return navigateTo(`/create-reactor/${sheetId}/${reactorId}`)
      case 'SHAPE_CREATED': return navigateTo(`/survey-details/${sheetId}/${reactorId}`)
      case 'UNDER_SURVEY': return navigateTo(`/survey-details/${sheetId}/${reactorId}`)
      case 'IDLE': return 'Completed'
      default: return 'Open'
    }
  else {
    switch (status) {
      case 'SHAPE_CREATION': return navigateTo(`/create-reactor/${sheetId}`)
      case 'SHAPE_CREATED': return navigateTo(`/create-reactor/${sheetId}`)
      case 'UNDER_SURVEY': return navigateTo(`/survey-details/${sheetId}`)
      case 'IDLE': return 'Completed'
      default: return 'Open'
    }
  }
}
</script>
