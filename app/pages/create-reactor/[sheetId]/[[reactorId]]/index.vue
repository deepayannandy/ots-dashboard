<template>
  <UDashboardPanel id="create-tubesheet" :ui="{ body: '!p-0' }">
    <template #header>
      <UDashboardNavbar :title="headerTitle" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UFieldGroup>
            <UInput
              value="Tube Count"
              disabled
              class="cursor-grab! font-bold max-w-fit"
            >
              <template #trailing>
                <div>
                  {{ currentTubes.length }}
                </div>
              </template>
            </UInput>
            <USelectMenu
              v-model="searchRow"
              placeholder="Select Row"
              :search-input="{ icon: '' }"
              leading-icon="i-lucide-rows-4"
              :items="Object.keys(tubesByRow)"
              class="min-w-2"
            />
            <USelectMenu
              v-model="searchValue"
              multiple
              value-key="value"
              placeholder="Search Tubes"
              :search-input="{ icon: 'i-lucide-search' }"
              leading-icon="i-lucide-circle"
              :items="tubesByRow[searchRow]"
              class="min-w-96 max-w-60"
            >
              <template #item-leading="{ item }">
                <span
                  :style="{ backgroundColor: item.color || '' }"
                  class="size-2 rounded-full"
                />
              </template>
            </USelectMenu>

            <UButton
              color="neutral"
              variant="subtle"
              icon="i-lucide-search"
              @click="searchTubes"
            />
            <UButton
              color="neutral"
              variant="subtle"
              icon="i-lucide-x"
              @click="
                searchValue = [];
                deselectAll();
              "
            />
          </UFieldGroup>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #right>
          <UButtonGroup class="space-x-2">
            <UButton
              color="neutral"
              variant="subtle"
              icon="i-lucide-undo-2"
              :disabled="!canUndo"
              @click="undo"
            />
            <UButton
              color="neutral"
              variant="subtle"
              icon="i-lucide-redo-2"
              :disabled="!canRedo"
              @click="redo"
            />
          </UButtonGroup>
          <RowConfigPannel
            class="right-0 z-20 bg-white dark:bg-black"
            :disabled="isReactorCreated"
            :on-before-update="pushHistory"
          />
          <UButton
            label="Update"
            color="primary"
            icon="i-lucide-save"
            @click="saveChangesModal = true"
          />
        </template>

        <template #left>
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-upload"
            label="Import JSON"
            @click="triggerFileUpload"
          />
          <input
            ref="fileInputRef"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="handleFileUpload"
          >
          <USwitch
            v-model="settingsInput.mirrorX"
            label="Mirror X (Top ↔ Bottom)"
            size="xs"
          />
          <USwitch
            v-model="settingsInput.mirrorY"
            label="Mirror Y (Left ↔ Right)"
            size="xs"
          />
          <USwitch
            v-model="settingsInput.multiselect"
            label="Multiselect"
            size="xs"
          />
          <div @keydown.stop.prevent>
            <URadioGroup
              v-model="viewDisplay"
              indicator="hidden"
              variant="card"
              size="xs"
              orientation="horizontal"
              default-value=""
              :items="items"
            />
          </div>
          <ZoomControls
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
            @pan="panXY"
            @rotate-left="rotateLeft"
            @rotate-right="rotateRight"
            @reset="resetView"
            @fit-to-screen="fitToScreenHandler"
          />
        </template>
      </UDashboardToolbar>
    </template>
    <template #body>
      <UPage class="flex min-h-fit">
        <UPageBody
          :class="bodyClass"
          class="max-h-[calc(100dvh-var(--ui-header-height)-49px)] min-h-[calc(100dvh-var(--ui-header-height)-49px)] w-full flex justify-center items-center relative z-10"
        >
          <div
            class="absolute top-0 size-full -z-10 left-0 opacity-20"
            style="
              background-image: url(&quot;/ots_background.png&quot;);
              background-size: cover;
              background-position: center;
            "
          />
          <!--  @click="deselectAll"
            @contextmenu.prevent -->
          <div ref="containerRef" class="h-full w-full flex justify-center items-center">
            <!-- SVG Canvas -->
            <svg
              ref="svgRef"
              :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
              :style="{
                width: '100%',
                height: '100%',
                transform: viewDisplay === 'Back View' ? 'scale(-1,1)' : 'none',
                transformOrigin: 'center',
                transformBox: 'fill-box'
              }"
              :class="viewDisplay === 'Back View' ? 'invert' : ''"
              @wheel.prevent="handleWheel"
            >
              <g id="viewport" :transform="transformStr">
                <!-- Compass overlay on reactor (plus sign lines) - inside viewport to move/zoom with reactor -->
                <g :transform="`rotate(${rotation} ${centerX} ${centerY})`">
                  <!-- Vertical line (North-South) -->
                  <line
                    :x1="centerX"
                    :y1="centerY - compassSize.vertical - 40"
                    :x2="centerX"
                    :y2="centerY + compassSize.vertical + 40"
                    stroke="#dc2626"
                    stroke-width="2"
                    opacity="0.7"
                  />

                  <!-- Horizontal line (East-West) -->
                  <line
                    :x1="centerX - compassSize.horizontal - 40"
                    :y1="centerY"
                    :x2="centerX + compassSize.horizontal + 40"
                    :y2="centerY"
                    stroke="#dc2626"
                    stroke-width="2"
                    opacity="0.7"
                  />

                  <!-- North indicator -->
                  <g
                    :transform="`translate(${centerX}, ${centerY - compassSize.vertical - 50})`"
                  >
                    <polygon points="0,-12 -8,8 0,4 8,8" fill="#dc2626" />
                    <text
                      y="-18"
                      text-anchor="middle"
                      fill="#dc2626"
                      font-weight="bold"
                      font-size="18"
                    >
                      N
                    </text>
                  </g>

                  <!-- South indicator -->
                  <g
                    :transform="`translate(${centerX}, ${centerY + compassSize.vertical + 50})`"
                  >
                    <polygon
                      points="0,12 -8,-8 0,-4 8,-8"
                      fill="#dc2626"
                      opacity="0.6"
                    />
                    <text
                      y="32"
                      text-anchor="middle"
                      fill="#dc2626"
                      font-weight="bold"
                      font-size="18"
                    >
                      S
                    </text>
                  </g>

                  <!-- East indicator -->
                  <g
                    :transform="`translate(${centerX + compassSize.horizontal + 50}, ${centerY})`"
                  >
                    <polygon
                      points="12,0 -8,-8 -4,0 -8,8"
                      fill="#dc2626"
                      opacity="0.6"
                    />
                    <text
                      x="22"
                      text-anchor="start"
                      dominant-baseline="middle"
                      fill="#dc2626"
                      font-weight="bold"
                      font-size="18"
                    >
                      E
                    </text>
                  </g>

                  <!-- West indicator -->
                  <g
                    :transform="`translate(${centerX - compassSize.horizontal - 50}, ${centerY})`"
                  >
                    <polygon
                      points="-12,0 8,-8 4,0 8,8"
                      fill="#dc2626"
                      opacity="0.6"
                    />
                    <text
                      x="-22"
                      text-anchor="end"
                      dominant-baseline="middle"
                      fill="#dc2626"
                      font-weight="bold"
                      font-size="18"
                    >
                      W
                    </text>
                  </g>
                </g>
              </g>
            </svg>

            <!-- Compass Legend - Top Left -->
            <div class="absolute top-4 left-4 min-w-[120px]">
              <div class="flex flex-col items-center gap-2">
                <!-- Mini compass -->
                <div class="relative w-20 h-20">
                  <svg viewBox="0 0 64 64" class="w-full h-full">
                    <!-- Rotating compass needle group -->
                    <g
                      :style="{
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: 'center'
                      }"
                    >
                      <!-- North needle (red) -->
                      <polygon points="32,8 28,32 32,28 36,32" fill="#dc2626" />
                      <!-- South needle (gray) -->
                      <polygon
                        points="32,56 28,32 32,36 36,32"
                        fill="#9ca3af"
                      />
                    </g>

                    <!-- Fixed direction labels -->
                    <text
                      x="32"
                      y="7"
                      text-anchor="middle"
                      fill="#dc2626"
                      font-weight="bold"
                      font-size="8"
                    >
                      N
                    </text>
                    <text
                      x="32"
                      y="63"
                      text-anchor="middle"
                      fill="#6b7280"
                      font-size="8"
                    >
                      S
                    </text>
                    <text
                      x="58"
                      y="34"
                      text-anchor="middle"
                      fill="#6b7280"
                      font-size="8"
                    >
                      E
                    </text>
                    <text
                      x="6"
                      y="34"
                      text-anchor="middle"
                      fill="#6b7280"
                      font-size="8"
                    >
                      W
                    </text>
                  </svg>
                </div>

                <!-- Rotation value -->
                <div class="text-center">
                  <span class="text-lg font-bold text-red-600 dark:text-red-500">{{ rotation }}°</span>
                </div>
              </div>
            </div>

            <!-- Zoom Controls -->
            <UPageCard
              v-if="selectedIds.size"
              heading="Edit Tube Properties"
              class="absolute bottom-0 right-0 max-w-sm"
            >
              <div class="space-y-2">
                <div class="text-xs text-gray-500">
                  Editing
                </div>
                <div class="flex flex-wrap gap-1 max-w-auto max-h-50 overflow-scroll py-4">
                  <span
                    v-for="id in [...selectedIds]"
                    :key="id"
                    class="px-2 py-1 rounded-md bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200"
                  >
                    {{ id }}
                  </span>
                </div>

                <UTextarea
                  v-model="editModal.comment"
                  placeholder="Add comment for selected tube(s)..."
                  autoresize
                  class="w-full"
                />

                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="p in propertiesOptions"
                    :key="p.value"
                    class="cursor-pointer px-3 py-1 rounded-full border flex items-center gap-2 transition"
                    :class="
                      editModal.property === p.value
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-gray-300 hover:bg-gray-100'
                    "
                    @click="editModal.property = p.value"
                  >
                    <div
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: p.color }"
                    />
                    <span class="text-sm">{{ p.label }}</span>
                  </div>
                </div>

                <div class="flex justify-end gap-2">
                  <UButton color="primary" @click="saveChanges">
                    Save
                  </UButton>
                </div>
              </div>
            </UPageCard>
            <UModal v-model:open="saveChangesModal">
              <template #content>
                <div class="text-center space-y-4 p-6">
                  <h2 class="text-xl font-semibold">
                    Save changes before moving ahead?
                  </h2>
                  <p class="text-sm text-muted">
                    Your current progress will be stored.
                  </p>

                  <div class="flex justify-center gap-4 pt-2">
                    <UButton
                      label="Cancel"
                      color="neutral"
                      variant="soft"
                      @click="saveChangesModal = false"
                    />
                    <UButton
                      label="Save & Continue"
                      color="primary"
                      @click="saveReactorData(false)"
                    />
                    <UButton
                      label="Save & Export"
                      color="primary"
                      variant="outline"
                      icon="i-lucide-download"
                      @click="saveAndExportReport"
                    />
                  </div>
                </div>
              </template>
            </UModal>

            <!-- Optional: show selected IDs -->
          </div>
        </UPageBody>
      </UPage>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import type { Tube, ReactorConfig } from '@/types'
