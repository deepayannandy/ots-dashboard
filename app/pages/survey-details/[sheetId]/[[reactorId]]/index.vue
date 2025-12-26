<template>
  <UDashboardPanel id="create-tubesheet" :ui="{ body: '!p-0' }">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <div class="flex flex-col">
            <span class="font-semibold text-sm">
              {{ tubeSheetDetails?.equipmentId }} {{ currentSurvey? `- ${currentSurvey}` : '' }}
            </span>
            <span class="text-xs text-neutral-600 dark:text-neutral-400">
              {{ currentSurveyTime ? `Last Update: ${currentSurveyTime}` : '' }}
            </span>
          </div>
        </template>
        <template #right>
          <UFieldGroup>
            <UInput value="Individual Tube Address" disabled class="cursor-grab! font-bold w-full" />
            <UInput
              v-model="searchValue"
              placeholder="Search Tubes"
              leading-icon="i-lucide-search"
              class="min-w-96 max-w-60"
              @update:model-value="searchValue = $event.toUpperCase()"
            />

            <UButton
              color="neutral"
              variant="subtle"
              label="Search"
              @click="searchTubes"
            />
            <UButton
              color="neutral"
              variant="subtle"
              label="Reset"
              @click="searchValue = ''; deselectAll(); resetView()"
            />
          </UFieldGroup>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #right>
          <UFieldGroup>
            <UInput value="Phases:" disabled class="cursor-grab! font-bold max-w-18" />
            <USelectMenu
              v-model="selectedPhase"
              placeholder="Select Phase"
              :items="typeOfPhasesItems"
              value-key="value"
              class="min-w-64"
              :disabled="loading"
            />
          </UFieldGroup>
          <UButton
            :label="loading ? 'Stop Survey' : 'Start Survey'"
            color="primary"
            :icon="loading ? 'i-lucide-stop-circle' : 'i-lucide-target'"
            :disabled="!selectedPhase"
            @click="loading ? openStopModal() : stratSurvey()"
          />
          <UButton
            color="neutral"
            variant="subtle"
            :icon="isRightOpen ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
            @click="isRightOpen = !isRightOpen"
          />
        </template>
        <template #left>
          <UButton
            color="neutral"
            variant="subtle"
            label="Info"
            @click="showDetails = !showDetails"
          />
          <URadioGroup
            v-model="viewDisplay"
            indicator="hidden"
            variant="card"
            size="xs"
            orientation="horizontal"
            default-value=""
            :items="items"
          />
        </template>
      </UDashboardToolbar>
    </template>
    <template #body>
      <UPage class="flex gap-0" :ui="pageUi">
        <UPageBody
          class="select-none bg-[linear-gradient(to_right,#e5e7eb_.5px,transparent_.5px),linear-gradient(to_bottom,#e5e7eb_.5px,transparent_.5px)] bg-size-[20px_20px] dark:bg-[linear-gradient(to_right,#2d2d2d_.5px,transparent_.5px),linear-gradient(to_bottom,#2d2d2d_.5px,transparent_.5px)] dark:bg-size-[20px_20px] dark:bg-neutral-950 bg-white  max-h-[calc(100dvh-var(--ui-header-height)-49px)] min-h-[calc(100dvh-var(--ui-header-height)-49px)] w-full flex justify-center items-center"
          :class="bodyClass"
        >
          <!--  @click="deselectAll"
            @contextmenu.prevent -->
          <div class="h-full p-10 w-full flex justify-center items-center ">
            <!-- SVG Canvas -->
            <svg
              ref="svgRef"
              :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMinYMin meet"
              :style="{
                width: '100%',
                height: '100%',
                ...(viewDisplay==='Back View' ? { transform: 'scale(-1,1)', transformOrigin: 'center', transformBox: 'fill-box' } : {})
              }"
              :class="viewDisplay==='Back View' ? 'invert' : ''"
            >
              <g id="viewport" :transform="transformStr" />
            </svg>

            <!-- Zoom Controls -->
            <!-- Optional: show selected IDs -->
          </div>
          <!-- Backend Progress Indicator -->
          <!-- Tubesheet Details Card -->
          <UPageCard
            v-if="tubeSheetDetails && showDetails"
            spotlight
            spotlight-color="secondary"
            class="absolute top-6 left-6 z-50 bg-white/90 dark:bg-black/90 p-0 rounded-2xl max-w-sm"
          >
            <div class="space-y-3">
              <h3 class="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                {{ tubeSheetDetails.clientName }}
              </h3>
              <div class="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                <p><span class="font-medium">Equipment ID:</span> {{ tubeSheetDetails.equipmentId || 'N/A' }}</p>
                <p><span class="font-medium">Type:</span> {{ getEquipmentTypeLabel(tubeSheetDetails.type) }}</p>
                <p><span class="font-medium">Site:</span> {{ tubeSheetDetails.clientAddress }}</p>
                <p><span class="font-medium">Material:</span> {{ tubeSheetDetails.material || 'N/A' }}</p>
                <p><span class="font-medium">Total Tubes:</span> {{ tubeSheetDetails.totalNoOfTubes || 0 }}</p>
                <p><span class="font-medium">Cameras:</span> {{ tubeSheetDetails.numberOfCameras || 0 }}</p>
                <div v-if="getPhaseLabels(tubeSheetDetails.typeOfPhases).length > 0">
                  <p class="font-medium mb-1">
                    Phases:
                  </p>
                  <ul class="list-disc list-inside space-y-0.5 ml-2">
                    <li v-for="(phase, idx) in getPhaseLabels(tubeSheetDetails.typeOfPhases)" :key="idx" class="text-[11px]">
                      {{ phase }}
                    </li>
                  </ul>
                </div>
                <p>
                  <span class="font-medium">Status:</span>
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300': tubeSheetDetails.status === 'TUBE_SHEET_CREATED',
                      'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300': tubeSheetDetails.status === 'CAMERA_CONFIGURED',
                      'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300': tubeSheetDetails.status === 'REACTOR_CREATED',
                      'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300': tubeSheetDetails.status === 'CAMERA_CALIBRATED',
                      'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300': tubeSheetDetails.status === 'UNDER_SURVEY'
                    }"
                  >
                    {{ tubeSheetStatusLabels[tubeSheetDetails.status] || 'N/A' }}
                  </span>
                </p>
              </div>
            </div>
          </UPageCard>
          <div class="fixed bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
            <div class="flex flex-col items-center gap-2 z-50 bg-white dark:bg-black shadow-lg p-2 rounded-lg w-fit pointer-events-auto">
              <ZoomControls
                @zoom-in="zoomIn"
                @zoom-out="zoomOut"
                @pan="panXY"
                @reset="resetView"
              />
              <p class="text-[10px] sm:text-xs">
                Zoom: {{ scale.toFixed(2) }}
              </p>
            </div>
          </div>
        </UPageBody>
        <template v-if="isRightOpen" #right>
          <div class="w-full max-h-[calc(100dvh-var(--ui-header-height)-49px)] overflow-y-auto p-4 space-y-4 relative" :class="{ 'opacity-30 pointer-events-none bg-gray-200 dark:bg-gray-700': !loading }">
            <div v-if="!loading" class="absolute inset-0 bg-gray-200 dark:bg-gray-700 opacity-50 z-10 flex items-center justify-center" />
            <UPageCard
              spotlight
              spotlight-color="primary"
              class="h-fit"
              title="Survey Progress"
              :ui="{ container: 'sm:p-2 gap-2!' }"
            >
              <div class="grid grid-cols-2">
                <div>
                  <Pie :data="chartData" :options="chartOptions" class="max-h-40" />
                </div>
                <div class="w-full grid grid-cols-2 gap-2 text-center">
                  <div class="text-sm text-neutral-700 dark:text-neutral-200 flex  justify-center">
                    <div>
                      <h1>Total Tube Count</h1>
                      <span class="font-semibold">{{ totalCount }}</span>
                    </div>
                  </div>
                  <div class="text-sm text-neutral-700 dark:text-neutral-200 flex  justify-center">
                    <div>
                      <h1>Special Tubes</h1>
                      <span class="font-semibold">{{ specialTubes }}</span>
                    </div>
                  </div>
                  <div class="text-sm text-neutral-700 dark:text-neutral-200 flex  justify-center">
                    <div>
                      <h1>Progress</h1>
                      <span class="font-semibold">{{ viewDisplay === 'Back View' ? backBackendUpdatedCount : backendUpdatedCount }}</span> / <span class="font-semibold">{{ totalCount-specialTubes }}</span>
                    </div>
                  </div>
                  <div class="flex  justify-center text-center text-sm text-neutral-700 dark:text-neutral-200">
                    <div>
                      Repeat
                      <br>
                      {{ repeatCount }}
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <UPageCard
              spotlight
              spotlight-color="secondary"
              class="h-fit p-0"

              :ui="{ container: 'sm:p-2 gap-0!' }"
              title="Special Tubes"
            >
              <div class="grid grid-cols-2 gap-1 p-0">
                <div
                  v-for="item in propertyLegend"
                  :key="item.value"
                  class="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="size-2 rounded border border-neutral-300 dark:border-neutral-600"
                      :style="{ backgroundColor: item.color }"
                    />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {{ item.label }}
                    </span>
                  </div>
                  <span class="text-sm font-bold text-neutral-900 dark:text-neutral-100 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">
                    {{ item.count }}
                  </span>
                </div>
              </div>
            </UPageCard>
            <UPageCard
              :ui="{ container: 'sm:p-2' }"
              spotlight-color="secondary"
              class="h-fit p-0"
            >
              <UTabs :items="tabs" class="w-full">
                <template #content="{ item }">
                  <UTable
                    :data="item.label==='Progress' ? (viewDisplay === 'Back View' ? backTableData : tableData) : (viewDisplay === 'Back View' ? backRepeatTableData : repeatTableData)"
                    class="flex-1 max-h-[312px]"
                    :rows="10"
                    sticky="header"
                  >
                    <template #Action-cell="{ row }">
                      <UFieldGroup>
                        <UButton
                          v-if="searchValue!==row.original?.tube"
                          size="xs"
                          color="primary"
                          variant="outline"
                          label="Locate"
                          @click="searchValue = row.original?.tube; searchTubes()"
                        />
                        <UButton
                          v-if="searchValue===row.original?.tube"
                          size="xs"
                          color="error"
                          variant="outline"
                          label="Reset"
                          @click="searchValue=''; deselectAll(); resetView()"
                        />
                      </UFieldGroup>
                    </template>
                  </UTable>
                </template>
              </UTabs>
            </UPageCard>
            <UPageCard
              v-if="selectedIds.size"
              spotlight
              spotlight-color="secondary"
              class="h-fit p-0"
              :title="`Tube History: ${[...selectedIds].join(', ')}`"
              :ui="{ container: 'sm:p-2 gap-y-2' }"
            >
              <div
                v-for="id in [...selectedIds]"
                :key="id"
              >
                <div v-if="(viewDisplay === 'Back View' ? backTableData : tableData).find((t) => t.tube===id)" class="text-sm text-neutral-700 dark:text-neutral-200">
                  Activity: {{ (viewDisplay === 'Back View' ? backTableData : tableData).find((t) => t.tube===id)!.Activity }} <br>
                  Time: {{ (viewDisplay === 'Back View' ? backTableData : tableData).find((t) => t.tube===id)!.time }} <br>
                </div>
                <div v-else class="text-sm text-neutral-700 dark:text-neutral-200">
                  Tube not detected yet.
                </div>
              </div>
            </UPageCard>
          </div>
        </template>
      </UPage>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="stopModalOpen" title="Stop Survey" description="Are you sure you want to stop the survey?">
    <template #footer>
      <div class="w-full flex justify-end items-center gap-4">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="stopModalOpen = false"
        />
        <UButton label="Confirm" color="primary" @click="stopSurvey" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="successModalOpen" :title="successMessage">
    <template #body>
      <p>The survey has been successfully stopped.</p>
    </template>
    <template #footer>
      <div class="w-full flex justify-end items-center gap-4">
        <UButton
          label="Download Report"
          color="neutral"
          variant="outline"
          @click="downloadReport"
        />
        <UButton label="Go back to home" color="primary" @click="goHome" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Tube } from '@/types'
