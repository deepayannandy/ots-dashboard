<template>
  <!-- Camera Configuration Modal -->
  <UModal v-model:open="localState.open" description="Configure Cameras" @update:open="emit('update:open', $event)">
    <template #body>
      <UFieldGroup class="grid grid-cols-2  w-full my-1">
        <div variant="outline" class="text-xl">
          Equipment ID
        </div>
        <UInput v-model="localState.equipmentId" />
      </UFieldGroup>
      <UFieldGroup class="grid grid-cols-2  w-full">
        <div variant="outline" class="text-xl">
          Number of Cameras
        </div>
        <div class="flex gap-2">
          <UInputNumber v-model="localState.numberOfCameras" class="flex-1" />
        </div>
      </UFieldGroup>
      <div v-if="localState.cameras && localState.cameras.length">
        <div v-for="(cameraId, index) in localState.cameras" :key="index" class="flex items-center gap-2">
          <UFieldGroup class="grid grid-cols-2 w-full my-1">
            <div variant="outline" class="text-xl">
              Camera {{ index + 1 }}
            </div>
            <USelect v-model="localState.cameras[index]" :items="cameraItems" placeholder="Select Camera" />
          </UFieldGroup>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-4 w-full">
        <UButton label="save" @click="handleSubmit" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import { useTubeSheets } from '@/stores/tubesheets'
import type { TubeSheet } from '@/types'

interface Camera {
  _id: string
  name: string
  macId: string
  ipAddress: string
  isOccupied: boolean
}

const props = defineProps<{ modelValue: Partial<TubeSheet>, addNew?: boolean, open: boolean }>()
const emit = defineEmits(['update:modelValue', 'update:open'])
const store = useTubeSheets()

const availableCameras = ref<Camera[]>([])
const cameraItems = computed(() =>
  availableCameras.value.map(cam => ({
    label: `${cam.name} (${cam.ipAddress})`,
    value: cam._id
  }))
)

const localState = reactive<Partial<TubeSheet> & { open: boolean }>({ ...props.modelValue, open: props.open })
watch(() => props.modelValue, v => Object.assign(localState, v), { deep: true })
watch(() => props.open, v => localState.open = v)

// Fetch available cameras when modal opens
watch(() => localState.open, async (isOpen) => {
  if (isOpen) {
    try {
      const { data } = await useAxios().$get('/api/v2/camera/getAvailableCameras')
      availableCameras.value = data
    } catch (err) {
      console.error('Failed to fetch cameras:', err)
      useToast().add({ title: 'Failed to load cameras', color: 'error' })
    }
  }
})

watch(() => localState.numberOfCameras, (newVal) => {
  const num = Number(newVal) || 0
  if (!localState.cameras) localState.cameras = []
  localState.cameras = localState.cameras.slice(0, num)
  while (localState.cameras.length < num) {
    // Keep existing camera IDs, add empty strings for new cameras
    localState.cameras.push('')
  }
})

const handleSubmit = async () => {
  try {
    if (!localState._id) {
      useToast().add({ title: 'Error: No tubesheet ID', color: 'error' })
      return
    }

    const payload = {
      numberOfCameras: localState.numberOfCameras,
      cameras: localState.cameras
    }

    await useAxios().$patch(`/api/v2/tubeSheet/addCameraDetails/${localState._id}`, payload)

    // Refresh tubesheet data
    await store.getAllSheet()

    emit('update:modelValue', localState)
    emit('update:open', false)

    useToast().add({ title: 'Camera configuration saved!', color: 'success' })
  } catch (err) {
    console.error('Camera config error:', err)
    useToast().add({ title: 'Failed to save camera configuration', color: 'error' })
  }
}
</script>