import RowConfigPannel from '@/components/tubesheet/RowConfigPannel.vue'
import { useReactorsStore } from '@/stores/reactors'
import { useTubeSheets } from '@/stores/tubesheets'
import { tubeSheetTypeItems } from '@/utils/tubesheetOptions'
import { UPage } from '#components'

const { setConfig } = useReactorGenerator()

const reactorId = useRoute().params?.reactorId as string
const sheetId = useRoute().params?.sheetId as string

const tubeSheetsStore = useTubeSheets()

const tubeSheetDetails = computed(() =>
  tubeSheetsStore.list.find(sheet => sheet._id === sheetId)
)

const getEquipmentTypeLabel = (value?: string) => {
  if (!value) return 'Create Reactor'
  const item = tubeSheetTypeItems.find(t => t.value === value)
  return item ? item.label : value
}

const headerTitle = computed(() => {
  return getEquipmentTypeLabel(
    tubeSheetDetails.value?.type as string | undefined
  )
})

const isReactorCreated = computed(() => {
  return tubeSheetDetails.value?.status === 'REACTOR_CREATED'
})

const settingsInput = reactive({
  mirrorX: false,
  mirrorY: false,
  multiselect: false
})

// Ensure only one mirror option is active at a time
watch(
  () => settingsInput.mirrorX,
  (val) => {
    if (val) settingsInput.mirrorY = false
  }
)
watch(
  () => settingsInput.mirrorY,
  (val) => {
    if (val) settingsInput.mirrorX = false
  }
)

