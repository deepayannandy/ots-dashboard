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
        <div class="flex flex-wrap items-end gap-3">
          <UFormField label="Status">
            <USelect
              v-model="filters.status"
              :items="statusItems"
              value-key="value"
              class="w-40"
            />
          </UFormField>

          <UFormField label="Survey Type">
            <USelect
              v-model="filters.surveyType"
              :items="surveyTypeItems"
              value-key="value"
              class="w-64"
              :ui="{ content: 'min-w-96' }"
            />
          </UFormField>

          <UFormField label="Equipment ID">
            <UInput
              v-model="filters.equipmentId"
              placeholder="Search equipment ID"
              class="w-44"
            />
          </UFormField>

          <UFormField label="Start Date">
            <UInput
              v-model="filters.startDate"
              type="date"
              class="w-40"
            />
          </UFormField>

          <UFormField label="End Date">
            <UInput
              v-model="filters.endDate"
              type="date"
              class="w-40"
            />
          </UFormField>

          <UButton
            label="Clear Filters"
            color="neutral"
            variant="outline"
            @click="resetFilters"
          />
        </div>

        <UTable
          :data="surveyHistory"
          :columns="columns"
          :loading="isLoading"
          class="flex-1 elevation-1 rounded-lg overflow-hidden bg-white"
        />

        <div class="flex items-center justify-between">
          <p class="text-sm text-muted">
            {{ paginationSummary }}
          </p>
          <UPagination
            v-model:page="pagination.page"
            :total="pagination.totalItems"
            :items-per-page="pagination.limit"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { typeOfPhases as allTypeOfPhasesItems } from '@/utils/tubesheetOptions'

const UButton = resolveComponent('UButton')

const axios = useAxios()
const toast = useToast()
const router = useRouter()
const { openReportForPrint } = usePdfReport()

interface SurveyHistoryItem {
  _id: string
  equipmentId: string
  status: string
  surveyType: string
  reactorId?: string
  repeat?: number
  endTimeStamp?: string
  createdAt?: string
  tubeSheet?: {
    _id?: string
    clientName?: string
    totalNoOfTubes?: number
  }
}

interface SurveyHistoryPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

interface SurveyHistoryResponse {
  Success?: boolean
  data: SurveyHistoryItem[]
  pagination?: SurveyHistoryPagination
}

const statusItems = [
  { label: 'Completed', value: 'Completed' },
  { label: 'In Progress', value: 'In Progress' }
]

const surveyTypeItems = [
  { label: 'All Survey Types', value: '' },
  ...allTypeOfPhasesItems
]

const filters = ref({
  status: 'Completed',
  surveyType: '',
  equipmentId: '',
  startDate: '',
  endDate: ''
})

const pagination = ref<SurveyHistoryPagination>({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0
})

const paginationSummary = computed(() => {
  if (!pagination.value.totalItems) return 'No surveys found'
  const start = (pagination.value.page - 1) * pagination.value.limit + 1
  const end = Math.min(pagination.value.page * pagination.value.limit, pagination.value.totalItems)
  return `Showing ${start}-${end} of ${pagination.value.totalItems}`
})

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
    id: 'totalNoOfTubes',
    header: 'Total Tubes',
    cell: ({ row }) => row.original.tubeSheet?.totalNoOfTubes ?? 'N/A'

  },
  {
    id: 'endTime',
    header: 'End Time',
    cell: ({ row }) => formatDate(row.original.endTimeStamp)
  },
  {
    id: 'createdAt',
    header: 'Start Time',
    cell: ({ row }) => formatDate(row.original.createdAt)
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
      h(UButton, {
        label: 'View',
        size: 'xs',
        color: 'primary',
        variant: 'outline',
        onClick: () => handleView(row.original)
      }),
      h(UButton, {
        label: 'Download',
        size: 'xs',
        color: 'neutral',
        variant: 'outline',
        icon: 'i-lucide-download',
        onClick: () => handleDownload(row.original)
      })
    ])
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

function handleDownload(item: SurveyHistoryItem) {
  const sheetId = item.tubeSheet?._id
  const reactorId = item.reactorId

  if (!sheetId) {
    toast.add({ title: 'Missing sheet information', color: 'error' })
    return
  }

  openReportForPrint({
    sheetId,
    reactorId,
    surveyId: item._id
  })
}

async function fetchSurveyHistory() {
  isLoading.value = true
  try {
    const params: Record<string, string | number> = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.surveyType) params.surveyType = filters.value.surveyType
    if (filters.value.equipmentId) params.equipmentId = filters.value.equipmentId
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate

    const response = await axios.$get<SurveyHistoryResponse>(
      '/api/v2/survey/getAllSurveyPaginated',
      { params }
    )
    surveyHistory.value = response?.data || []
    if (response?.pagination) pagination.value = response.pagination
  } catch (error) {
    console.error('Failed to fetch survey history:', error)
    toast.add({ title: 'Unable to load survey history', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

function goToFirstPageAndFetch() {
  if (pagination.value.page !== 1) {
    pagination.value.page = 1
  } else {
    fetchSurveyHistory()
  }
}

function resetFilters() {
  clearTimeout(equipmentIdDebounceTimer)
  filters.value = {
    status: 'Completed',
    surveyType: '',
    equipmentId: '',
    startDate: '',
    endDate: ''
  }
  goToFirstPageAndFetch()
}

let equipmentIdDebounceTimer: ReturnType<typeof setTimeout> | undefined

watch(() => filters.value.equipmentId, () => {
  clearTimeout(equipmentIdDebounceTimer)
  equipmentIdDebounceTimer = setTimeout(goToFirstPageAndFetch, 400)
})

watch(
  () => [filters.value.status, filters.value.surveyType, filters.value.startDate, filters.value.endDate],
  goToFirstPageAndFetch
)

watch(() => pagination.value.page, () => {
  fetchSurveyHistory()
})

await fetchSurveyHistory()
</script>
