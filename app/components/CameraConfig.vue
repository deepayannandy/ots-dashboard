<template>
  <!-- Camera Configuration Modal -->
  <UModal v-model:open="localState.open" description="Configure Cameras">
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
        <div v-for="(camera, index) in localState.cameras" :key="index" class="flex items-center gap-2">
          <UFieldGroup class="grid grid-cols-2 w-full my-1">
            <div variant="outline" class="text-xl">
              Camera {{ index + 1 }}
            </div>
            <USelect v-model="localState.cameras[index]" :items="cameraItems" />
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
import { reactive, watch, computed } from 'vue'
import { useTubeSheets } from '@/stores/tubesheets'
import type { TubeSheet } from '@/types'
import { USelect } from '#components'

const props = defineProps<{ modelValue: Partial<TubeSheet>, addNew?: boolean, open: boolean }>()
const emit = defineEmits(['update:modelValue', 'update:open'])
const store = useTubeSheets()

const cameraItems = [
  { label: 'Camera A', value: 'Camera A' },
  { label: 'Camera B', value: 'Camera B' },
  { label: 'Camera C', value: 'Camera C' },
  { label: 'Camera D', value: 'Camera D' },
  { label: 'Camera E', value: 'Camera E' }
]

const localState = reactive<Partial<TubeSheet> & { open: boolean }>({ ...props.modelValue, open: props.open })
watch(() => props.modelValue, v => Object.assign(localState, v), { deep: true })

watch(() => localState.numberOfCameras, (newVal) => {
  const num = Number(newVal) || 0
  if (!localState.cameras) localState.cameras = []
  localState.cameras = localState.cameras.slice(0, num)
  while (localState.cameras.length < num) {
    localState.cameras.push(`Camera ${localState.cameras.length + 1}`)
  }
})

const isEditing = computed(() => !!props.modelValue._id)

const handleSubmit = () => {
  if (isEditing.value) {
    store.updateTubeSheet(localState)
  } else {
    store.addTubeSheet({
      ...localState
    })
  }

  emit('update:modelValue', localState)
  emit('update:open', false)
  try {
    useToast().add({ title: 'Saved!', color: 'primary' })
  } catch (err) {
    console.error('Toast error:', err)
  }
}
</script>