const saveChangesModal = ref(false)

/* ----------------------------
   UNDO / REDO HISTORY
----------------------------- */
interface HistoryState {
  config: ReactorConfig
  tubes: Tube[]
}

const MAX_HISTORY = 50
const undoStack = ref<HistoryState[]>([])
const redoStack = ref<HistoryState[]>([])

const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

function cloneState(): HistoryState {
  return {
    config: JSON.parse(JSON.stringify(config.value)),
    tubes: JSON.parse(JSON.stringify(currentTubes.value))
  }
}

function pushHistory() {
  undoStack.value.push(cloneState())
  if (undoStack.value.length > MAX_HISTORY) {
    undoStack.value.shift()
  }
  // Clear redo stack when new action is performed
  redoStack.value = []
}

function undo() {
  if (!canUndo.value) return

  // Save current state to redo stack
  redoStack.value.push(cloneState())

  // Pop and apply previous state
  const prevState = undoStack.value.pop()!
  setConfig(prevState.config)
  currentTubes.value = prevState.tubes
  renderAll()
}

function redo() {
  if (!canRedo.value) return

  // Save current state to undo stack
  undoStack.value.push(cloneState())

  // Pop and apply next state
  const nextState = redoStack.value.pop()!
  setConfig(nextState.config)
  currentTubes.value = nextState.tubes
  renderAll()
}

const {
  config,
  tubes: currentTubes,
  handleUpdateTubes
} = useReactorGenerator()
const {
  scale,
  tx,
  ty,
  rotation,
  zoom,
  pan,
  rotate,
  resetWithoutRotation,
  fitToScreen,
  setZoom,
  setPan,
  setRotation
} = useViewportTransform()