import { useReactorsStore } from '@/stores/reactors'
import { useSurveyStore } from '@/stores/survey'
import { tubeSheetTypeItems, typeOfPhases as allTypeOfPhasesItems, tubeSheetStatusLabels } from '@/utils/tubesheetOptions'
import { UFieldGroup } from '#components'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { TooltipItem } from 'chart.js'

type TubeDataTable = {
  tube: string
  Activity: string
  time: string
  face: string
}
ChartJS.register(ArcElement, Tooltip, Legend)

const loading = ref(false)
const isRightOpen = ref(true)
const stopModalOpen = ref(false)
const successModalOpen = ref(false)
const successMessage = ref('')
const { setConfig } = useReactorGenerator()

const reactorId = useRoute().params?.reactorId as string
const sheetId = useRoute().params?.sheetId as string
const tableData = ref<TubeDataTable[]>([])
const repeatTableData = ref<TubeDataTable[]>([])
const backTableData = ref<TubeDataTable[]>([])
const backRepeatTableData = ref<TubeDataTable[]>([])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tubeSheetDetails = ref<any>(null)
const selectedPhase = ref<string>('')
const currentSurvey = ref('')
const currentSurveyTime = ref('')
const showDetails = ref(false)
const items = ref(['Front View', 'Back View'])
const viewDisplay = ref('Front View')
const repeatCount = ref(0)

