<template>
  <!-- Modal -->
  <UModal
    v-model:open="open"
    :description="`Status: ${getLabel(localState.status)}`"
  >
    <template #body>
      <UForm :state="localState" class="grid grid-cols-1 gap-2">
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Date
          </div>
          <UInput
            v-model="dateDisplay"
            class="rounded-l-none"
            type="date"
            readonly
          />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Project Start Date
          </div>
          <UInput
            v-model="projectStartDateDisplay"
            class="rounded-l-none"
            type="date"
            @input="updateProjectStartDate"
          />
        </UFieldGroup>

        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Equipment ID
          </div>
          <UInput v-model="localState.equipmentId" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Equipment Name
          </div>
          <UInput v-model="localState.equipmentName" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Equipment Type
          </div>
          <USelect v-model="localState.type" :items="tubeSheetTypeItems" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Type of Phases
          </div>
          <USelect
            v-model="localState.typeOfPhases"
            :items="typeOfPhases"
            multiple
            :ui="{ content: 'min-w-fit' }"
            class="w-full"
          />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Client Name
          </div>
          <UInput v-model="localState.clientName" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full place-items-start">
          <div variant="outline" class="text-xl">
            Client Address
          </div>
          <UTextarea v-model="localState.clientAddress" class="w-full" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Material
          </div>
          <UInput v-model="localState.material" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Total No Of Tubes
          </div>
          <UInput v-model.number="localState.totalNoOfTubes" />
        </UFieldGroup>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-4 w-full">
        <UButton label="Reset" variant="outline" @click="open = false" />
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
    @click="handleCardClick"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
        {{ localState.clientName }}
      </h3>
      <div :color="statusColor(localState.status)" variant="soft">
        {{ getLabel(localState.status) }}
      </div>
    </div>

    <!-- Info -->
    <div class="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
      <p><span class="font-medium">Equipment:</span> {{ localState.equipmentName || 'N/A' }}</p>
      <p><span class="font-medium">Equipment ID:</span> {{ localState.equipmentId || 'N/A' }}</p>
      <p><span class="font-medium">Type:</span> {{ readableType(localState.type) }}</p>
      <p><span class="font-medium">Site:</span> {{ localState.clientAddress }}</p>
      <p><span class="font-medium">Material:</span> {{ localState.material || 'N/A' }}</p>
      <p><span class="font-medium">Total Tubes:</span> {{ localState.totalNoOfTubes || 0 }}</p>
      <p><span class="font-medium">Cameras:</span> {{ localState.numberOfCameras || 0 }}</p>
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
          'bg-primary': localState.status === 'TUBE_SHEET_CREATED',
          'bg-secondary': localState.status === 'CAMERA_CONFIGURED',
          'bg-success': localState.status === 'REACTOR_CREATED',
          'bg-info': localState.status === 'CAMERA_CALIBRATED',
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
      :label="getActionLabel(localState.status)"
      :color="statusColor(localState.status)"
      variant="outline"
      class="mt-auto"
      @click.stop="handleNextStep(localState.status, localState._id, localState.reactorId)"
    />

    <!-- Edit Buttons -->
    <div class="flex gap-2 mt-2">
      <UButton
        v-if="shouldShowEditTubesheet(localState.status)"
        block
        size="xs"
        label="Edit Tubesheet"
        color="neutral"
        variant="soft"
        icon="i-lucide-edit"
        @click.stop="open = true"
      />
      <UButton
        v-if="shouldShowEditReactor(localState.status)"
        block
        size="xs"
        label="Edit Reactor"
        color="neutral"
        variant="soft"
        icon="i-lucide-box"
        @click.stop="navigateTo(`/create-reactor/${localState._id}/${localState.reactorId??''}`)"
      />
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useTubeSheets } from '@/stores/tubesheets'
import type { TubeSheet } from '@/types'
import { USelect } from '#components'

const props = defineProps<{ modelValue: Partial<TubeSheet>, addNew?: boolean }>()
const emit = defineEmits(['update:modelValue', 'saved', 'update:openConfigCamera'])
const open = ref(false)
const currentSheet = ref<Partial<TubeSheet>>({})

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

const stateFlow = {
  TUBE_SHEET_CREATED: {
    description: 'Tube sheet created',
    next: 'CAMERA_CONFIGURED',
    action: 'Configure Cameras'
  },
  CAMERA_CONFIGURED: {
    description: 'Camera configured',
    next: 'REACTOR_CREATED',
    action: 'Create Reactor'
  },
  REACTOR_CREATED: {
    description: 'Reactor created',
    next: 'CAMERA_CALIBRATED',
    action: 'Calibrate Camera'
  },
  CAMERA_CALIBRATED: {
    description: 'Camera calibrated',
    next: 'IDLE',
    action: 'Start Survey'
  },
  IDLE: {
    description: 'System idle',
    next: 'UNDER_SURVEY',
    action: 'Continue Survey'
  },
  UNDER_SURVEY: {
    description: 'System performing a survey',
    next: null,
    action: 'View Survey'
  }
}

const localState = reactive<Partial<TubeSheet>>({
  ...props.modelValue,
  date: props.modelValue.date || new Date()
})
watch(() => props.modelValue, v => Object.assign(localState, v), { deep: true })

