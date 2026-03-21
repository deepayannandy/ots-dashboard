<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Real Time Survey Progress" description="Monitoring active reactor inspections and component life cycle phases.">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="isLoading"
            @click="fetchDashboardData"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <div v-else-if="dashboardData.length === 0" class="flex flex-col items-center justify-center h-64 text-neutral-500">
        <UIcon name="i-lucide-inbox" class="size-12 mb-4" />
        <p>No active surveys found</p>
      </div>

      <div v-else class="space-y-6 p-4">
        <UCard
          v-for="equipment in dashboardData"
          :key="equipment.id"
          variant="outline"
          class="overflow-hidden"
        >
          <template #header>
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                  <UIcon name="i-lucide-cylinder" class="size-5" />
                </div>
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-semibold text-lg">
                      {{ equipment.equipmentId }}
                    </h3>
                    <UBadge :color="getEquipmentTypeColor(equipment.type)" variant="soft" size="sm">
                      {{ formatEquipmentTypeLabel(equipment.type) }}
                    </UBadge>
                    <UBadge color="neutral" variant="subtle" size="sm">
                      {{ equipment.equipmentStatus }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-neutral-500">
                    {{ equipment.clientName }} · {{ equipment.clientAddress }}
                  </p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-2 text-sm text-neutral-500">
                <div
                  v-if="equipment.tubeSheetId && equipment.reactorId"
                  class="flex flex-wrap items-center justify-end gap-2"
                >
                  <NuxtLink
                    :to="`/survey-details/${equipment.tubeSheetId}/${equipment.reactorId}`"
                    class="inline-flex"
                  >
                    <UButton
                      icon="i-lucide-external-link"
                      color="primary"
                      variant="soft"
                      size="xs"
                    >
                      Open survey
                    </UButton>
                  </NuxtLink>
                  <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    variant="soft"
                    size="xs"
                    @click="downloadReport(equipment)"
                  >
                    Download report
                  </UButton>
                </div>
                <UButton
                  v-else
                  icon="i-lucide-download"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  disabled
                  title="Tube sheet and reactor are required to build a report"
                >
                  Download report
                </UButton>
                <div class="flex flex-col items-end gap-1">
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-file-text" class="size-4" />
                    <span>WO: {{ equipment.woId }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-clock" class="size-4" />
                    <span>Start: {{ formatDateTime(equipment.startTime) }}</span>
                  </div>
                  <div
                    v-if="equipment.endTime"
                    class="flex items-center gap-1.5"
                  >
                    <UIcon name="i-lucide-flag" class="size-4" />
                    <span>End: {{ formatDateTime(equipment.endTime) }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-activity" class="size-4" />
                    <span>Updated: {{ formatDateTime(equipment.lastUpdatedTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Phases Timeline -->
          <div class="py-4">
            <div class="mb-6">
              <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Process Flow Status
              </h4>
            </div>

            <p
              v-if="equipment.phases.length === 0"
              class="text-sm text-neutral-500 py-4"
            >
              No phases configured for this run.
            </p>

            <!-- Horizontal Timeline -->
            <div v-else class="relative">
              <!-- Timeline Line -->
              <div class="absolute top-5 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-700" />

              <!-- Timeline Progress -->
              <div
                class="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                :style="{ width: getTimelineProgress(equipment) + '%' }"
              />

              <!-- Timeline Points -->
              <div class="relative flex justify-between">
                <div
                  v-for="phase in equipment.phases"
                  :key="phase.phaseId"
                  class="flex flex-col items-center"
                  :style="{ width: 100 / equipment.phases.length + '%' }"
                >
                  <UTooltip
                    :delay-duration="0"
                    :content="{ side: 'top', sideOffset: 80 }"
                  >
                    <template #default>
                      <button
                        class="relative z-10 flex items-center justify-center size-10 rounded-full border-2 transition-all duration-300 cursor-pointer hover:scale-110"
                        :class="getPhaseIconClasses(phase)"
                      >
                        <UIcon :name="getPhaseIcon(phase)" class="size-4" />
                      </button>
                    </template>
                    <template #content>
                      <div class="p-3 min-w-[220px] bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-700 rounded-lg">
                        <p class="font-semibold mb-2 text-neutral-900 dark:text-white">
                          {{ phase.phaseName }}
                        </p>
                        <div class="space-y-1.5 text-xs">
                          <div class="flex justify-between gap-4">
                            <span class="text-neutral-500 dark:text-neutral-400">Status:</span>
                            <span class="font-medium text-neutral-900 dark:text-white">{{ phase.phaseStatus }}</span>
                          </div>
                          <div class="flex justify-between gap-4">
                            <span class="text-neutral-500 dark:text-neutral-400">Progress:</span>
                            <span class="font-medium text-neutral-900 dark:text-white">{{ phase.progress !== null && phase.progress !== undefined ? phase.progress + '%' : '—' }}</span>
                          </div>
                          <div class="flex justify-between gap-4">
                            <span class="text-neutral-500 dark:text-neutral-400">Start:</span>
                            <span class="font-medium text-neutral-900 dark:text-white">{{ phase.phaseStartTime ? formatDateTime(phase.phaseStartTime) : '-' }}</span>
                          </div>
                          <div
                            v-if="phase.endTime"
                            class="flex justify-between gap-4"
                          >
                            <span class="text-neutral-500 dark:text-neutral-400">End:</span>
                            <span class="font-medium text-neutral-900 dark:text-white">{{ formatDateTime(phase.endTime) }}</span>
                          </div>
                          <div class="flex justify-between gap-4">
                            <span class="text-neutral-500 dark:text-neutral-400">Updated:</span>
                            <span class="font-medium text-neutral-900 dark:text-white">{{ phase.lastUpdatedTime ? formatDateTime(phase.lastUpdatedTime) : '-' }}</span>
                          </div>
                          <div v-if="phase.surveyID" class="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-700">
                            <span class="text-neutral-500 dark:text-neutral-400">Survey ID:</span>
                            <span class="font-mono text-xs ml-1 text-neutral-900 dark:text-white">{{ phase.surveyID.slice(-8) }}</span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </UTooltip>

                  <!-- Phase Label -->
                  <div class="mt-3 text-center px-1">
                    <p class="text-xs font-medium text-neutral-700 dark:text-neutral-300 leading-tight">
                      {{ phase.phaseName }}
                    </p>
                    <p class="text-[10px] text-neutral-500 mt-0.5 leading-tight break-words">
                      {{ phase.phaseStatus }}
                    </p>
                    <div v-if="phase.progress !== null && phase.progress !== undefined" class="mt-1.5">
                      <UProgress
                        :model-value="phase.progress"
                        size="xs"
                        :color="getProgressColor(phase.progress)"
                        class="w-16 mx-auto"
                      />
                      <span class="text-xs text-neutral-500 mt-0.5">{{ phase.progress }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import {
  mapDashboardApiToView,
  resolveReportSurveyId,
  type DashboardEquipmentView,
  type DashboardPhaseView
} from '@/utils/dashboardApi'

const axios = useAxios()
const toast = useToast()
const { openReportFromDashboard } = usePdfReport()

const dashboardData = ref<DashboardEquipmentView[]>([])
const isLoading = ref(false)

async function fetchDashboardData() {
  isLoading.value = true
  try {
    const response = await axios.get('/api/v2/dashboard/getDashboardData')
    if (response.data?.Success && Array.isArray(response.data.data)) {
      dashboardData.value = mapDashboardApiToView(response.data.data)
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Error fetching dashboard data',
      description: (error as Error)?.message || 'Something went wrong',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

function downloadReport(equipment: DashboardEquipmentView) {
  if (!equipment.tubeSheetId || !equipment.reactorId) {
    toast.add({
      title: 'Cannot open report',
      description: 'This run needs a tube sheet and reactor.',
      color: 'warning'
    })
    return
  }
  const surveyId = resolveReportSurveyId(equipment)
  openReportFromDashboard({
    sheetId: equipment.tubeSheetId,
    reactorId: equipment.reactorId,
    surveyId
  })
  toast.add({
    title: 'Report opened',
    description: surveyId
      ? 'Use Print / Save as PDF in the new tab to download.'
      : 'Condensed report — use Print / Save as PDF in the new tab.',
    color: 'success'
  })
}

// Format equipment type for display (tube sheet type)
function formatEquipmentTypeLabel(type: string): string {
  if (type === 'UNKNOWN') return 'No tube sheet'
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Get color based on equipment type
function getEquipmentTypeColor(type: string): 'primary' | 'info' | 'warning' | 'neutral' {
  if (type === 'UNKNOWN') return 'neutral'
  const colors: Record<string, 'primary' | 'info' | 'warning' | 'neutral'> = {
    HEAT_EXCHANGER: 'primary',
    REACTOR: 'info',
    VESSEL: 'warning'
  }
  return colors[type] || 'neutral'
}

// Format date time
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get phase icon from API progress when present
function getPhaseIcon(phase: DashboardPhaseView): string {
  const p = phase.progress
  if (p !== null && p !== undefined && p >= 100) return 'i-lucide-check'
  if (p !== null && p !== undefined && p > 0) return 'i-lucide-loader-2'
  return 'i-lucide-circle'
}

function getPhaseIconClasses(phase: DashboardPhaseView): string {
  const p = phase.progress
  if (p !== null && p !== undefined && p >= 100) {
    return 'bg-green-500 border-green-500 text-white'
  }
  if (p !== null && p !== undefined && p > 0) {
    return 'bg-primary border-primary text-white animate-pulse'
  }
  return 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-400'
}

// Get progress bar color
function getProgressColor(progress: number): 'primary' | 'success' | 'warning' {
  if (progress >= 80) return 'success'
  if (progress >= 40) return 'primary'
  return 'warning'
}

/** Timeline bar: average of each phase’s `phaseData.progress` (only phases that report a number). */
function getTimelineProgress(equipment: DashboardEquipmentView): number {
  const phases = equipment.phases
  if (!phases.length) return 0
  const nums = phases
    .map(p => p.progress)
    .filter((n): n is number => n !== null && n !== undefined && !Number.isNaN(n))
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
</style>