const tabs = [
  {
    label: 'Progress',
    icon: 'i-lucide-activity'
  },
  {
    label: 'Repeat',
    icon: 'i-lucide-refresh-ccw'
  }
]

const pageUi = computed(() => ({
  root: 'gap-0!',
  right: isRightOpen.value ? 'lg:col-span-4 order-first lg:order-last' : '',
  center: isRightOpen.value ? 'lg:col-span-6' : 'lg:col-span-10'
}))

const bodyClass = computed(() => {
  const base = 'relative select-none !p-0 !mt-0 h-full w-full '
  const gridLight = 'bg-[linear-gradient(to_right,#e5e7eb_.5px,transparent_.5px),linear-gradient(to_bottom,#e5e7eb_.5px,transparent_.5px)] bg-[size:20px_20px]'
  const gridDark = 'dark:bg-[linear-gradient(to_right,#2d2d2d_.5px,transparent_.5px),linear-gradient(to_bottom,#2d2d2d_.5px,transparent_.5px)] dark:bg-[size:20px_20px]'
  const bgLight = 'bg-white'
  const bgDark = 'dark:bg-neutral-950'

  if (viewDisplay.value === 'Back View') {
    // For back view, use a reddish grid to differentiate
    const gridLightBack = 'bg-[linear-gradient(to_right,#ffcccc_.5px,transparent_.5px),linear-gradient(to_bottom,#ffcccc_.5px,transparent_.5px)] bg-[size:20px_20px]'
    const gridDarkBack = 'dark:bg-[linear-gradient(to_right,#4d0000_.5px,transparent_.5px),linear-gradient(to_bottom,#4d0000_.5px,transparent_.5px)] dark:bg-[size:20px_20px]'
    return `${base} ${gridLightBack} ${gridDarkBack} ${bgLight} ${bgDark}`
  } else {
    return `${base} ${gridLight} ${gridDark} ${bgLight} ${bgDark}`
  }
})
// Computed property to get only phases from tubesheet details
const typeOfPhasesItems = computed(() => {
  if (!tubeSheetDetails.value?.typeOfPhases || tubeSheetDetails.value.typeOfPhases.length === 0) {
    return []
  }
  return tubeSheetDetails.value.typeOfPhases.map((phaseValue: string) => {
    const item = allTypeOfPhasesItems.find(p => p.value === phaseValue)
    return item || { label: phaseValue, value: phaseValue }
  })
})