// Date handling for input fields
const dateDisplay = computed({
  get: () => {
    if (!localState.date) return ''
    const d = new Date(localState.date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  set: (value: string) => {
    if (value) {
      localState.date = new Date(value)
    }
  }
})

const projectStartDateDisplay = computed({
  get: () => {
    if (!localState.projectStartDate) return ''
    const d = new Date(localState.projectStartDate)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  set: (value: string) => {
    if (value) {
      localState.projectStartDate = new Date(value)
    }
  }
})

const updateProjectStartDate = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  if (value) {
    localState.projectStartDate = new Date(value)
  }
}

watch(() => localState.numberOfCameras, (newVal) => {
  const num = Number(newVal) || 0
  if (!localState.cameras) localState.cameras = []
  localState.cameras = localState.cameras.slice(0, num)
  while (localState.cameras.length < num) {
    localState.cameras.push(`Camera ${localState.cameras.length + 1}`)
  }
})

const isEditing = computed(() => !!props.modelValue._id)

const handleCardClick = () => {
  if (localState.status === 'TUBE_SHEET_CREATED') {
    currentSheet.value = localState
    console.log('hello')

    emit('update:openConfigCamera', localState)
  } else {
    open.value = true
  }
}

const handleSubmit = () => {
  if (!localState.clientName || !localState.clientAddress) return alert('Enter all fields')

  // Create a clean payload with valid dates in ISO format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    ...localState,
    projectStartDate: localState.projectStartDate && !isNaN(new Date(localState.projectStartDate).getTime())
      ? new Date(localState.projectStartDate).toISOString()
      : undefined,
    date: localState.date && !isNaN(new Date(localState.date).getTime())
      ? new Date(localState.date).toISOString()
      : new Date().toISOString()
  }

  if (isEditing.value) {
    store.updateTubeSheet(payload)
  } else {
    store.addTubeSheet(payload)
  }

  emit('update:modelValue', localState)
  open.value = false
  try {
    useToast().add({ title: 'Saved!', color: 'primary' })
  } catch (err) {
    console.error('Toast error:', err)
  }
  emit('saved', localState)
}

/* ✅ Dynamic color mapping */
const statusColor = (status?: string) => {
  switch (status) {
    case 'TUBE_SHEET_CREATED': return 'primary'
    case 'CAMERA_CONFIGURED': return 'secondary'
    case 'REACTOR_CREATED': return 'success'
    case 'CAMERA_CALIBRATED': return 'info'
    case 'UNDER_SURVEY': return 'warning'
    case 'IDLE': return 'error'
    default: return 'neutral'
  }
}

/* ✅ Dynamic label per status */
const getLabel = (status?: string) => {
  if (status && stateFlow[status as keyof typeof stateFlow]) {
    return stateFlow[status as keyof typeof stateFlow].description
  }
  return 'Open'
}

/* ✅ Get action label for button */
const getActionLabel = (status?: string) => {
  if (status && stateFlow[status as keyof typeof stateFlow]) {
    return stateFlow[status as keyof typeof stateFlow].action
  }
  return 'Open'
}

/* ✅ Dynamic progress value */
const progressValue = (status?: string) => {
  switch (status) {
    case 'TUBE_SHEET_CREATED': return 20
    case 'CAMERA_CONFIGURED': return 40
    case 'REACTOR_CREATED': return 60
    case 'CAMERA_CALIBRATED': return 80
    case 'UNDER_SURVEY': return 90
    case 'IDLE': return 100
    default: return 10
  }
}

/* ✅ Utilities */
const readableType = (t?: string) => (t === 'REACTOR' ? 'Reactor' : 'Heat Exchanger')

const shouldShowEditTubesheet = (status?: string) => {
  return status && ['TUBE_SHEET_CREATED', 'CAMERA_CONFIGURED', 'REACTOR_CREATED', 'CAMERA_CALIBRATED', 'IDLE', 'UNDER_SURVEY'].includes(status)
}

const shouldShowEditReactor = (status?: string) => {
  return status && ['REACTOR_CREATED', 'CAMERA_CALIBRATED', 'IDLE', 'UNDER_SURVEY'].includes(status)
}

const formatDate = (d?: Date | string) =>
  d && new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
const handleNextStep = (status?: string, sheetId?: string, reactorId?: string) => {
  if (status === 'TUBE_SHEET_CREATED') {
    currentSheet.value = localState
    emit('update:openConfigCamera', localState)
    return
  }

  if (status && reactorId && sheetId)
    switch (status) {
      case 'TUBE_SHEET_CREATED': return navigateTo(`/create-reactor/${sheetId}/${reactorId}`)
      case 'CAMERA_CONFIGURED': return navigateTo(`/create-reactor/${sheetId}/${reactorId}`)
      case 'REACTOR_CREATED': return navigateTo(`/survey-details/${sheetId}/${reactorId}`)
      case 'CAMERA_CALIBRATED': return navigateTo(`/survey-details/${sheetId}/${reactorId}`)
      case 'UNDER_SURVEY': return navigateTo(`/survey-details/${sheetId}/${reactorId}`)
      case 'IDLE': return 'Completed'
      default: return 'Open'
    }
  else {
    switch (status) {
      case 'TUBE_SHEET_CREATED': return navigateTo(`/create-reactor/${sheetId}`)
      case 'CAMERA_CONFIGURED': return navigateTo(`/create-reactor/${sheetId}`)
      case 'REACTOR_CREATED': return navigateTo(`/create-reactor/${sheetId}`)
      case 'CAMERA_CALIBRATED': return navigateTo(`/survey-details/${sheetId}`)
      case 'UNDER_SURVEY': return navigateTo(`/survey-details/${sheetId}`)
      case 'IDLE': return 'Completed'
      default: return 'Open'
    }
  }
}
</script>
