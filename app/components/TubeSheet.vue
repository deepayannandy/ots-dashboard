<template>
  <!-- Modal -->
  <UModal
    v-model:open="open"
    description="Project Details"
  >
    <template #body>
      <UForm :state="localState" class="grid grid-cols-1 gap-2">
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
            Equipment Type
          </div>
          <USelect v-model="localState.type" :items="tubeSheetTypeItems" :disabled="isCloneing" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Type of Phases
          </div>
          <USelect
            v-model="localState.typeOfPhases"
            :items="phaseItems"
            multiple
            :ui="{ content: 'min-w-fit' }"
            :disabled="isCloneing"
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
          <UInput v-model="localState.material" :disabled="isCloneing" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Total No Of Tubes
          </div>
          <UInput v-model.number="localState.totalNoOfTubes" :disabled="isCloneing" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Day Start Time
          </div>
          <UInput v-model="localState.dayStart" type="time" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Day End Time
          </div>
          <UInput v-model="localState.dayEnd" type="time" />
        </UFieldGroup>
        <UFieldGroup class="grid grid-cols-2  w-full">
          <div variant="outline" class="text-xl">
            Timezone
          </div>
          <USelectMenu
            v-model="localState.timeZoneOffset"
            :items="timezoneOptions"
            value-key="value"
            placeholder="Select Timezone"
            class="w-full"
          />
        </UFieldGroup>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-4 w-full">
        <UButton label="Reset" variant="outline" @click="handleReset" />
        <UButton
          :label="isCloneing ? 'Clone' : isEditing ? 'Save' : 'Save'"
          color="primary"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>

  <!-- Add New Card -->
  <UPageCard
    v-if="addNew"
    class="cursor-pointer border-2 border-dashed ring-0 border-neutral-300 dark:border-neutral-600 interactive-lift hover:border-primary/60 hover:bg-primary/5"
    :ui="{
      root: 'h-full min-h-[200px] flex items-center justify-center'
    }"
    @click="open = true"
  >
    <div class="flex flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500">
      <div class="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 elevation-1">
        <UIcon name="i-lucide-plus" class="size-6" />
      </div>
      <p class="text-sm font-medium">
        Create Project
      </p>
    </div>
  </UPageCard>

  <!-- Tube Sheet Card -->
  <UPageCard
    v-else
    :spotlight-color="statusColor(localState.status)"
    spotlight
    class="cursor-pointer interactive-lift"
    :ui="{
      root: 'h-full'
    }"
    @click="handleCardClick"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
        {{ localState.clientName }}
      </h3>
    </div>

    <!-- Info -->
    <div class="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
      <p><span class="font-medium">Equipment ID:</span> {{ localState.equipmentId || 'N/A' }}</p>
      <p><span class="font-medium">Type:</span> {{ getEquipmentTypeLabel(localState.type as string | undefined) }}</p>
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
      :label="primaryActionLabel(localState.status)"
      :color="statusColor(localState.status)"
      variant="outline"
      class="mt-auto"
      :disabled="isActionDisabled(localState.status)"
      @click.stop="handleNextStep(localState.status, localState._id, localState.reactorId)"
    />
    <UButton
      v-if="localState.status==='REACTOR_CREATED' && hasCamerasConfigured"
      block
      size="xs"
      label="Calibrate Camera"
      color="neutral"
      variant="outline"
      class="mt-auto"
      :disabled="!hasCamerasWithRtsp"
      @click.stop="handleCalibrateCamera"
    />

    <!-- Edit Buttons -->
    <div class="flex gap-2 mt-2">
      <UButton
        v-if="shouldShowEditTubesheet(localState.status)"
        block
        size="xs"
        label="Edit Project"
        color="neutral"
        variant="soft"
        icon="i-lucide-edit"
        @click.stop="open = true"
      />
      <UButton
        v-if="shouldShowEditReactor(localState.status)"
        block
        size="xs"
        label="Edit Layout"
        color="neutral"
        variant="soft"
        icon="i-lucide-box"
        @click.stop="navigateTo(`/create-reactor/${localState._id}/${localState.reactorId??''}`)"
      />
      <UButton
        block
        size="xs"
        label="Clone"
        color="neutral"
        variant="soft"
        icon="i-lucide-book-copy"
        @click="clone"
      />
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useTubeSheets } from '@/stores/tubesheets'
import { useCamera } from '@/stores/camera'
import type { TubeSheet } from '@/types'
import { tubeSheetTypeItems, typeOfPhases } from '@/utils/tubesheetOptions'
import { USelect } from '#components'
import { usePhases } from '@/composables/usePhases'