const viewportStorageKey = reactorId
  ? `viewport:${reactorId}`
  : 'viewport:default'

/* ----------------------------
   JSON FILE UPLOAD & PARSING
----------------------------- */
const fileInputRef = ref<HTMLInputElement | null>(null)

interface ReactorJsonTube {
  tube_id?: number
  id?: number
  center_x: number
  center_y: number
  radius: number
  diameter?: number
  is_overlapping?: boolean
}

interface ReactorJsonRow {
  row_id: number
  tube_count: number
  tubes: ReactorJsonTube[]
}

interface ReactorJson {
  summary?: {
    total_rows: number
    total_tubes: number
  }
  outer_circle?: {
    center_x: number
    center_y: number
    radius: number
    diameter?: number
  }
  inner_circles?: {
    total_count: number
    circles: ReactorJsonTube[]
  }
  rows: ReactorJsonRow[]
}

function triggerFileUpload() {
  fileInputRef.value?.click()
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const jsonData = JSON.parse(content) as ReactorJson
      generateReactorFromJson(jsonData)
      useToast().add({
        title: 'JSON Imported',
        description: `Successfully imported ${jsonData.summary?.total_tubes || jsonData.rows?.reduce((sum, r) => sum + r.tube_count, 0) || 0} tubes`,
        color: 'success'
      })
    } catch (err) {
      console.error('Failed to parse JSON:', err)
      useToast().add({
        title: 'Import Failed',
        description: 'Invalid JSON file format',
        color: 'error'
      })
    }
  }
  reader.readAsText(file)
  // Reset input so same file can be uploaded again
  target.value = ''
}

function generateReactorFromJson(jsonData: ReactorJson) {
  // Push current state to history before making changes
  pushHistory()

  // Extract outer circle info for config
  const outerCircle = jsonData.outer_circle

  // Calculate center from outer circle or derive from tubes
  const jsonCenterX = outerCircle?.center_x || 0
  const jsonCenterY = outerCircle?.center_y || 0
  const jsonOuterRadius = outerCircle?.radius || 600

  // Target outer dimension for the app (normalized size)
  const targetOuterDimension = 100

  // Calculate scale factor to normalize JSON coordinates to app coordinates
  // JSON radius 604 -> app outerDimension 100
  const scaleFactor = jsonOuterRadius / targetOuterDimension

  // Get average tube radius from JSON for proper scaling
  let totalJsonRadius = 0
  let tubeCount = 0
  for (const row of jsonData.rows) {
    for (const tube of row.tubes) {
      totalJsonRadius += tube.radius
      tubeCount++
    }
  }
  const avgJsonTubeRadius = tubeCount > 0 ? totalJsonRadius / tubeCount : 60
  const scaledTubeRadius = avgJsonTubeRadius / scaleFactor

  // Calculate pitch from tube spacing (estimate from first row with 2+ tubes)
  let estimatedPitch = 15
  for (const row of jsonData.rows) {
    if (row.tubes.length >= 2) {
      const t1 = row.tubes[0]
      const t2 = row.tubes[1]
      const distance = Math.sqrt(
        Math.pow(t2.center_x - t1.center_x, 2) +
        Math.pow(t2.center_y - t1.center_y, 2)
      )
      estimatedPitch = distance / scaleFactor
      break
    }
  }

  // Update config with normalized dimensions
  setConfig({
    shape: 'CIRCLE',
    outerDimension: targetOuterDimension,
    tubeRadius: scaledTubeRadius,
    padding: 5,
    pitch: estimatedPitch,
    angle: 60
  })

  // Convert rows to tubes with normalized coordinates
  const tubes: Tube[] = []

  for (const row of jsonData.rows) {
    for (const tube of row.tubes) {
      const tubeId = `R${row.row_id}C${tube.tube_id || tubes.filter(t => t.id.startsWith(`R${row.row_id}C`)).length + 1}`

      // Convert absolute coordinates to center-relative and scale down
      const relativeX = (tube.center_x - jsonCenterX) / scaleFactor
      const relativeY = (tube.center_y - jsonCenterY) / scaleFactor
      const scaledRadius = tube.radius / scaleFactor

      tubes.push({
        id: tubeId,
        x: relativeX,
        y: relativeY,
        r: scaledRadius,
        capped: false,
        capColor: null,
        blocked: false,
        deleted: false,
        property: null,
        propertyColor: null,
        comment: null
      })
    }
  }

  // Update tubes
  currentTubes.value = tubes
  handleUpdateTubes(tubes)

  // Render the new configuration
  renderAll()

  // Fit to screen after import
  nextTick(() => {
    fitToScreenHandler()
  })
}

function loadViewportState() {
  if (typeof localStorage === 'undefined') return
  const raw = localStorage.getItem(viewportStorageKey)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as {
      scale?: number
      tx?: number
      ty?: number
      rotation?: number
    }
    if (typeof parsed.scale === 'number') setZoom(parsed.scale)
    if (typeof parsed.tx === 'number' && typeof parsed.ty === 'number')
      setPan(parsed.tx, parsed.ty)
    if (typeof parsed.rotation === 'number') setRotation(parsed.rotation)
  } catch (err) {
    console.error('Failed to load viewport state', err)
  }
}