const getEquipmentTypeLabel = (value: string) => {
  const item = tubeSheetTypeItems.find(t => t.value === value)
  return item ? item.label : value
}

const getPhaseLabels = (phases: string[]) => {
  if (!phases || phases.length === 0) return []
  return phases.map((phase) => {
    const item = allTypeOfPhasesItems.find(p => p.value === phase)
    return item ? item.label : phase
  })
}

const settingsInput = reactive({

  mirrorX: false
})

// const settingitems = computed<DropdownMenuItem[]>(() => [

//   {
//     label: 'Mirror  (Top ↔ Buttom)',
//     icon: 'i-lucide-arrow-up-down',
//     type: 'checkbox',
//     checked: settingsInput.mirrorX,
//     onUpdateChecked(v: boolean) { settingsInput.mirrorX = v },
//     onSelect(e: Event) { e.preventDefault() }
//   }
// ])

const { config, tubes: currentTubes } = useReactorGenerator()
const { scale, tx, ty, zoom, pan, reset, setZoom, setPan } = useViewportTransform()

// Initialize stores
const reactorsStore = useReactorsStore()

const transformStr = computed(() => `translate(${tx.value} ${ty.value}) scale(${scale.value})`)
const svgRef = ref<SVGSVGElement | null>(null)
const svgWidth = 1200, svgHeight = 1200
const centerX = svgWidth / 2, centerY = svgHeight / 2, scalePx = 2
const searchValue = ref<string>('')

