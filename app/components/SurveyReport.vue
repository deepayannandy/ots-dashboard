<template>
  <PageDocument
    ref="pageDocRef"
    size="A4"
    orientation="portrait"
    :padding="{ 2: 0, 3: 0, default: 40 }"
  >
    <template #header="{ page, total }">
      <div class="flex justify-between items-center border-b border-gray-200 pb-2">
        <div class="flex items-center gap-3">
          <img
            src="/ots_background.png"
            alt="OTS Logo"
            class="h-10 w-auto"
            onerror="this.style.display='none'"
          >
          <div>
            <h1 class="text-lg font-bold text-primary-600">
              {{ equipmentId }} - {{ getEquipmentTypeLabel(tubeSheetDetails?.type) }}  Report
            </h1>
            <p class="text-xs text-gray-500">
              {{ surveyTypeLabel }}
            </p>
          </div>
        </div>
        <div class="text-right text-xs text-gray-500">
          <p>Page {{ page }} of {{ total }}</p>
          <p>{{ formatDate(reportDate) }}</p>
        </div>
      </div>
    </template>

    <!-- Cover Section -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-primary-500 pb-2">
        Project Details
      </h2>
      <table class="w-full text-sm border-collapse">
        <tbody>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600 w-1/3">
              Equipment ID
            </td>
            <td class="py-2 text-gray-800">
              {{ tubeSheetDetails?.equipmentId || 'N/A' }}
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              Client Name
            </td>
            <td class="py-2 text-gray-800">
              {{ tubeSheetDetails?.clientName || 'N/A' }}
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              Site Location
            </td>
            <td class="py-2 text-gray-800">
              {{ tubeSheetDetails?.clientAddress || 'N/A' }}
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              Equipment Type
            </td>
            <td class="py-2 text-gray-800">
              {{ getEquipmentTypeLabel(tubeSheetDetails?.type) }}
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              Material
            </td>
            <td class="py-2 text-gray-800">
              {{ tubeSheetDetails?.material || 'N/A' }}
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              Total No. of Tubes
            </td>
            <td class="py-2 text-gray-800">
              {{ tubeSheetDetails?.totalNoOfTubes || 0 }}
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              Number of Cameras
            </td>
            <td class="py-2 text-gray-800">
              {{ tubeSheetDetails?.numberOfCameras || 0 }}
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              Survey Type
            </td>
            <td class="py-2 text-gray-800">
              {{ surveyTypeLabel }}
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              Survey Status
            </td>
            <td class="py-2 text-gray-800">
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="surveyData?.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
              >
                {{ surveyData?.status || 'N/A' }}
              </span>
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              Start Time
            </td>
            <td class="py-2 text-gray-800">
              {{ formatDateTime(surveyData?.createdAt) }}
            </td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-2 font-medium text-gray-600">
              End Time
            </td>
            <td class="py-2 text-gray-800">
              {{ formatDateTime(surveyData?.endTimeStamp) }}
            </td>
          </tr>
          <tr>
            <td class="py-2 font-medium text-gray-600">
              Total Repeat Count
            </td>
            <td class="py-2 text-gray-800">
              {{ surveyData?.repeat || 0 }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Survey Statistics Section (hidden in condensed mode) -->
    <div v-if="!condensed" class="mb-6 mt-12" data-no-break>
      <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-primary-500 pb-2">
        Survey Statistics
      </h2>
      <div class="grid grid-cols-2 gap-6">
        <!-- Pie Chart -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 text-center">
            Detection Progress
          </h3>
          <div style="width: 280px; height: 160px; margin: 0 auto;">
            <img
              v-if="pieChartImage"
              :src="pieChartImage"
              alt="Detection Progress Chart"
              style="width: 100%; height: 100%; object-fit: contain;"
            >
            <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm italic">
              No data available
            </div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div class="text-center">
              <span class="font-medium">Total Tubes:</span> {{ totalTubes }}
            </div>
            <div class="text-center">
              <span class="font-medium">Special Tubes:</span> {{ specialTubesCount }}
            </div>
            <div class="text-center">
              <span class="font-medium">Front Detected:</span> {{ frontDetectedCount }}
            </div>
            <div class="text-center">
              <span class="font-medium">Back Detected:</span> {{ backDetectedCount }}
            </div>
          </div>
        </div>

        <!-- Hourly Efficiency Chart -->
        <div class="border border-gray-200 rounded-lg p-4">
          <div style="width: 100%; height: 160px;">
            <img
              v-if="barChartImage"
              :src="barChartImage"
              alt="Hourly Efficiency Chart"
              style="width: 100%; height: 100%; object-fit: contain;"
            >
            <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm italic">
              No hourly efficiency data available
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden chart rendering containers -->
    <div style="position: absolute; left: -9999px; top: -9999px;">
      <div ref="pieChartContainer" style="width: 280px; height: 160px;">
        <Pie
          v-if="totalTubes > 0"
          ref="pieChartRef"
          :data="chartData"
          :options="pieChartOptions"
        />
      </div>
      <div ref="barChartContainer" style="width: 300px; height: 160px;">
        <Bar
          v-if="progressData && progressData.length > 0"
          ref="barChartRef"
          :data="progressChartData"
          :options="progressChartOptions"
        />
      </div>
    </div>

    <!-- Reactor  Front View -->
    <div data-page-break class="page-break" />
    <div
      data-full-page
      data-no-header
      data-no-footer
      class="flex flex-col items-center justify-center h-full p-4"
    >
      <h2 class="text-xl font-bold text-gray-800 mb-4 text-center shrink-0">
        {{ getEquipmentTypeLabel(tubeSheetDetails?.type) }}  Front View
      </h2>
      <div class="flex-1 flex items-center justify-center w-full min-h-0">
        <svg
          ref="frontSvgRef"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          class="w-full h-full ml-20"
          style="max-width: 100%; max-height: 100%; object-fit: contain;"
        >
          <g id="front-viewport" />
        </svg>
      </div>
      <p class="text-xs text-gray-500 mt-2 shrink-0">
        Front view
      </p>
    </div>

    <!-- Reactor Layout - Back View -->
    <div data-page-break class="page-break" />
    <div
      data-full-page
      data-no-header
      data-no-footer
      class="flex flex-col items-center justify-center h-full p-4"
    >
      <h2 class="text-xl font-bold text-gray-800 mb-4 text-center shrink-0">
        {{ getEquipmentTypeLabel(tubeSheetDetails?.type) }}  Back View
      </h2>
      <div class="flex-1 flex items-center justify-center w-full min-h-0">
        <svg
          ref="backSvgRef"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          class="w-full h-full"
          style="max-width: 100%; max-height: 100%; object-fit: contain; transform: scaleX(-1);"
        >
          <g id="back-viewport" />
        </svg>
      </div>
      <p class="text-xs text-gray-500 mt-2 shrink-0">
        Back view
      </p>
    </div>

    <!-- Sections below are hidden in condensed mode (only first 3 pages) -->
    <template v-if="!condensed">
      <!-- Special Tube Details -->
      <div data-page-break class="page-break" />
      <div class="mb-6" data-no-break>
        <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-primary-500 pb-2">
          Special Tube Details
        </h2>
        <table v-if="specialTubeData.length > 0" class="w-full text-sm border-collapse border border-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                Tube ID
              </th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                Property
              </th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                Comment
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tube in specialTubeData" :key="tube.id" class="hover:bg-gray-50">
              <td class="border border-gray-200 px-3 py-2">
                {{ tube.id }}
              </td>
              <td class="border border-gray-200 px-3 py-2">
                <span class="inline-flex items-center gap-1">
                  <span
                    class="w-3 h-3 rounded-full inline-block"
                    :style="{ backgroundColor: tube.propertyColor }"
                  />
                  {{ tube.propertyLabel }}
                </span>
              </td>
              <td class="border border-gray-200 px-3 py-2">
                {{ tube.comment || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-gray-500 italic">
          No special tubes configured.
        </p>
      </div>

      <!-- Comments Section -->
      <div v-if="commentsData.length > 0" class="mb-6" data-no-break>
        <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-primary-500 pb-2">
          Survey Comments
        </h2>
        <table class="w-full text-sm border-collapse border border-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                Tube ID
              </th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                Comment
              </th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comment in commentsData" :key="comment._id" class="hover:bg-gray-50">
              <td class="border border-gray-200 px-3 py-2">
                {{ comment.tubeIdAsperLayout }}
              </td>
              <td class="border border-gray-200 px-3 py-2">
                {{ comment.comment }}
              </td>
              <td class="border border-gray-200 px-3 py-2">
                {{ formatDateTime(comment.timeStamp) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Camera Details -->
      <div v-if="tubeSheetDetails?.cameras && tubeSheetDetails.cameras.length > 0" class="mb-6" data-no-break>
        <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-primary-500 pb-2">
          Camera Details
        </h2>
        <table class="w-full text-sm border-collapse border border-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                #
              </th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                Camera ID
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(camera, index) in tubeSheetDetails?.cameras || []" :key="index" class="hover:bg-gray-50">
              <td class="border border-gray-200 px-3 py-2">
                {{ index + 1 }}
              </td>
              <td class="border border-gray-200 px-3 py-2">
                {{ camera }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Color Cap Tracking Details -->
      <div v-if="isColorCapTrackingSurvey && colorCapLegend.length > 0" class="mb-6" data-no-break>
        <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-primary-500 pb-2">
          Color Cap Tracking Details
        </h2>
        <table class="w-full text-sm border-collapse border border-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                Color
              </th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                Abbreviation
              </th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">
                Front Count
              </th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">
                Back Count
              </th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in colorCapLegend" :key="item.key" class="hover:bg-gray-50">
              <td class="border border-gray-200 px-3 py-2">
                <span class="inline-flex items-center gap-2">
                  <span
                    class="w-4 h-4 rounded border border-gray-300"
                    :style="{ backgroundColor: item.color }"
                  />
                  {{ item.color }}
                </span>
              </td>
              <td class="border border-gray-200 px-3 py-2 font-medium">
                {{ item.abbreviation }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center">
                {{ item.frontCount }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center">
                {{ item.backCount }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center font-bold">
                {{ item.frontCount + item.backCount }}
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-100">
            <tr>
              <td colspan="2" class="border border-gray-200 px-3 py-2 font-bold text-gray-700">
                Total
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center font-bold">
                {{ colorCapLegend.reduce((sum, item) => sum + item.frontCount, 0) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center font-bold">
                {{ colorCapLegend.reduce((sum, item) => sum + item.backCount, 0) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center font-bold">
                {{ colorCapLegend.reduce((sum, item) => sum + item.frontCount + item.backCount, 0) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Survey Data Table -->
      <div data-page-break class="page-break" />
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-primary-500 pb-2">
          Survey Detection Data
        </h2>
        <table v-if="detectionData.length > 0" class="w-full text-sm border-collapse border border-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700">
                S.No
              </th>
              <th class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700">
                Tube ID
              </th>
              <th class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700">
                Layout ID
              </th>
              <th class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700">
                Activity
              </th>
              <th class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700">
                Face
              </th>
              <th class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700">
                Status
              </th>
              <th class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in detectionData" :key="item._id" class="hover:bg-gray-50">
              <td class="border border-gray-200 px-2 py-1 text-xs">
                {{ index + 1 }}
              </td>
              <td class="border border-gray-200 px-2 py-1 text-xs">
                {{ item.tubeId }}
              </td>
              <td class="border border-gray-200 px-2 py-1 text-xs">
                {{ item.tubeIdAsperLayout }}
              </td>
              <td class="border border-gray-200 px-2 py-1 text-xs">
                {{ item.activity }}
              </td>
              <td class="border border-gray-200 px-2 py-1 text-xs capitalize">
                {{ item.face || 'front' }}
              </td>
              <td class="border border-gray-200 px-2 py-1 text-xs">
                <span
                  class="px-1.5 py-0.5 rounded text-xs"
                  :class="item.isDuplicate ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'"
                >
                  {{ item.isDuplicate ? 'Duplicate' : 'Detected' }}
                </span>
              </td>
              <td class="border border-gray-200 px-2 py-1 text-xs">
                {{ formatDateTime(item.timeStamp) }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-gray-500 italic">
          No detection data available.
        </p>
      </div>
    </template>

    <template #footer="{ page, total }">
      <div class="flex justify-between items-center border-t border-gray-200 pt-2 text-xs text-gray-500">
        <span>Generated by OTS Dashboard</span>
        <span>{{ equipmentId }} | Page {{ page }} of {{ total }}</span>
      </div>
    </template>
  </PageDocument>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import type { Tube, ReactorConfig } from '@/types'
import { tubeSheetTypeItems, typeOfPhases } from '@/utils/tubesheetOptions'
import { drawBoundary } from '@/utils/svgHelpers'
import { ensureLayers } from '@/utils/index'
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
)

interface SurveyDataItem {
  tubeId: number
  tubeIdAsperLayout: string
  activity: string
  color: string
  timeStamp: string
  isDetected: boolean
  isDuplicate?: boolean
  face?: string
  _id: string
}

interface CommentItem {
  tubeIdAsperLayout: string
  comment: string
  timeStamp: string
  _id: string
}

interface TubeSheetData {
  _id?: string
  equipmentId?: string
  clientName?: string
  clientAddress?: string
  type?: string
  material?: string
  totalNoOfTubes?: number
  numberOfCameras?: number
  cameras?: string[]
  typeOfPhases?: string[]
}

interface SurveyInfo {
  _id?: string
  status?: string
  surveyType?: string
  repeat?: number
  createdAt?: string
  endTimeStamp?: string
  data?: SurveyDataItem[]
  comments?: CommentItem[]
}

interface ReactorData {
  config: ReactorConfig
  tubes: Tube[]
}

interface ProgressDataItem {
  time: string
  tubes: number
}

interface PhaseData {
  phaseName: string
  configs?: Record<string, { color: string, abbreviation: string }>
}

const props = defineProps<{
  tubeSheetDetails: TubeSheetData | null
  surveyData: SurveyInfo | null
  reactorData: ReactorData | null
  progressData?: ProgressDataItem[]
  phasesData?: PhaseData[]
  condensed?: boolean
}>()

const pageDocRef = ref()
const frontSvgRef = ref<SVGSVGElement | null>(null)
const backSvgRef = ref<SVGSVGElement | null>(null)

// Chart refs and images
const pieChartRef = ref()
const barChartRef = ref()
const pieChartImage = ref<string | null>(null)
const barChartImage = ref<string | null>(null)

// PDF page content area (A4 with padding, accounting for header space)
const pdfContentWidth = 714 // A4 width (794) - 2 * padding (40)
const pdfContentHeight = 650 // Available height for SVG (leaving room for title and caption)

const propertiesOptions = [
  { label: 'Catalyst Tc', value: 'CATALYST_TC', color: '#FF6B6B' },
  { label: 'Coolant', value: 'COOLANT', color: '#4ECDC4' },
  { label: 'Solid', value: 'SOLID', color: '#556270' },
  { label: 'Bend', value: 'BEND', color: '#C7F464' },
  { label: 'Salt Tc', value: 'SALT_TC', color: '#FFA500' },
  { label: 'Blocked', value: 'BLOCKED', color: '#1E90FF' }
]

const equipmentId = computed(() => props.tubeSheetDetails?.equipmentId || 'N/A')
const reportDate = computed(() => new Date())

const surveyTypeLabel = computed(() => {
  const surveyType = props.surveyData?.surveyType
  if (!surveyType) return 'N/A'
  const found = typeOfPhases.find(p => p.value === surveyType)
  return found?.label || surveyType
})

const detectionData = computed(() => {
  return props.surveyData?.data || []
})

const commentsData = computed(() => {
  return props.surveyData?.comments || []
})

const specialTubeData = computed(() => {
  if (!props.reactorData?.tubes) return []

  return props.reactorData.tubes
    .filter(t => t.property && !t.deleted)
    .map((t) => {
      const prop = propertiesOptions.find(p => p.value === t.property)
      return {
        id: t.id,
        property: t.property,
        propertyLabel: prop?.label || t.property,
        propertyColor: prop?.color || t.propertyColor || '#gray',
        comment: t.comment || ''
      }
    })
})

// Color Cap Tracking Legend - counts tubes by color for COLOR_CAP_TRACKING phase
const isColorCapTrackingSurvey = computed(() => {
  return props.surveyData?.surveyType === 'COLOR_CAP_TRACKING'
})

const colorCapLegend = computed(() => {
  // Only compute for COLOR_CAP_TRACKING surveys
  if (!isColorCapTrackingSurvey.value) return []

  // Find the COLOR_CAP_TRACKING phase config
  const colorCapPhase = props.phasesData?.find(
    (p: PhaseData) => p.phaseName === 'COLOR_CAP_TRACKING'
  )
  if (!colorCapPhase?.configs) return []

  const configs = colorCapPhase.configs

  // Build color name to config mapping
  const colorConfigMap = new Map<string, { color: string, abbreviation: string, key: string }>()
  for (const [key, value] of Object.entries(configs)) {
    const config = value as { color: string, abbreviation: string }
    if (config.color && config.abbreviation) {
      // Normalize color name for matching (lowercase)
      colorConfigMap.set(config.color.toLowerCase(), {
        color: config.color,
        abbreviation: config.abbreviation,
        key
      })
    }
  }

  // Count colors from survey data items (not tube properties)
  const frontCounts = new Map<string, number>()
  const backCounts = new Map<string, number>()
  const surveyDataItems = props.surveyData?.data || []

  for (const item of surveyDataItems) {
    // Skip duplicates to avoid double counting
    if (item.isDuplicate) continue

    const normalizedColor = item.color?.toLowerCase()
    if (!normalizedColor || !colorConfigMap.has(normalizedColor)) continue

    if (item.face === 'back') {
      backCounts.set(normalizedColor, (backCounts.get(normalizedColor) || 0) + 1)
    } else {
      frontCounts.set(normalizedColor, (frontCounts.get(normalizedColor) || 0) + 1)
    }
  }

  // Build legend items from configs
  const legend: { key: string, color: string, abbreviation: string, frontCount: number, backCount: number }[] = []
  for (const [colorName, config] of colorConfigMap) {
    legend.push({
      key: config.key,
      color: config.color,
      abbreviation: config.abbreviation,
      frontCount: frontCounts.get(colorName) || 0,
      backCount: backCounts.get(colorName) || 0
    })
  }

  return legend
})

// Statistics for charts
const totalTubes = computed(() => props.tubeSheetDetails?.totalNoOfTubes || props.reactorData?.tubes?.filter(t => !t.deleted).length || 0)

const specialTubesCount = computed(() => {
  if (!props.reactorData?.tubes) return 0
  return props.reactorData.tubes.filter(t => t.property && !t.deleted).length
})

const frontDetectedCount = computed(() => {
  if (!props.surveyData?.data) return 0
  return props.surveyData.data.filter(d => d.face !== 'back' && !d.isDuplicate).length
})

const backDetectedCount = computed(() => {
  if (!props.surveyData?.data) return 0
  return props.surveyData.data.filter(d => d.face === 'back' && !d.isDuplicate).length
})

const effectiveTotal = computed(() => Math.max(0, totalTubes.value - specialTubesCount.value))
const completedCount = computed(() => frontDetectedCount.value + backDetectedCount.value)
const remainingCount = computed(() => Math.max(0, effectiveTotal.value - completedCount.value))

// Pie Chart Data
const chartData = computed(() => ({
  labels: ['Front Detected', 'Back Detected', 'Remaining', 'Special Tubes'],
  datasets: [
    {
      data: [frontDetectedCount.value, backDetectedCount.value, remainingCount.value, specialTubesCount.value],
      backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0'],
      borderWidth: 1
    }
  ]
}))

// Pie chart options for image rendering
const pieChartOptions = {
  responsive: false,
  maintainAspectRatio: false,
  animation: false as const,
  plugins: {
    legend: {
      position: 'right' as const,
      align: 'center' as const,
      labels: { boxWidth: 12, font: { size: 10 } }
    },
    tooltip: { enabled: false }
  }
}

// Progress Bar Chart Data (Hourly Efficiency)
const progressChartData = computed(() => ({
  labels: (props.progressData || []).map((p) => {
    const date = new Date(p.time)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }),
  datasets: [
    {
      label: 'Tubes Completed',
      data: (props.progressData || []).map(p => p.tubes),
      backgroundColor: '#4CAF50',
      borderColor: '#388E3C',
      borderWidth: 1,
      borderRadius: 4
    }
  ]
}))

const progressChartOptions = {
  responsive: false,
  maintainAspectRatio: false,
  animation: false as const,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: 'Hourly Efficiency',
      font: { size: 12 }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: false
      },
      ticks: {
        maxRotation: 45,
        font: { size: 8 }
      }
    },
    y: {
      display: true,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Tubes',
        font: { size: 10 }
      },
      ticks: {
        font: { size: 9 }
      }
    }
  }
}

function getEquipmentTypeLabel(value?: string) {
  if (!value) return 'N/A'
  const item = tubeSheetTypeItems.find(t => t.value === value)
  return item?.label || value
}

function formatDate(date?: Date | string) {
  if (!date) return 'N/A'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
}

function formatDateTime(date?: string) {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function renderReactorSvg(svgEl: SVGSVGElement | null, isBackView: boolean = false) {
  if (!svgEl || !props.reactorData) return

  const config = props.reactorData.config
  const tubes = props.reactorData.tubes
  const activeTubes = tubes.filter(t => !t.deleted)

  if (activeTubes.length === 0) return

  // Use a fixed internal scale for positioning (same as the editor's scalePx)
  const scalePx = 2

  // Compute actual bounding box from tube positions in scaled coordinates
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const t of activeTubes) {
    const cx = t.x * scalePx
    const cy = t.y * scalePx
    const r = t.r * scalePx
    minX = Math.min(minX, cx - r)
    maxX = Math.max(maxX, cx + r)
    minY = Math.min(minY, cy - r)
    maxY = Math.max(maxY, cy + r)
  }

  // Also account for boundary shape
  // For circles/donuts/hexagons, outerDimension is the radius (not diameter)
  // For rectangles, width/height are the full dimensions
  const outerDim = config.outerDimension || 100
  const boundaryPadding = 10 // Extra padding to prevent boundary from getting cut
  let halfW: number, halfH: number
  if (config.shape === 'RECTANGLE') {
    halfW = ((config.width || outerDim) / 2) * scalePx
    halfH = ((config.height || outerDim) / 2) * scalePx
  } else {
    // For CIRCLE, DONUT, HEXAGONE - outerDimension is the radius
    halfW = outerDim * scalePx + boundaryPadding
    halfH = outerDim * scalePx + boundaryPadding
  }
  const pad = config.padding * scalePx
  minX = Math.min(minX, -halfW - pad)
  maxX = Math.max(maxX, halfW + pad)
  minY = Math.min(minY, -halfH - pad)
  maxY = Math.max(maxY, halfH + pad)

  const contentW = maxX - minX
  const contentH = maxY - minY

  // Apply rotation from config and expand bounds to contain rotated content
  const rotation = config.positions?.rotation || 0
  const rad = (Math.abs(rotation) * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const rotatedW = contentW * cos + contentH * sin
  const rotatedH = contentW * sin + contentH * cos

  // Add margin for row labels and breathing room
  const rowLabelMargin = 60
  const padding = 30
  const vbW = rotatedW + rowLabelMargin + padding * 2
  const vbH = rotatedH + padding * 2

  // Center point in viewBox coordinates
  const centerX = padding + rotatedW / 2
  const centerY = padding + rotatedH / 2

  // Set viewBox only — let CSS max-w-full / max-h-[650px] + preserveAspectRatio handle fitting
  svgEl.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`)
  svgEl.removeAttribute('width')
  svgEl.removeAttribute('height')

  const vpId = isBackView ? 'back-viewport' : 'front-viewport'
  const vp = svgEl.querySelector(`#${vpId}`) as SVGGElement
  if (!vp) return

  vp.innerHTML = ''

  // Only apply rotation (NOT the user's interactive pan/zoom — that's for the editor)
  if (rotation !== 0) {
    vp.setAttribute('transform', `rotate(${rotation} ${centerX} ${centerY})`)
  } else {
    vp.removeAttribute('transform')
  }

  const fitScale = scalePx

  // Create layers
  const { boundary, tubes: tubesLayer } = ensureLayers(vp)

  // Draw boundary with calculated scale
  drawBoundary(boundary, config, centerX, centerY, fitScale)

  // Get survey data for coloring
  const surveyDataItems = props.surveyData?.data || []
  const surveyComments = props.surveyData?.comments || []

  // Build a map of tube colors and repeat counts from survey data (similar to survey-details page)
  const tubeColorMap = new Map<string, { frontColor?: string, backColor?: string }>()
  const tubeRepeatCounts = new Map<string, { front: number, back: number }>()

  for (const d of surveyDataItems) {
    const tubeId = d.tubeIdAsperLayout
    if (!tubeColorMap.has(tubeId)) {
      tubeColorMap.set(tubeId, {})
    }
    if (!tubeRepeatCounts.has(tubeId)) {
      tubeRepeatCounts.set(tubeId, { front: 0, back: 0 })
    }

    const entry = tubeColorMap.get(tubeId)!
    const counts = tubeRepeatCounts.get(tubeId)!

    if (d.face === 'back') {
      entry.backColor = d.color
      counts.back++
    } else {
      entry.frontColor = d.color
      counts.front++
    }
  }

  // Build a map of comments per tube (from survey comments and tube comments)
  const tubeCommentsMap = new Map<string, boolean>()
  for (const c of surveyComments) {
    if (c.comment) {
      tubeCommentsMap.set(c.tubeIdAsperLayout, true)
    }
  }

  // Draw tubes
  for (const t of tubes) {
    if (t.deleted) continue

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', String(centerX + t.x * fitScale))
    circle.setAttribute('cy', String(centerY + t.y * fitScale))
    circle.setAttribute('r', String(t.r * fitScale))

    // Determine fill color based on survey data and view
    // Following the same logic as survey-details page
    let fillColor = '#fff'
    const tubeColors = tubeColorMap.get(t.id)

    if (isBackView) {
      // For back view: use backColor from survey data or existing tube backColor
      fillColor = tubeColors?.backColor || t.backColor || '#fff'
    } else {
      // For front view: use frontColor from survey data or existing propertyColor
      fillColor = tubeColors?.frontColor || t.propertyColor || '#fff'
    }

    // Override with property color if exists (for special tubes like CATALYST_TC, etc.)
    if (t.property && !tubeColors) {
      const prop = propertiesOptions.find(p => p.value === t.property)
      if (prop) {
        fillColor = prop.color
      }
    }

    circle.setAttribute('fill', fillColor)
    circle.setAttribute('stroke', t.comment ? '#facc15' : '#0f172a')
    circle.setAttribute('stroke-width', t.comment ? '1.5' : '0.3')

    // Apply invert filter for back view (same as survey-details)
    if (isBackView && (tubeColors?.backColor || t.backColor)) {
      circle.setAttribute('filter', 'url(#invert-filter)')
    }

    tubesLayer.appendChild(circle)
  }

  // Create icons layer for repeat counts and comment indicators
  let iconsLayer = vp.querySelector('#icons-layer') as SVGGElement
  if (!iconsLayer) {
    iconsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    iconsLayer.setAttribute('id', 'icons-layer')
    vp.appendChild(iconsLayer)
  }

  // Draw icons for each tube (repeat counts and comments)
  for (const t of tubes) {
    if (t.deleted) continue

    const cx = centerX + t.x * fitScale
    const cy = centerY + t.y * fitScale
    const r = t.r * fitScale

    // Check for repeat counts
    const repeatCounts = tubeRepeatCounts.get(t.id)
    const repeatCount = isBackView ? (repeatCounts?.back || 0) : (repeatCounts?.front || 0)

    // Check for comments (from survey comments or tube comments)
    const hasComment = !!(t.comment || tubeCommentsMap.get(t.id))

    // Skip if no icons needed
    if (repeatCount <= 1 && !hasComment) continue

    // Create icon group for this tube
    const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    iconGroup.setAttribute('class', 'tube-icons')
    iconGroup.setAttribute('pointer-events', 'none')

    // For back view, counter-flip icons to keep them readable
    if (isBackView) {
      iconGroup.setAttribute('transform', `scale(-1, 1) translate(${-2 * cx}, 0)`)
    }

    const iconSize = Math.max(r * 0.7, 3)

    // Draw repeat count inside tube if > 1
    if (repeatCount > 1) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', String(cx))
      text.setAttribute('y', String(cy))
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'central')
      text.setAttribute('fill', '#ef4444')
      text.setAttribute('font-size', String(Math.max(r * 1.1, 4)))
      text.setAttribute('font-weight', 'bold')
      text.setAttribute('font-family', 'Arial, sans-serif')
      text.textContent = String(repeatCount)
      iconGroup.appendChild(text)
    }

    // Draw comment icon to the right of tube if has comment
    if (hasComment) {
      const commentIcon = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      const s = iconSize
      commentIcon.setAttribute('transform', `translate(${cx + r + 1}, ${cy - s * 0.6})`)

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', `M0,0 h${s * 1.2} q${s * 0.3},0 ${s * 0.3},${s * 0.3} v${s * 0.5} q0,${s * 0.3} -${s * 0.3},${s * 0.3} h-${s * 0.5} l-${s * 0.3},${s * 0.3} v-${s * 0.3} h-${s * 0.1} q-${s * 0.3},0 -${s * 0.3},-${s * 0.3} v-${s * 0.5} q0,-${s * 0.3} ${s * 0.3},-${s * 0.3} z`)
      path.setAttribute('fill', '#3b82f6')
      path.setAttribute('opacity', '0.9')
      commentIcon.appendChild(path)

      iconGroup.appendChild(commentIcon)
    }

    iconsLayer.appendChild(iconGroup)
  }

  // Group tubes by row and add row labels with tube counts
  const rowData = new Map<number, { count: number, maxX: number, avgY: number, tubes: typeof tubes }>()

  for (const t of tubes) {
    if (t.deleted) continue

    // Extract row number from tube ID (e.g., "R1C2" -> 1)
    const match = t.id.match(/^R(\d+)C/)
    if (!match || !match[1]) continue

    const rowNum = parseInt(match[1], 10)
    const tubeX = centerX + t.x * fitScale
    const tubeY = centerY + t.y * fitScale

    if (!rowData.has(rowNum)) {
      rowData.set(rowNum, { count: 0, maxX: tubeX, avgY: tubeY, tubes: [] })
    }

    const row = rowData.get(rowNum)!
    row.count++
    row.maxX = Math.max(row.maxX, tubeX + t.r * fitScale)
    // Calculate running average Y position
    row.avgY = ((row.avgY * (row.count - 1)) + tubeY) / row.count
  }

  // Create a labels layer for row info
  let labelsLayer = vp.querySelector('#row-labels') as SVGGElement
  if (!labelsLayer) {
    labelsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    labelsLayer.setAttribute('id', 'row-labels')
    vp.appendChild(labelsLayer)
  }

  // Sort rows by row number and add labels
  const sortedRows = Array.from(rowData.entries()).sort((a, b) => a[0] - b[0])
  const labelOffset = 20 // Offset from the rightmost tube

  for (const [rowNum, data] of sortedRows) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    // Position label to the right of the rightmost tube in the row
    // For back view, we need to position on the left side (which appears on right after flip)
    const xPos = isBackView
      ? centerX - (data.maxX - centerX) - labelOffset
      : data.maxX + labelOffset
    text.setAttribute('x', String(xPos))
    text.setAttribute('y', String(data.avgY))
    text.setAttribute('font-size', '9')
    text.setAttribute('font-family', 'Arial, sans-serif')
    text.setAttribute('font-weight', 'bold')
    text.setAttribute('fill', '#374151')
    text.setAttribute('dominant-baseline', 'middle')

    // For back view, flip the text horizontally so it's readable after the SVG scaleX(-1)
    if (isBackView) {
      text.setAttribute('transform', `scale(-1, 1) translate(${-2 * xPos}, 0)`)
      text.setAttribute('text-anchor', 'start')
    } else {
      text.setAttribute('text-anchor', 'start')
    }
    text.textContent = `R${rowNum}: ${data.count}`

    labelsLayer.appendChild(text)
  }

  // Add invert filter definition for back view if needed
  if (isBackView) {
    let defs = svgEl.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      svgEl.insertBefore(defs, svgEl.firstChild)
    }
    if (!defs.querySelector('#invert-filter')) {
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
      filter.setAttribute('id', 'invert-filter')
      const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix')
      feColorMatrix.setAttribute('type', 'matrix')
      feColorMatrix.setAttribute('values', '-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0')
      filter.appendChild(feColorMatrix)
      defs.appendChild(filter)
    }
  }
}

// Function to generate chart images from canvas
async function generateChartImages() {
  await nextTick()

  // Wait a bit for charts to fully render
  await new Promise(resolve => setTimeout(resolve, 100))
  // Get pie chart image
  if (pieChartRef.value?.chart) {
    const canvas = pieChartRef.value.chart.canvas as HTMLCanvasElement
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      pieChartImage.value = canvas.toDataURL('image/png')
    }
  }

  // Get bar chart image
  if (barChartRef.value?.chart) {
    const canvas = barChartRef.value.chart.canvas as HTMLCanvasElement
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      barChartImage.value = canvas.toDataURL('image/png')
    }
  }

  // Trigger repagination after images are ready
  await nextTick()
  if (pageDocRef.value?.repaginate) {
    pageDocRef.value.repaginate()
  }
}

onMounted(async () => {
  await nextTick()

  // Render both front and back SVGs
  renderReactorSvg(frontSvgRef.value, false)
  renderReactorSvg(backSvgRef.value, true)

  // Generate chart images
  await generateChartImages()

  // Trigger repagination after SVGs are rendered
  await nextTick()
  if (pageDocRef.value?.repaginate) {
    pageDocRef.value.repaginate()
  }
})

// Watch for reactorData changes and re-render SVGs
watch(
  () => props.reactorData,
  async (newData) => {
    if (newData) {
      await nextTick()
      renderReactorSvg(frontSvgRef.value, false)
      renderReactorSvg(backSvgRef.value, true)
      await nextTick()
      if (pageDocRef.value?.repaginate) {
        pageDocRef.value.repaginate()
      }
    }
  },
  { deep: true }
)

// Watch for surveyData changes to update tube colors
watch(
  () => props.surveyData,
  async (newData) => {
    if (newData && props.reactorData) {
      await nextTick()
      renderReactorSvg(frontSvgRef.value, false)
      renderReactorSvg(backSvgRef.value, true)
      // Regenerate chart images when survey data changes
      await generateChartImages()
    }
  },
  { deep: true }
)

// Watch for progressData changes to regenerate chart images
watch(
  () => props.progressData,
  async (newData) => {
    if (newData && newData.length > 0) {
      await generateChartImages()
    }
  },
  { deep: true }
)

defineExpose({
  repaginate: () => pageDocRef.value?.repaginate?.()
})
</script>