function persistViewportState() {
  if (typeof localStorage === 'undefined') return
  const payload = {
    scale: scale.value,
    tx: tx.value,
    ty: ty.value,
    rotation: rotation.value
  }
  localStorage.setItem(viewportStorageKey, JSON.stringify(payload))
}

// Initialize stores
const reactorsStore = useReactorsStore()

const transformStr = computed(
  () =>
    `translate(${tx.value} ${ty.value}) scale(${scale.value}) rotate(${rotation.value} 600 600)`
)
const svgRef = ref<SVGSVGElement | null>(null)
const svgWidth = 1200,
  svgHeight = 1200
const centerX = svgWidth / 2,
  centerY = svgHeight / 2,
  scalePx = 2
const searchValue = ref<string[]>([])
const searchRow = ref<string>('R1')
const items = ref(['Front View', 'Back View'])
const viewDisplay = ref('Front View')

// Computed compass dimensions based on shape type
const compassSize = computed(() => {
  const shape = config.value.shape
  const outerDim = config.value.outerDimension || 100
  const width = config.value.width || outerDim
  const height = config.value.height || outerDim

  switch (shape) {
    case 'RECTANGLE': {
      // Use diagonal distance to ensure compass stays visible at all rotation angles
      const diagonal
        = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2) * scalePx
      return {
        horizontal: diagonal,
        vertical: diagonal
      }
    }
    case 'HEXAGONE':
      return {
        horizontal: outerDim * scalePx,
        vertical: outerDim * scalePx * 0.866 // hex height ratio
      }
    case 'DONUT':
    case 'CIRCLE':
    default:
      return {
        horizontal: outerDim * scalePx,
        vertical: outerDim * scalePx
      }
  }
})

// Computed class for body background based on view
const bodyClass = computed(() => {
  const base = 'relative select-none !p-0 !mt-0 h-full w-full '
  const gridLight
    = 'bg-[linear-gradient(to_right,#e5e7eb_.5px,transparent_.5px),linear-gradient(to_bottom,#e5e7eb_.5px,transparent_.5px)] bg-[size:20px_20px]'
  const gridDark
    = 'dark:bg-[linear-gradient(to_right,#2d2d2d_.5px,transparent_.5px),linear-gradient(to_bottom,#2d2d2d_.5px,transparent_.5px)] dark:bg-[size:20px_20px]'
  const bgLight = 'bg-white'
  const bgDark = 'dark:bg-neutral-950'

  if (viewDisplay.value === 'Back View') {
    // For back view, use a reddish grid to differentiate
    const gridLightBack
      = 'bg-[linear-gradient(to_right,#ffcccc_.5px,transparent_.5px),linear-gradient(to_bottom,#ffcccc_.5px,transparent_.5px)] bg-[size:20px_20px]'
    const gridDarkBack
      = 'dark:bg-[linear-gradient(to_right,#4d0000_.5px,transparent_.5px),linear-gradient(to_bottom,#4d0000_.5px,transparent_.5px)] dark:bg-[size:20px_20px]'
    return `${base} ${gridLightBack} ${gridDarkBack} ${bgLight} ${bgDark}`
  } else {
    return `${base} ${gridLight} ${gridDark} ${bgLight} ${bgDark}`
  }
})

// Cache DOM elements for fast access
const elById = new Map<string, SVGCircleElement>()
const selectedIds = ref<Set<string>>(new Set())

const tubesByRow = computed(() => {
  const grouped: Record<
    string,
    { label: string, color?: string | null, value: string }[]
  > = {}
  currentTubes.value.forEach((tube) => {
    const match = tube.id.match(/^R(\d+)C\d+$/)
    if (match) {
      const rowKey = `R${match[1]}`
      if (!grouped[rowKey]) grouped[rowKey] = []
      grouped[rowKey].push({
        label: tube.id,
        color: tube.propertyColor,
        value: tube.id
      })
    }
  })

  return grouped
})
// Property options
const propertiesOptions = [
  { label: 'Catalyst Tc', value: 'CATALYST_TC', color: '#FF6B6B' },
  { label: 'Coolant', value: 'COOLANT', color: '#4ECDC4' },
  { label: 'Solid', value: 'SOLID', color: '#556270' },
  { label: 'Bend', value: 'BEND', color: '#C7F464' },
  { label: 'Salt Tc', value: 'SALT_TC', color: '#FFA500' },
  { label: 'Blocked', value: 'BLOCKED', color: '#1E90FF' }
]

// Modal state
const editModal = reactive({
  visible: false,
  comment: '',
  property: '',
  targetIds: [] as string[]
})

