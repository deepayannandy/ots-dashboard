<template>
  <!-- Modal -->
  <UModal
    v-model:open="open"
    :title="isEditing ? 'Edit Tube Sheet' : 'Create Tube Sheet'"
    :description="`Status: ${getLabel(localState.status)}`"
  >
    <template #body>
      <UForm :state="localState" class="grid grid-cols-2 gap-2">
        <UFormField label="Name" name="name">
          <UInput v-model="localState.name" placeholder="Enter sheet name" class="w-full" />
        </UFormField>

        <UFormField label="Site Name" name="siteName">
          <UInput v-model="localState.siteName" placeholder="Enter site name" class="w-full" />
        </UFormField>

        <UFormField label="Type" name="type">
          <USelectMenu
            v-model="localState.type"
            value-key="value"
            :items="tubeSheetTypeItems"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-4 w-full">
        <UButton label="Cancel" variant="ghost" @click="open = false" />
        <UButton
          :label="isEditing ? 'Save' : 'Add Tubesheet'"
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
        {{ localState.name }}
      </h3>
      <UBadge :color="statusColor(localState.status)" variant="soft">
        {{ getLabel(localState.status) }}
      </UBadge>
    </div>

    <!-- Info -->
    <div class="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
      <p><span class="font-medium">Site:</span> {{ localState.siteName }}</p>
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

const props = defineProps<{ modelValue: Partial<TubeSheet>, addNew?: boolean }>()
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const store = useTubeSheets()

const tubeSheetTypeItems = [
  { label: 'Heat Exchanger', value: 'HEAT_EXCHANGER' },
  { label: 'Reactor', value: 'REACTOR' }
]

const localState = reactive<Partial<TubeSheet>>({ ...props.modelValue })
watch(() => props.modelValue, v => Object.assign(localState, v), { deep: true })

const isEditing = computed(() => !!props.modelValue._id)

const handleSubmit = () => {
  if (!localState.name || !localState.siteName) return alert('Enter all fields')

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