// Cache DOM elements for fast access
const elById = new Map<string, SVGCircleElement>()
const selectedIds = ref<Set<string>>(new Set())
// Property options
const propertiesOptions = [
  { label: 'Catalyst Tc', value: 'CATALYST_TC', color: '#FF6B6B' },
  { label: 'Coolant', value: 'COOLANT', color: '#4ECDC4' },
  { label: 'Solid', value: 'SOLID', color: '#556270' },
  { label: 'Bend', value: 'BEND', color: '#C7F464' },
  { label: 'Salt Tc', value: 'SALT_TC', color: '#FFA500' },
  { label: 'Blocked', value: 'BLOCKED', color: '#1E90FF' }
]

/* ----------------------------
   UTIL: Find mirrored IDs
----------------------------- */
function getMirroredIds(id: string): string[] {
  if (!settingsInput.mirrorX) return []

  const match = id.match(/^R(\d+)C(\d+)$/)
  if (!match) return []
  const [, rStr, cStr] = match
  const row = Number(rStr)
  const col = Number(cStr)

  const rows = currentTubes.value
    .filter(t => !t.deleted)
    .map((t) => {
      const m = t?.id?.match(/^R(\d+)C/)
      return m ? Number(m[1]) : undefined
    })
    .filter((n): n is number => n !== undefined)

  const maxRow = rows.length ? Math.max(...rows) : row

  const mirrors = new Set<string>()

  // X mirror (top-bottom)
  if (settingsInput.mirrorX && row !== maxRow) {
    mirrors.add(`R${maxRow - (row - 1)}C${col}`) // e.g. R1 -> Rmax, R2 -> Rmax-1
  }

  // XY combined (diagonal mirror)

  return [...mirrors].filter(mid =>
    mid !== id
    && currentTubes.value.some(t => t.id === mid && !t.deleted)
  )
}

/* ----------------------------
   VISUAL UPDATE
----------------------------- */
function updateCircleVisual(t: Tube & { backColor?: string, _backendUpdatedBack?: boolean }, newPropertyColor = '') {
  const c = elById.get(t.id)
  if (!c) return
  const isBackView = viewDisplay.value === 'Back View'
  const propertyColor = isBackView ? (t.backColor || propertiesOptions.find(p => p.value === t.property)?.color || t.propertyColor) : (propertiesOptions.find(p => p.value === t.property)?.color || t.propertyColor)
  const isSelected = selectedIds.value.has(t.id)
  const hasComment = !!t.comment

  c.setAttribute('cx', String(centerX + t.x * scalePx))
  c.setAttribute('cy', String(centerY + t.y * scalePx))
  c.setAttribute('r', String(t.r * scalePx))
  c.setAttribute('fill', newPropertyColor || propertyColor || '#fff')
  c.setAttribute('stroke', hasComment ? '#facc15' : isSelected ? '#FF0000' : '#0f172a')
  c.setAttribute('stroke-width', isSelected || hasComment ? '1.5' : '0.3')
  c.setAttribute('filter', isBackView ? 'invert(1)' : 'none')
}

