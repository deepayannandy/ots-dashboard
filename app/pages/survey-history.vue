<template>
  <UDashboardPanel id="survey-history" :ui="{ body: 'lg:py-10' }">
    <template #header>
      <UDashboardNavbar title="Survey History" description="Review completed and in-progress surveys.">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="flex justify-end">
          <UButton
            icon="i-lucide-refresh-ccw"
            variant="outline"
            :loading="isLoading"
            @click="fetchSurveyHistory"
          />
        </div>

        <UTable
          :data="surveyHistory"
          :columns="columns"
          :loading="isLoading"
          class="flex-1"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { typeOfPhases as allTypeOfPhasesItems } from '@/utils/tubesheetOptions'

const axios = useAxios()
const toast = useToast()
const router = useRouter()

interface SurveyHistoryItem {
  _id: string
  equipmentId: string
  status: string
  surveyType: string
  reactorId?: string
  repeat?: number
  endTimeStamp?: string
  tubeSheet?: {
    _id?: string
    clientName?: string
  }
}

const surveyHistory = ref<SurveyHistoryItem[]>([])
const isLoading = ref(false)

const columns: TableColumn<SurveyHistoryItem>[] = [
  {
    accessorKey: 'equipmentId',
    header: 'Equipment ID'
  },
  {
    id: 'clientName',
    header: 'Client',
    cell: ({ row }) => row.original.tubeSheet?.clientName || '-'
  },
  {
    id: 'surveyTypeLabel',
    header: 'Survey Type',
    cell: ({ row }) => getSurveyTypeLabel(row.original.surveyType)
  },
  {
    accessorKey: 'status',
    header: 'Status'
  },
  {
    id: 'endTime',
    header: 'End Time',
    cell: ({ row }) => formatDate(row.original.endTimeStamp)
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h(resolveComponent('UButton'), {
      label: 'View',
      size: 'xs',
      color: 'primary',
      variant: 'outline',
      onClick: () => handleView(row.original)
    })
  }
]

function formatDate(value?: string) {
  if (!value) return 'N/A'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getSurveyTypeLabel(value: string) {
  const found = allTypeOfPhasesItems.find(item => item.value === value)
  return found?.label || value
}

function buildSurveyDetailsPath(item: SurveyHistoryItem) {
  const sheetId = item.tubeSheet?._id
  const reactorId = item.reactorId
  if (sheetId && reactorId) return `/survey-details/${sheetId}/${reactorId}`
  if (sheetId) return `/survey-details/${sheetId}`
  return '/survey-details'
}

function handleView(item: SurveyHistoryItem) {
  router.push({
    path: buildSurveyDetailsPath(item),
    query: { surveyId: item._id }
  })
}

async function fetchSurveyHistory() {
  isLoading.value = true
  try {
    const response = await axios.$get<{ Success?: boolean, data?: SurveyHistoryItem[] } | SurveyHistoryItem[]>(
      '/api/v2/survey/getAllSurvey'
    )
    const data = Array.isArray(response) ? response : response?.data || []
    surveyHistory.value = data
  } catch (error) {
    console.error('Failed to fetch survey history:', error)
    toast.add({ title: 'Unable to load survey history', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

await fetchSurveyHistory()
</script>
