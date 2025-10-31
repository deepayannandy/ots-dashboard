<template>
  <UDashboardPanel id="create-tubesheet" :ui="{ body: '!p-0' }">
    <template #header>
      <UDashboardNavbar title="Surevy" :ui="{ right: 'gap-3' }">
        <template #right>
          <UFieldGroup>
            <UInput value="Tube Count" disabled class="cursor-grab! font-bold max-w-fit">
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
              class="min-w-2  "
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
                <span :style="{ backgroundColor: item.color||'' }" class="size-2 rounded-full" />
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
              @click="searchValue = [];deselectAll()"
            />
          </UFieldGroup>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #right>
          <!-- <RowConfigPannel class=" right-0 z-20 bg-white dark:bg-black" /> -->
          <UButton
            label="Start Survey"
            color="primary"
            icon="i-lucide-target"
            :disabled="loading"
            @click="stratSurvey"
          />
        </template>
        <template #left>
          <UDropdownMenu :items="settingitems" :content="{ align: 'start' }" :ui="{ content: 'w-56' }">
            <UButton
              label="Settings"
              color="neutral"
              variant="outline"
              icon="i-lucide-settings"
            />
          </UDropdownMenu>
        </template>
      </UDashboardToolbar>
    </template>
    <template #body>
      <UPage class="flex">
        <UPageBody
          class="relative  select-none bg-[linear-gradient(to_right,#e5e7eb_.5px,transparent_.5px),linear-gradient(to_bottom,#e5e7eb_.5px,transparent_.5px)] bg-[size:20px_20px] dark:bg-[linear-gradient(to_right,#2d2d2d_.5px,transparent_.5px),linear-gradient(to_bottom,#2d2d2d_.5px,transparent_.5px)] dark:bg-[size:20px_20px] dark:bg-neutral-950 bg-white !p-0 !mt-0 h-full w-full"
        >
          <!--  @click="deselectAll"
            @contextmenu.prevent -->
          <div>
            <!-- SVG Canvas -->
            <svg
              ref="svgRef"
              :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMinYMin meet"
            >
              <g id="viewport" :transform="transformStr" />
            </svg>

            <!-- Zoom Controls -->
            <!-- Optional: show selected IDs -->
          </div>
          <div class="sticky  sm:bottom-0 flex justify-between">
            <div class="flex flex-col items-center gap-2 z-50 bg-white dark:bg-black shadow p-2 rounded w-fit">
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
            <div
              v-if="selectedIds.size"
              class=" flex flex-col items-center gap-2 z-50 bg-white dark:bg-black shadow p-2 rounded w-fit"
            >
              <p class="font-semibold mb-1">
                Selected Tubes ({{ selectedIds.size }})
              </p>
              <div class="flex flex-wrap gap-1 max-w-auto max-h-50">
                <span
                  v-for="id in [...selectedIds]"
                  :key="id"
                  class="px-2 py-1 rounded-md bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200"
                >
                  {{ id }}
                </span>
              </div>
            </div>
          </div>
        </UPageBody>
      </UPage>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { ref, reactive, computed } from 'vue'
import type { Tube } from '@/types'
import { useReactorsStore } from '@/stores/reactors'
import { useSurveyStore } from '@/stores/survey'

const loading = ref(false)
const { setConfig } = useReactorGenerator()

const reactorId = useRoute().params?.reactorId as string
const sheetId = useRoute().params?.sheetId as string

const settingsInput = reactive({

  mirrorX: false,
  autoSave: false,
  backView: false
})

const settingitems = computed<DropdownMenuItem[]>(() => [

  {
    label: 'Mirror  (Top ↔ Buttom)',
    icon: 'i-lucide-arrow-up-down',
    type: 'checkbox',
    checked: settingsInput.mirrorX,
    onUpdateChecked(v: boolean) { settingsInput.mirrorX = v },
    onSelect(e: Event) { e.preventDefault() }
  }
  {
    label: 'Back View (Left ↔ Right)',
    icon: 'i-lucide-arrow-left-right',
    type: 'checkbox',
    checked: settingsInput.backView,
    onUpdateChecked(v: boolean) { settingsInput.backView = v; renderAll() },
    onSelect(e: Event) { e.preventDefault() }
  }
])

const { config, tubes: currentTubes } = useReactorGenerator()
const { scale, tx, ty, zoom, pan, reset } = useViewportTransform({ scale: 0.5, tx: -100 })

// Initialize stores
const reactorsStore = useReactorsStore()

const transformStr = computed(() => `translate(${tx.value} ${ty.value}) scale(${scale.value})`)
const svgRef = ref<SVGSVGElement | null>(null)
const svgWidth = 1200, svgHeight = 760
const centerX = svgWidth / 2, centerY = svgHeight / 2, scalePx = 2
const searchValue = ref<string[]>([])
const searchRow = ref<string>('R1')

// Cache DOM elements for fast access
const elById = new Map<string, SVGCircleElement>()
const selectedIds = ref<Set<string>>(new Set())

const tubesByRow = computed(() => {
  const grouped: Record<string, { label: string, color?: string | null, value: string }[]> = {}
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
function updateCircleVisual(t: Tube, newPropertyColor = '') {
  const c = elById.get(t.id)
  if (!c) return
  const propertyColor = propertiesOptions.find(p => p.value === t.property)?.color
  const isSelected = selectedIds.value.has(t.id)
  const hasComment = !!t.comment

  c.setAttribute('cx', String(centerX + t.x * scalePx))
  c.setAttribute('cy', String(centerY + t.y * scalePx))
  c.setAttribute('r', String(t.r * scalePx))
  console.log(newPropertyColor)

  c.setAttribute('fill', newPropertyColor || propertyColor || '#fff')
  c.setAttribute('stroke', hasComment ? '#facc15' : isSelected ? '#FF0000' : '#0f172a')
  c.setAttribute('stroke-width', isSelected || hasComment ? '1.5' : '0.3')
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
  prev.forEach(pid => updateCircleVisual(currentTubes.value.find(t => t.id === pid)!))
}

/* ----------------------------
   UI CLICK HANDLERS
----------------------------- */
function handleTubeClick(e: MouseEvent, id: string) {
  e.stopPropagation()
  if (e.shiftKey) toggleSelect(id)
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

  drawBoundary(boundary, config.value, centerX, centerY, scalePx)

  const activeTubes = currentTubes.value.filter(t => !t.deleted)
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

async function stratSurvey() {
  loading.value = true
  try {
    const data = await useSurveyStore().createSurvey({
      tubeSheetId: sheetId,
      surveyType: 'SOD',
      eactorId: reactorId
    })
    if (data.Success) {
      useToast().add({ title: 'Survey Stated', color: 'success' })
    }
  } catch {
    // useToast().add({ title: 'Survey Stated', color: 'success' })
    loading.value = false
  }
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

let interval: ReturnType<typeof setInterval> | null = null

async function fetchUpdatedTubeColors() {
  try {
    const { data } = await useSurveyStore().getSurveyUpdates()
    data.forEach((element: { tubeId: string | number, color: string }) => {
      const tube = currentTubes.value[element.tubeId as number]
      if (tube) {
        console.log(tube)
        updateCircleVisual(tube, element.color)
      }
    })
  } catch (err) {
    console.error('Failed to fetch tube colors:', err)
  }
}

onMounted(() => {
  interval = setInterval(fetchUpdatedTubeColors, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
