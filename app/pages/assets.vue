<template>
  <UDashboardPanel id="assets" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Assets" description="Manage cameras and devices.">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="flex justify-end gap-4 items-center w-full">
          <UButton
            :loading="isFetching"
            icon="i-lucide-refresh-ccw"
            variant="outline"
            @click="fetchCameras"
          />
          <UButton
            icon="i-lucide-plus"
            @click="openCreateModal"
          />
        </div>

        <UTable
          :data="cameras"
          :columns="columns"
          :loading="isFetching"
          class="flex-1 elevation-1 rounded-lg overflow-hidden bg-white!"
        />
      </div>

      <UModal
        v-model:open="isModalOpen"
        :ui="{ content: 'max-w-xl' }"
        :title="isEditing ? 'Edit Camera' : 'Add Camera'"
        :description="isEditing ? 'Update camera configuration.' : 'Add a new camera to the system.'"
      >
        <template #body>
          <UForm
            id="camera-form"
            class="space-y-6"
            @submit.prevent="handleSaveCamera"
          >
            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Camera Details
              </p>

              <div class="grid gap-3">
                <UFieldGroup class="grid grid-cols-2 w-full">
                  <div variant="outline" class="text-xl">
                    Camera Name
                  </div>
                  <UInput
                    v-model="formState.name"
                    placeholder="e.g., USB Camera"
                  />
                </UFieldGroup>

                <UFieldGroup class="grid grid-cols-2 w-full">
                  <div variant="outline" class="text-xl">
                    MAC ID
                  </div>
                  <UInput
                    v-model="formState.macId"
                    placeholder="e.g., ab:cd:ef:gh:ij:hc"
                  />
                </UFieldGroup>

                <UFieldGroup class="grid grid-cols-2 w-full">
                  <div variant="outline" class="text-xl">
                    IP Address
                  </div>
                  <UInput
                    v-model="formState.ipAddress"
                    placeholder="e.g., 192.168.1.104"
                  />
                </UFieldGroup>
              </div>
            </div>

            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Stream Configuration
              </p>

              <div class="grid gap-3">
                <UFieldGroup class="grid grid-cols-2 w-full">
                  <div variant="outline" class="text-xl">
                    Controller IP
                  </div>
                  <UInput
                    v-model="formState.controllerIp"
                    placeholder="e.g., 192.168.0.22"
                  />
                </UFieldGroup>

                <UFieldGroup class="grid grid-cols-2 w-full">
                  <div variant="outline" class="text-xl">
                    RTSP URL
                  </div>
                  <UInput
                    v-model="formState.rtspUrl"
                    placeholder="rtsp://user:pass@ip:554/cam/..."
                  />
                </UFieldGroup>
              </div>
            </div>
          </UForm>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 w-full">
            <UButton
              type="button"
              variant="ghost"
              color="neutral"
              @click="closeModal"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              form="camera-form"
              color="primary"
              :loading="isSaving"
              :disabled="!isFormValid"
            >
              {{ isEditing ? 'Update Camera' : 'Add Camera' }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type Camera = {
  _id: string
  name: string
  macId: string
  ipAddress: string
  reactorId: string
  status: boolean
  createdAt?: string
  updatedAt?: string
  isOccupied?: boolean
  controllerIp?: string
  rtspUrl?: string
  __v?: number
}

type CameraApiResponse = {
  Success?: boolean
  data?: Camera[]
}

const axios = useAxios()
const toast = useToast()

const cameras = ref<Camera[]>([])
const isFetching = ref(false)
const isSaving = ref(false)
const isModalOpen = ref(false)

const formState = reactive<{
  _id?: string
  name: string
  macId: string
  ipAddress: string
  controllerIp: string
  rtspUrl: string
}>({
  name: '',
  macId: '',
  ipAddress: '',
  controllerIp: '',
  rtspUrl: ''
})

const isEditing = computed(() => !!formState._id)

const isFormValid = computed(() => {
  return formState.name.trim() && formState.macId.trim() && formState.ipAddress.trim()
})

const columns: TableColumn<Camera>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: '_id',
    header: 'ID',
    cell: ({ row }) => row.getValue('_id')
  },
  {
    accessorKey: 'ipAddress',
    header: 'IP'
  },
  {
    accessorKey: 'macId',
    header: 'MAC ID'
  },
  {
    accessorKey: 'controllerIp',
    header: 'Controller IP',
    cell: ({ row }) => row.getValue('controllerIp') || 'N/A'
  },
  {
    accessorKey: 'reactorId',
    header: 'Reactor ID'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as boolean
      return h('span', {
        class: `inline-block w-3 h-3 rounded-full ${status ? 'bg-green-500 blink' : 'bg-gray-500'}`
      })
    }
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return h('div', { class: 'flex gap-2' }, [
        h(resolveComponent('UButton'), {
          icon: 'i-lucide-pencil',
          size: 'xs',
          variant: 'ghost',
          color: 'neutral',
          onClick: () => openEditModal(row.original)
        }),
        h(resolveComponent('UButton'), {
          icon: 'i-lucide-video',
          size: 'xs',
          variant: 'ghost',
          color: 'primary',
          onClick: () => navigateTo(`/camera-calibrate/${row.original._id}`)
        })
      ])
    }
  }
]

function resetForm() {
  formState._id = undefined
  formState.name = ''
  formState.macId = ''
  formState.ipAddress = ''
  formState.controllerIp = ''
  formState.rtspUrl = ''
}

function openCreateModal() {
  resetForm()
  isModalOpen.value = true
}

function openEditModal(camera: Camera) {
  formState._id = camera._id
  formState.name = camera.name
  formState.macId = camera.macId
  formState.ipAddress = camera.ipAddress
  formState.controllerIp = camera.controllerIp || ''
  formState.rtspUrl = camera.rtspUrl || ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  resetForm()
}

async function fetchCameras() {
  isFetching.value = true
  try {
    const response = await axios.$get<Camera[] | CameraApiResponse>('/api/v2/camera/getAllCameras')
    const data = Array.isArray(response) ? response : response?.data || []
    cameras.value = data
  } catch {
    toast.add({ title: 'Unable to load cameras', color: 'error' })
  } finally {
    isFetching.value = false
  }
}

await fetchCameras()

async function handleSaveCamera() {
  if (!isFormValid.value) {
    toast.add({ title: 'Please fill all fields', color: 'warning' })
    return
  }

  isSaving.value = true
  try {
    const payload = {
      name: formState.name,
      macId: formState.macId,
      ipAddress: formState.ipAddress,
      controllerIp: formState.controllerIp || undefined,
      rtspUrl: formState.rtspUrl || undefined
    }

    if (isEditing.value) {
      await axios.$patch(`/api/v2/camera/updateCamera/${formState._id}`, payload)
      toast.add({ title: 'Camera updated successfully', color: 'success' })
    } else {
      await axios.$post('/api/v2/camera/createCamera', payload)
      toast.add({ title: 'Camera added successfully', color: 'success' })
    }
    closeModal()
    await fetchCameras()
  } catch {
    toast.add({ title: isEditing.value ? 'Failed to update camera' : 'Failed to add camera', color: 'error' })
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.blink {
  animation: blink 1s infinite;
}
</style>