/* ----------------------------
   UTIL: Find mirrored IDs
----------------------------- */
function getMirroredIds(id: string): string[] {
  if (!settingsInput.mirrorX && !settingsInput.mirrorY) return []

  const match = id.match(/^R(\d+)C(\d+)$/)
  if (!match) return []
  const [, rStr, cStr] = match
  const row = Number(rStr)
  const col = Number(cStr)

  const activeTubes = currentTubes.value.filter(t => !t.deleted)

  // Get max row for X mirror
  const rows = activeTubes
    .map((t) => {
      const m = t?.id?.match(/^R(\d+)C/)
      return m ? Number(m[1]) : undefined
    })
    .filter((n): n is number => n !== undefined)
  const maxRow = rows.length ? Math.max(...rows) : row

  // Get max col for Y mirror (within the same row)
  const colsInRow = activeTubes
    .filter(t => t.id.startsWith(`R${row}C`))
    .map((t) => {
      const m = t?.id?.match(/^R\d+C(\d+)$/)
      return m ? Number(m[1]) : undefined
    })
    .filter((n): n is number => n !== undefined)
  const maxCol = colsInRow.length ? Math.max(...colsInRow) : col

  const mirrors = new Set<string>()

  // X mirror (top-bottom)
  if (settingsInput.mirrorX && row !== maxRow) {
    mirrors.add(`R${maxRow - (row - 1)}C${col}`) // e.g. R1 -> Rmax, R2 -> Rmax-1
  }

  // Y mirror (left-right)
  if (settingsInput.mirrorY && col !== maxCol) {
    mirrors.add(`R${row}C${maxCol - (col - 1)}`) // e.g. C1 -> Cmax, C2 -> Cmax-1
  }

  return [...mirrors].filter(
    mid =>
      mid !== id && currentTubes.value.some(t => t.id === mid && !t.deleted)
  )
}

// Cache for icon overlay elements
const iconElById = new Map<string, SVGGElement>()

/* ----------------------------
   VISUAL UPDATE
----------------------------- */
function updateCircleVisual(t: Tube) {
  const c = elById.get(t.id)
  if (!c) return
  const propertyColor = propertiesOptions.find(
    p => p.value === t.property
  )?.color
  const isSelected = selectedIds.value.has(t.id)
  const hasComment = !!t.comment

  const cx = centerX + t.x * scalePx
  const cy = centerY + t.y * scalePx
  const r = t.r * scalePx

  c.setAttribute('cx', String(cx))
  c.setAttribute('cy', String(cy))
  c.setAttribute('r', String(r))
  c.setAttribute(
    'fill',
    propertyColor ? propertyColor : isSelected ? '#FFA500' : '#fff'
  )
  c.setAttribute(
    'stroke',
    isSelected ? '#FFA500' : '#0f172a'
  )
  c.setAttribute('stroke-width', isSelected ? '1.5' : '0.3')

  // Update comment icon overlay
  updateTubeIcons(t, cx, cy, r, hasComment)
}

function updateTubeIcons(t: Tube, cx: number, cy: number, r: number, hasComment: boolean) {
  let iconGroup = iconElById.get(t.id)

  if (!hasComment) {
    if (iconGroup) {
      iconGroup.remove()
      iconElById.delete(t.id)
    }
    return
  }

  if (!iconGroup) {
    iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    iconGroup.setAttribute('class', 'tube-icons')
    iconGroup.setAttribute('pointer-events', 'none')
    iconElById.set(t.id, iconGroup)
    const svg = svgRef.value
    if (svg) {
      const vp = svg.querySelector('#viewport') as SVGGElement
      let iconsLayer = vp?.querySelector('#icons-layer') as SVGGElement
      if (!iconsLayer) {
        iconsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        iconsLayer.setAttribute('id', 'icons-layer')
        vp?.appendChild(iconsLayer)
      }
      iconsLayer.appendChild(iconGroup)
    }
  }

  iconGroup.innerHTML = ''

  const iconSize = Math.max(r * 0.7, 3)

  // RIGHT — Comment icon
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

/* ----------------------------
   SELECTION WITH MIRRORING
----------------------------- */
function addSelection(ids: string[]) {
  const set = new Set(selectedIds.value)
  ids.forEach(id => set.add(id))
  selectedIds.value = set
  ids.forEach(id =>
    updateCircleVisual(currentTubes.value.find(t => t.id === id)!)
  )
}

function removeSelection(ids: string[]) {
  ids.forEach(id => selectedIds.value.delete(id))
  ids.forEach(id =>
    updateCircleVisual(currentTubes.value.find(t => t.id === id)!)
  )
}

function selectWithMirrors(id: string, exclusive = false) {
  const mirrors = getMirroredIds(id)
  const all = [id, ...mirrors]

  if (exclusive) {
    const prev = [...selectedIds.value]
    selectedIds.value = new Set()
    prev.forEach(pid =>
      updateCircleVisual(currentTubes.value.find(t => t.id === pid)!)
    )
  }

  addSelection(all)
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    const mirrors = getMirroredIds(id)
    removeSelection([id, ...mirrors])
  } else {
    selectWithMirrors(id)
  }
}

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
  prev.forEach(pid =>
    updateCircleVisual(currentTubes.value.find(t => t.id === pid)!)
  )
}

