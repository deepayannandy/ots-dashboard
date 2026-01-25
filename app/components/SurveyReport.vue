<template>
  <PageDocument
    ref="pageDocRef"
    size="A4"
    orientation="portrait"
    :padding="40"
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
              {{ equipmentId }} - Reactor Technical Report
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
        Reactor Details
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

    <!-- Reactor Layout - Front View -->
    <div data-page-break class="page-break" />
    <div
      data-full-page
      data-no-header
      data-no-footer
      class="flex flex-col items-center justify-center h-full p-4"
    >
      <h2 class="text-xl font-bold text-gray-800 mb-4 text-center">
        Reactor Layout - Front View
      </h2>
      <div class="flex-1 flex items-center justify-center w-full overflow-hidden">
        <svg
          ref="frontSvgRef"
          viewBox="0 0 800 800"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          class="max-w-full max-h-[650px] w-auto h-auto"
        >
          <g id="front-viewport" />
        </svg>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Front view of reactor tube layout
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
      <h2 class="text-xl font-bold text-gray-800 mb-4 text-center">
        Reactor Layout - Back View
      </h2>
      <div class="flex-1 flex items-center justify-center w-full overflow-hidden">
        <svg
          ref="backSvgRef"
          viewBox="0 0 800 800"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          class="max-w-full max-h-[650px] w-auto h-auto"
          style="transform: scaleX(-1);"
        >
          <g id="back-viewport" />
        </svg>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Back view of reactor tube layout (mirrored)
      </p>
    </div>

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

const props = defineProps<{
  tubeSheetDetails: TubeSheetData | null
  surveyData: SurveyInfo | null
  reactorData: ReactorData | null
}>()

const pageDocRef = ref()
const frontSvgRef = ref<SVGSVGElement | null>(null)
const backSvgRef = ref<SVGSVGElement | null>(null)

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
    minute: '2-digit'
  })
}

function renderReactorSvg(svgEl: SVGSVGElement | null, isBackView: boolean = false) {
  if (!svgEl || !props.reactorData) return

  const config = props.reactorData.config
  const tubes = props.reactorData.tubes

  // Calculate reactor dimensions based on config
  let reactorWidth: number
  let reactorHeight: number

  if (config.shape === 'RECTANGLE') {
    reactorWidth = (config.width || config.outerDimension) + config.padding * 2
    reactorHeight = (config.height || config.outerDimension) + config.padding * 2
  } else {
    // CIRCLE, HEXAGONE, DONUT - use outerDimension as diameter
    reactorWidth = config.outerDimension + config.padding * 2
    reactorHeight = config.outerDimension + config.padding * 2
  }

  // Calculate scale to fit reactor within PDF content area
  const scaleX = pdfContentWidth / reactorWidth
  const scaleY = pdfContentHeight / reactorHeight
  const fitScale = Math.min(scaleX, scaleY, 1.5) // Cap at 1.5 to prevent over-scaling small reactors

  // Calculate SVG dimensions
  const svgWidth = reactorWidth * fitScale
  const svgHeight = reactorHeight * fitScale
  const centerX = svgWidth / 2
  const centerY = svgHeight / 2

  // Update SVG viewBox and dimensions
  svgEl.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
  svgEl.setAttribute('width', String(svgWidth))
  svgEl.setAttribute('height', String(svgHeight))

  const vpId = isBackView ? 'back-viewport' : 'front-viewport'
  const vp = svgEl.querySelector(`#${vpId}`) as SVGGElement
  if (!vp) return

  // Clear existing content
  vp.innerHTML = ''

  // Apply config.positions transformations if available
  // Center the viewport and apply scale and rotation around the center
  if (config.positions) {
    const { scale, rotation } = config.positions
    const transform = `translate(${centerX}, ${centerY}) rotate(${rotation}) scale(${scale}) translate(${-centerX}, ${-centerY})`
    vp.setAttribute('transform', transform)
  } else {
    vp.removeAttribute('transform')
  }

  // Create layers
  const { boundary, tubes: tubesLayer } = ensureLayers(vp)

  // Draw boundary with calculated scale
  drawBoundary(boundary, config, centerX, centerY, fitScale)

  // Get survey data for coloring
  const surveyDataItems = props.surveyData?.data || []

  // Build a map of tube colors from survey data (similar to survey-details page)
  const tubeColorMap = new Map<string, { frontColor?: string, backColor?: string }>()
  for (const d of surveyDataItems) {
    const tubeId = d.tubeIdAsperLayout
    if (!tubeColorMap.has(tubeId)) {
      tubeColorMap.set(tubeId, {})
    }
    const entry = tubeColorMap.get(tubeId)!
    if (d.face === 'back') {
      entry.backColor = d.color
    } else {
      entry.frontColor = d.color
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

onMounted(async () => {
  await nextTick()

  // Render both front and back SVGs
  renderReactorSvg(frontSvgRef.value, false)
  renderReactorSvg(backSvgRef.value, true)

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
    }
  },
  { deep: true }
)

defineExpose({
  repaginate: () => pageDocRef.value?.repaginate?.()
})
</script>