const props = defineProps<{ modelValue: Partial<TubeSheet>, addNew?: boolean }>()
const emit = defineEmits(['update:modelValue', 'saved', 'update:openConfigCamera'])
const open = ref(false)
const currentSheet = ref<Partial<TubeSheet>>({})
const isCloneing = ref(false)

const store = useTubeSheets()
const cameraStore = useCamera()
const allCameras = ref<any[]>([])

// Fetch all cameras on mount to check RTSP URLs
onMounted(async () => {
  try {
    const response = await useAxios().$get('/api/v2/camera/getAllCameras')
    allCameras.value = Array.isArray(response) ? response : response.data || []
  } catch (error) {
    console.error('Failed to fetch cameras:', error)
  }
})

// Check if cameras are configured for this tubesheet
const hasCamerasConfigured = computed(() => {
  return localState.cameras && localState.cameras.length > 0
})

// Check if cameras have RTSP URLs configured
const hasCamerasWithRtsp = computed(() => {
  if (!localState.cameras || localState.cameras.length === 0) return false

  // Check if any of the configured cameras have RTSP URLs
  return localState.cameras.some((cameraId) => {
    const camera = allCameras.value.find(cam => cam._id === cameraId || cam.name === cameraId)
    return camera && camera.rtspUrl && camera.rtspUrl.trim() !== ''
  })
})

// Handle calibrate camera click - navigate to first camera
const handleCalibrateCamera = () => {
  if (localState.cameras && localState.cameras.length > 0) {
    const firstCameraId = localState.cameras[0]
    navigateTo(`/camera-calibrate/${firstCameraId}`)
  }
}

const stateFlow = {
  TUBE_SHEET_CREATED: {
    description: 'Tube sheet created',
    next: 'CAMERA_CONFIGURED',
    action: 'Configure Cameras',
    disabled: false
  },
  CAMERA_CONFIGURED: {
    description: 'Camera configured',
    next: 'REACTOR_CREATED',
    action: 'Create Layout',
    disabled: false
  },
  REACTOR_CREATED: {
    description: 'Layout created',
    next: 'CAMERA_CALIBRATED',
    action: 'Start Survey',
    disabled: false
  },
  CAMERA_CALIBRATED: {
    description: 'Camera calibrated',
    next: 'UNDER_SURVEY',
    action: 'Start Survey',
    disabled: true
  },
  IDLE: {
    description: 'System idle',
    next: 'UNDER_SURVEY',
    action: 'Continue Survey',
    disabled: false
  },
  UNDER_SURVEY: {
    description: 'System performing a survey',
    next: null,
    action: 'View Survey',
    disabled: false
  }
}

function clone() {
  open.value = true
  isCloneing.value = true
}