/* ----------------------------
   UI CLICK HANDLERS
----------------------------- */
function handleTubeClick(e: MouseEvent, id: string) {
  e.stopPropagation()
  const isMultiselect = settingsInput.multiselect || e.shiftKey
  if (isMultiselect) toggleSelect(id)
  else if (selectedIds.value.has(id)) deselect(id)
  else selectOnly(id)
}

/* ----------------------------
   SEARCH MULTI SELECT
----------------------------- */
function searchTubes() {
  const toSelect = [...searchValue.value]
  toSelect.forEach(id => selectWithMirrors(id))
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

  // Ensure icons layer exists
  let iconsLayer = vp.querySelector('#icons-layer') as SVGGElement
  if (!iconsLayer) {
    iconsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    iconsLayer.setAttribute('id', 'icons-layer')
    vp.appendChild(iconsLayer)
  }

  drawBoundary(boundary, config.value, centerX, centerY, scalePx)

  const activeTubes = currentTubes.value.filter(t => !t.deleted)
  const presentIds = new Set(activeTubes.map(t => t.id))

  // Remove stale circles and icons
  for (const [id, el] of Array.from(elById.entries())) {
    if (!presentIds.has(id)) {
      el.remove()
      elById.delete(id)
    }
  }
  for (const [id, el] of Array.from(iconElById.entries())) {
    if (!presentIds.has(id)) {
      el.remove()
      iconElById.delete(id)
    }
  }

  // Render or update existing circles
  for (const t of activeTubes) {
    let c = elById.get(t.id)
    if (!c) {
      c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      c.dataset.name = t.id
      c.addEventListener('click', e => handleTubeClick(e, t.id))
      c.addEventListener('contextmenu', e => handleTubeContextMenu(e, t.id))
      elById.set(t.id, c)
      tubes.appendChild(c)
    }

    updateCircleVisual(t)
  }
}

function handleTubeContextMenu(e: MouseEvent, id: string) {
  e.preventDefault()
  e.stopPropagation()

  const idsToEdit = selectedIds.value.size > 1 ? [...selectedIds.value] : [id]
  editModal.visible = true
  editModal.targetIds = idsToEdit

  // Prefill comment & property if all share the same values
  const selectedTubes = currentTubes.value.filter(t =>
    idsToEdit.includes(t.id)
  )
  const first = selectedTubes[0]
  const allSameComment
    = !!first && selectedTubes.every(t => t.comment === first.comment)
  const allSameProperty
    = !!first && selectedTubes.every(t => t.property === first.property)

  editModal.comment = allSameComment ? first?.comment || '' : ''
  editModal.property = allSameProperty ? first?.property || '' : ''
}

/* ----------------------------
   SAVE CHANGES (Partial Update)
----------------------------- */
function saveChanges() {
  // Push current state to history before making changes
  pushHistory()
  const targetIds = Array.from(selectedIds.value)
  const comment = editModal.comment
  const property = editModal.property
  const propertyColor = property
    ? (propertiesOptions.find(p => p.value === property)?.color ?? undefined)
    : undefined

  for (const id of targetIds) {
    const tube = currentTubes.value.find(t => t.id === id)
    if (!tube) continue
    tube.comment = comment || ''
    tube.property = property || ''
    tube.propertyColor = propertyColor ?? tube.propertyColor
    if (property === 'SOLID') {
      tube.deleted = true
    }
    updateCircleVisual(tube)
  }

  if (property === 'SOLID') {
    handleUpdateTubes(currentTubes.value)
    renderAll()
    selectedIds.value.clear()
  }

  // Reset editModal
  editModal.comment = ''
  editModal.property = ''
  editModal.targetIds = []
  selectedIds.value.clear()
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
  // Invert X direction when in Back View (mirrored) mode
  const adjustedDx = viewDisplay.value === 'Back View' ? -dx : dx
  pan(adjustedDx, dy)
}
function rotateLeft() {
  // Invert rotation direction when in Back View (mirrored) mode
  const direction = viewDisplay.value === 'Back View' ? 15 : -15
  rotate(direction)
}
function rotateRight() {
  // Invert rotation direction when in Back View (mirrored) mode
  const direction = viewDisplay.value === 'Back View' ? -15 : 15
  rotate(direction)
}
function handleWheel(event: WheelEvent) {
  // Slower zoom factor (1.03 instead of 1.1) for smoother control
  const factor = event.deltaY < 0 ? 1.03 : 1 / 1.03
  zoom(factor)
}
function resetView() {
  resetWithoutRotation()
}