/* ----------------------------
   SELECTION WITH MIRRORING
----------------------------- */
function addSelection(ids: string[]) {
  const set = new Set(selectedIds.value)
  ids.forEach(id => set.add(id))
  selectedIds.value = set
  ids.forEach(id => updateCircleVisual(currentTubes.value.find(t => t.id === id)!))
}

function removeSelection(ids: string[]) {
  ids.forEach(id => selectedIds.value.delete(id))
  ids.forEach(id => updateCircleVisual(currentTubes.value.find(t => t.id === id)!))
}

function selectWithMirrors(id: string, exclusive = false) {
  const mirrors = getMirroredIds(id)
  const all = [id, ...mirrors]

  if (exclusive) {
    const prev = [...selectedIds.value]
    selectedIds.value = new Set()
    prev.forEach(pid => updateCircleVisual(currentTubes.value.find(t => t.id === pid)!))
  }

  addSelection(all)
}

// function toggleSelect(id: string) {
//   if (selectedIds.value.has(id)) {
//     const mirrors = getMirroredIds(id)
//     removeSelection([id, ...mirrors])
//   } else {
//     selectWithMirrors(id)
//   }
// }

function selectOnly(id: string) {
  selectWithMirrors(id, true)
}

function deselect(id: string) {
  const mirrors = getMirroredIds(id)
  removeSelection([id, ...mirrors])
}

function deselectAll() {
  const prev = [...selectedIds.value]
  selectedIds.value.clear()
  prev.forEach(pid => updateCircleVisual(currentTubes.value.find(t => t.id === pid)!))
}

/* ----------------------------
   UI CLICK HANDLERS
----------------------------- */
function handleTubeClick(e: MouseEvent, id: string) {
  e.stopPropagation()
  if (selectedIds.value.has(id)) deselect(id)
  else selectOnly(id)
}

/* ----------------------------
   SEARCH SINGLE TUBE WITH ZOOM
----------------------------- */
function searchTubes() {
  if (!searchValue.value) return

  const tube = currentTubes.value.find(t => t.id === searchValue.value)
  if (!tube) return

  // Zoom to a reasonable level for viewing a single tube
  const zoomLevel = 3
  setZoom(zoomLevel)

  // Calculate position to center the tube
  // Tube position in SVG coordinates (when scale=1): centerX + tube.x * scalePx, centerY + tube.y * scalePx
  // After transform translate(tx, ty) scale(s), final position = tx + (centerX + tube.x * scalePx) * s
  // We want this to equal svgWidth/2, so: tx = svgWidth/2 - (centerX + tube.x * scalePx) * s
  const tx = svgWidth / 2 - (centerX + tube.x * scalePx) * zoomLevel
  const ty = svgHeight / 2 - (centerY + tube.y * scalePx) * zoomLevel

  setPan(tx, ty)

  // Select the tube
  selectOnly(searchValue.value)
}