const localState = reactive<Partial<TubeSheet>>({
  ...props.modelValue,
  date: props.modelValue.date || new Date(),
  dayStart: props.modelValue.dayStart || '08:00',
  dayEnd: props.modelValue.dayEnd || '17:00',
  timeZoneOffset: props.modelValue.timeZoneOffset ?? -360
})
watch(() => props.modelValue, v => Object.assign(localState, v), { deep: true })

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
      : new Date().toISOString(),
    dayStart: localState.dayStart || '08:00',
    dayEnd: localState.dayEnd || '17:00',
    timeZoneOffset: localState.timeZoneOffset ?? -360
  }

  if (isCloneing.value) {
    store.cloneTubeSheet(payload)
  } else if (isEditing.value) {
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

const hasResumeJourney = computed(() => !!localState.isUnderSurvey && !!localState.surveyId)

const primaryActionLabel = (status?: string) => {
  if (hasResumeJourney.value) return 'Resume Survey'
  return getActionLabel(status)
}

const handleReset = () => {
  if (isCloneing.value) {
    localState.equipmentId = ''
    localState.clientName = ''
    localState.clientAddress = ''
    localState.projectStartDate = undefined
    return
  }
  localState.equipmentId = ''
  localState.type = ''
  localState.typeOfPhases = []
  localState.clientName = ''
  localState.clientAddress = ''
  localState.material = ''
  localState.totalNoOfTubes = 0
  localState.numberOfCameras = 0
  localState.cameras = []
  localState.dayStart = '08:00'
  localState.dayEnd = '17:00'
  localState.timeZoneOffset = -360
  localState.projectStartDate = undefined
  localState.date = new Date()
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

/* ✅ Get action label for button */
const getActionLabel = (status?: string) => {
  if (status && stateFlow[status as keyof typeof stateFlow]) {
    return stateFlow[status as keyof typeof stateFlow].action
  }
  return 'Open'
}

/* ✅ Check if action is disabled */
const isActionDisabled = (status?: string) => {
  if (status && stateFlow[status as keyof typeof stateFlow]) {
    return stateFlow[status as keyof typeof stateFlow].disabled || false
  }
  return false
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
const getEquipmentTypeLabel = (value?: string) => {
  if (!value) return 'N/A'
  const item = tubeSheetTypeItems.find(t => t.value === value)
  return item ? item.label : value
}

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
  if (hasResumeJourney.value) {
    if (sheetId && reactorId) {
      return navigateTo({
        path: `/survey-details/${sheetId}/${reactorId}`,
        query: { surveyId: localState.surveyId, resumedJourney: 'true' }
      })
    }
    if (sheetId) {
      return navigateTo({
        path: `/survey-details/${sheetId}`,
        query: { surveyId: localState.surveyId, resumedJourney: 'true' }
      })
    }
  }

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

const phases = usePhases()

const timezoneOptions = [
  { label: '(UTC-12:00) Baker Island', value: -720 },
  { label: '(UTC-11:00) Pago Pago', value: -660 },
  { label: '(UTC-10:00) Honolulu (HST)', value: -600 },
  { label: '(UTC-09:00) Anchorage (AKST)', value: -540 },
  { label: '(UTC-08:00) Los Angeles (PST)', value: -480 },
  { label: '(UTC-07:00) Denver (MST)', value: -420 },
  { label: '(UTC-06:00) Houston / Chicago (CST)', value: -360 },
  { label: '(UTC-05:00) New York (EST)', value: -300 },
  { label: '(UTC-04:00) Santiago / Halifax', value: -240 },
  { label: '(UTC-03:00) São Paulo / Buenos Aires', value: -180 },
  { label: '(UTC-02:00) South Georgia', value: -120 },
  { label: '(UTC-01:00) Azores', value: -60 },
  { label: '(UTC+00:00) London (GMT)', value: 0 },
  { label: '(UTC+01:00) Paris / Berlin (CET)', value: 60 },
  { label: '(UTC+02:00) Cairo / Johannesburg', value: 120 },
  { label: '(UTC+03:00) Moscow / Riyadh', value: 180 },
  { label: '(UTC+03:30) Tehran', value: 210 },
  { label: '(UTC+04:00) Dubai / Baku', value: 240 },
  { label: '(UTC+04:30) Kabul', value: 270 },
  { label: '(UTC+05:00) Karachi / Tashkent', value: 300 },
  { label: '(UTC+05:30) Mumbai / Kolkata (IST)', value: 330 },
  { label: '(UTC+05:45) Kathmandu', value: 345 },
  { label: '(UTC+06:00) Dhaka / Almaty', value: 360 },
  { label: '(UTC+06:30) Yangon', value: 390 },
  { label: '(UTC+07:00) Bangkok / Jakarta', value: 420 },
  { label: '(UTC+08:00) Singapore / Beijing', value: 480 },
  { label: '(UTC+09:00) Tokyo / Seoul', value: 540 },
  { label: '(UTC+09:30) Adelaide', value: 570 },
  { label: '(UTC+10:00) Sydney (AEST)', value: 600 },
  { label: '(UTC+11:00) Solomon Islands', value: 660 },
  { label: '(UTC+12:00) Auckland (NZST)', value: 720 },
  { label: '(UTC+13:00) Tonga', value: 780 }
]

interface Phase {
  phaseName: string
}

const phaseItems = computed(() => {
  const labelMap = Object.fromEntries(typeOfPhases.map(item => [item.value, item.label]))
  return phases.value.map((phase: Phase) => ({
    label: labelMap[phase.phaseName] || phase.phaseName,
    value: phase.phaseName
  }))
})
</script>