// Reference to the container div for fit-to-screen calculation
const containerRef = ref<HTMLDivElement | null>(null)

function fitToScreenHandler() {
  // Calculate actual reactor dimensions from config
  const outerDim = config.value.outerDimension || 100
  const width = config.value.width || outerDim
  const height = config.value.height || outerDim

  // The reactor content is rendered with scalePx = 2, so total dimensions are:
  // width * scalePx * 2, height * scalePx * 2
  const renderedWidth = width * scalePx * 2
  const renderedHeight = height * scalePx * 2

  // SVG viewBox is 1200x1200 - use full viewBox for fitting
  const viewBoxSize = 1200

  // Calculate scale to fit reactor within the full viewBox
  const scaleX = viewBoxSize / renderedWidth
  const scaleY = viewBoxSize / renderedHeight
  const fitScale = Math.min(scaleX, scaleY)

  // Clamp scale between reasonable bounds (0.1 to 3.0)
  const finalScale = Math.max(0.1, Math.min(fitScale, 3.0))

  // Set scale
  setZoom(finalScale)

  // Center the reactor: translate to keep center at svgCenter after scaling
  const newTx = centerX * (1 - finalScale)
  const newTy = centerY * (1 - finalScale)
  setPan(newTx, newTy)
}

/* ----------------------------
   REACTOR SAVE & FETCH FUNCTIONALITY
----------------------------- */
// function debounce(func: () => void, delay: number) {
//   let timeoutId: ReturnType<typeof setTimeout>
//   return () => {
//     clearTimeout(timeoutId)
//     timeoutId = setTimeout(func, delay)
//   }
// }

// const debouncedSave = debounce(() => saveReactorData(true), 2000)

function saveReactorData(autoUPdate = false) {
  // Save reactor data to store
  reactorsStore.saveReactor({
    sheetId: sheetId,
    reactorId: reactorId,
    config: {
      ...config.value,
      positions: {
        scale: scale.value,
        tx: tx.value,
        ty: ty.value,
        rotation: rotation.value
      }
    },
    tubes: currentTubes.value
  }, !autoUPdate)
  saveChangesModal.value = false
  if (!autoUPdate)
    useToast().add({
      title: 'Reactor Saved',
      description: 'Reactor configuration has been saved successfully',
      color: 'success'
    })
}

async function saveAndExportReport() {
  // Determine the reactor ID to use: from route, from tubesheet, or will be created
  const existingReactorId = reactorId || tubeSheetDetails.value?.reactorId as string | undefined

  // Save reactor data first and wait for completion
  const savedReactorId = await reactorsStore.saveReactor({
    sheetId: sheetId,
    reactorId: existingReactorId || '',
    config: {
      ...config.value,
      positions: {
        scale: scale.value,
        tx: tx.value,
        ty: ty.value,
        rotation: rotation.value
      }
    },
    tubes: currentTubes.value
  }, true)
  saveChangesModal.value = false

  // Use the returned ID, or fall back to existing reactor ID
  const finalReactorId = savedReactorId || existingReactorId

  if (!finalReactorId) {
    useToast().add({
      title: 'Export Failed',
      description: 'Failed to save reactor. Please try again.',
      color: 'error'
    })
    return
  }

  // Open condensed report (first 3 pages, no Survey Statistics)
  const reportPath = `/report/${sheetId}/${finalReactorId}?condensed=true`

  window.open(reportPath, '_blank')

  useToast().add({
    title: 'Report Exported',
    description: 'Opening condensed report for export',
    color: 'success'
  })
}

onMounted(async () => {
  if (!tubeSheetsStore.list.length) {
    await tubeSheetsStore.getAllSheet()
  }

  loadViewportState()

  watch(
    () => [scale.value, tx.value, ty.value, rotation.value],
    () => {
      persistViewportState()
      // debouncedSave()
    },
    { deep: false }
  )
})

// Load reactor data on mount
onMounted(async () => {
  if (reactorId) {
    const reactor = await reactorsStore.getAReactor(reactorId)
    if (reactor) {
      if (reactor.config) {
        setConfig(reactor.config)

        // Load viewport positions from config if available
        if (reactor.config.positions) {
          const {
            scale: savedScale,
            tx: savedTx,
            ty: savedTy,
            rotation: savedRotation
          } = reactor.config.positions
          if (typeof savedScale === 'number') setZoom(savedScale)
          if (typeof savedTx === 'number' && typeof savedTy === 'number')
            setPan(savedTx, savedTy)
          if (typeof savedRotation === 'number') setRotation(savedRotation)
        }
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
watch(() => config.value, renderAll, { deep: true, immediate: true })
watch(() => currentTubes.value.length, renderAll)
// const { start, stop } = useInterval(() => {
//   saveReactorData(true)
// }, 5000)

// watch(
//   () => settingsInput.autoSave,
//   () => {
//     if (settingsInput.autoSave) start()
//     else stop()
//   },
//   { immediate: true }
// )
</script>