/* ----------------------------
   RENDERING
----------------------------- */
function renderAll() {
  const svg = svgRef.value
  if (!svg) return
  const vp = svg.querySelector('#viewport') as SVGGElement
  if (!vp) return

  const { boundary, tubes, labels } = ensureLayers(vp)
  boundary.innerHTML = ''
  Array.from(labels.children).forEach((child) => {
    if ((child as Element).id !== 'tooltip') child.remove()
  })

  drawBoundary(boundary, config.value, centerX, centerY, scalePx)

  const isBackView = viewDisplay.value === 'Back View'
  const activeTubes = currentTubes.value.filter(t => !t.deleted && (!isBackView || t._backendUpdatedBack))
  const presentIds = new Set(activeTubes.map(t => t.id))

  // Remove stale circles
  for (const [id, el] of Array.from(elById.entries())) {
    if (!presentIds.has(id)) {
      el.remove()
      elById.delete(id)
    }
  }

  // Render or update existing circles
  for (const t of activeTubes) {
    let c = elById.get(t.id)
    if (!c) {
      c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      c.dataset.name = t.id
      c.addEventListener('click', e => handleTubeClick(e, t.id))
      // c.addEventListener('contextmenu', e => handleTubeContextMenu(e, t.id))
      elById.set(t.id, c)
      tubes.appendChild(c)
    }

    updateCircleVisual(t)
  }
}
let interval: ReturnType<typeof setInterval> | null = null
async function stratSurvey() {
  if (!selectedPhase.value) {
    useToast().add({ title: 'Please select a phase', color: 'error' })
    return
  }

  loading.value = true
  try {
    const data = await useSurveyStore().createSurvey({
      tubeSheetId: sheetId,
      surveyType: selectedPhase.value,
      reactorId: reactorId
    })
    interval = setInterval(fetchUpdatedTubeColors, 5000)
    if (data.Success) {
      useToast().add({ title: 'Survey Started', color: 'success' })
    }
  } catch {
    // useToast().add({ title: 'Survey Started', color: 'success' })
    loading.value = false
  }
}

function openStopModal() {
  stopModalOpen.value = true
}

async function stopSurvey() {
  try {
    await useSurveyStore().stopSurvey()
    loading.value = false
    if (interval) clearInterval(interval)
    stopModalOpen.value = false
    successMessage.value = 'Survey is ended'
    successModalOpen.value = true
  } catch {
    useToast().add({ title: 'Failed to stop survey', color: 'error' })
  }
}

function downloadReport() {
  // do nothing for now
}

function goHome() {
  navigateTo('/')
}

/* ----------------------------
   ZOOM HANDLERS
----------------------------- */
function zoomIn() {
  zoom(1.15)
}
function zoomOut() {
  zoom(1 / 1.15)
}
function panXY(dx: number, dy: number) {
  pan(dx, dy)
}
function resetView() {
  reset()
}

/* ----------------------------
   REACTOR SAVE & FETCH FUNCTIONALITY
----------------------------- */

// Load reactor data on mount
onMounted(async () => {
  // Fetch tubesheet details
  if (sheetId) {
    try {
      const { data } = await useAxios().$get(`/api/v2/tubeSheet/getSpecificTubeSheet/${sheetId}`)
      tubeSheetDetails.value = data
    } catch (err) {
      console.error('Failed to fetch tubesheet details:', err)
    }
  }

  if (reactorId) {
    const reactor = await reactorsStore.getAReactor(reactorId)
    if (reactor) {
      if (reactor.config) {
        setConfig(reactor.config)
      }

      if (reactor.tubes && reactor.tubes.length > 0) {
        currentTubes.value = [...reactor.tubes]
        renderAll()
      }
    }
  }
})

/* ----------------------------
   WATCH
----------------------------- */

watch(viewDisplay, () => {
  // Update all tube visuals when switching between front and back view
  currentTubes.value.forEach((tube) => {
    updateCircleVisual(tube)
  })
})

async function fetchUpdatedTubeColors() {
  try {
    const { data, surveyType, createdAt, repeat } = await useSurveyStore().getSurveyUpdates()
    repeatCount.value = repeat || 0
    currentSurvey.value = allTypeOfPhasesItems.find(phase => phase.value === surveyType)?.label as string || ''
    currentSurveyTime.value = new Date(createdAt).toLocaleString()
    data.forEach((element: { tubeId: string | number, color: string, face?: string }) => {
      const tube = currentTubes.value[element.tubeId as number]
      if (!tube) return
      if (element.face === 'back') {
        tube.backColor = element.color
        tube._backendUpdatedBack = true
      } else {
        tube.propertyColor = element.color
        tube._backendUpdated = true
      }
      updateCircleVisual(tube)
    })

    const frontData = data?.filter((e: { face?: string }) => e.face !== 'back')
    const backData = data?.filter((e: { face?: string }) => e.face === 'back')

    tableData.value = frontData?.filter((e: { isDuplicate: boolean }) => !e?.isDuplicate).map((item: { tubeIdAsperLayout: string, activity: string, timeStamp: string, isDuplicate: boolean }) => {
      return {
        tube: item.tubeIdAsperLayout,
        Activity: item.activity,
        time: new Date(item.timeStamp).toLocaleString(),
        Action: 'Locate'
      }
    })

    repeatTableData.value = frontData?.filter((e: { isDuplicate: boolean }) => e?.isDuplicate).map((item: { tubeIdAsperLayout: string, activity: string, timeStamp: string, isDuplicate: boolean }) => {
      return {
        tube: item.tubeIdAsperLayout,
        Activity: item.activity,
        time: new Date(item.timeStamp).toLocaleString(),
        Action: 'Locate'
      }
    })

    backTableData.value = backData?.filter((e: { isDuplicate: boolean }) => !e?.isDuplicate).map((item: { tubeIdAsperLayout: string, activity: string, timeStamp: string, isDuplicate: boolean }) => {
      return {
        tube: item.tubeIdAsperLayout,
        Activity: item.activity,
        time: new Date(item.timeStamp).toLocaleString(),
        Action: 'Locate'
      }
    })

    backRepeatTableData.value = backData?.filter((e: { isDuplicate: boolean }) => e?.isDuplicate).map((item: { tubeIdAsperLayout: string, activity: string, timeStamp: string, isDuplicate: boolean }) => {
      return {
        tube: item.tubeIdAsperLayout,
        Activity: item.activity,
        time: new Date(item.timeStamp).toLocaleString(),
        Action: 'Locate'
      }
    })
  } catch (err) {
    console.error('Failed to fetch tube colors:', err)
  }
}

const backendUpdatedCount = computed(() =>
  currentTubes.value.filter(t => t._backendUpdated && !propertiesOptions.some(p => p.value === t.property)).length
)

const backBackendUpdatedCount = computed(() =>
  currentTubes.value.filter(t => t._backendUpdatedBack && !propertiesOptions.some(p => p.value === t.property)).length
)

// total tubes
const totalCount = computed(() => currentTubes.value.length)

// Property legend with counts
const propertyLegend = computed(() => {
  const counts: Record<string, number> = {}

  // Initialize counts for all properties
  propertiesOptions.forEach((prop) => {
    counts[prop.value] = 0
  })

  // Count tubes by property
  currentTubes.value.forEach((tube) => {
    if (tube.property && !tube.deleted) {
      counts[tube.property] = (counts[tube.property] || 0) + 1
    }
  })

  // Map to legend items with property details
  return propertiesOptions.map(prop => ({
    label: prop.label,
    value: prop.value,
    color: prop.color,
    count: counts[prop.value] || 0
  }))
})

const specialTubes = computed(() => propertyLegend.value.reduce((sum, item) => sum + item.count, 0))
const effectiveTotal = computed(() => totalCount.value - specialTubes.value)
const completed = computed(() => viewDisplay.value === 'Back View' ? backBackendUpdatedCount.value : backendUpdatedCount.value)
const remaining = computed(() => Math.max(0, effectiveTotal.value - completed.value))

const chartData = computed(() => ({
  labels: ['Completed', 'Remaining', 'Special Tubes'],
  datasets: [{
    data: [completed.value, remaining.value, specialTubes.value],
    backgroundColor: ['#4CAF50', '#FFC107', '#9C27B0'],
    borderWidth: 1
  }]
}))

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'right' as const,
      align: 'start' as const,
      labels: { boxWidth: 10 }
    },
    tooltip: {
      callbacks: {
        label: function (context: TooltipItem<'pie'>) {
          const label = context.label || ''
          const value = context.parsed
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
          return `${label}: ${value} (${percentage}%)`
        }
      }
    }
  }
}

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
