<template>
  <UDashboardPanel id="create-tubesheet" :ui="{ body: '!p-0' }">
    <template #header>
      <UDashboardNavbar title="Create Reactor" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
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
          <RowConfigPannel class=" right-0 z-20 bg-white dark:bg-black" />
          <UButton
            label="Update"
            color="primary"
            icon="i-lucide-save"
            @click="saveChangesModal=true"
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
      <UPage class="flex">
        <UPageBody
          :class="bodyClass"
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
              :style="
                viewDisplay==='Back View'? 'transform: scale(-1,1); transform-origin:center; transform-box:fill-box;'
                : ''"
              :class="viewDisplay==='Back View' ? 'invert' : ''"
            >
              >
              <g id="viewport" :transform="transformStr" />
            </svg>

            <!-- Zoom Controls -->

            <!-- Modal -->
            <UModal v-model:open="editModal.visible">
              <template #content>
                <div class="p-4 space-y-4">
                  <h3 class="font-semibold text-lg">
                    Edit Tube Properties
                  </h3>

                  <div v-if="editModal.targetIds.length > 1" class="text-xs text-gray-500">
                    Editing {{ editModal.targetIds.length }} tubes
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
                      :class="editModal.property === p.value ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-300 hover:bg-gray-100'"
                      @click="editModal.property = p.value"
                    >
                      <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: p.color }" />
                      <span class="text-sm">{{ p.label }}</span>
                    </div>
                  </div>

                  <div class="flex justify-end gap-2">
                    <UButton variant="ghost" @click="editModal.visible = false">
                      Cancel
                    </UButton>
                    <UButton color="primary" @click="saveChanges">
                      Save
                    </UButton>
                  </div>
                </div>
              </template>
            </UModal>
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
                  </div>
                </div>
              </template>
            </UModal>

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
import { ref, reactive, computed, watch } from 'vue'
import type { Tube } from '@/types'
import RowConfigPannel from '@/components/tubesheet/rowConfigPannel.vue'
import { useReactorsStore } from '@/stores/reactors'

const { setConfig } = useReactorGenerator()

const reactorId = useRoute().params?.reactorId as string
const sheetId = useRoute().params?.sheetId as string

const settingsInput = reactive({

  mirrorX: false,
  autoSave: false
})

const saveChangesModal = ref(false)
const settingitems = computed<DropdownMenuItem[]>(() => [

  {
    label: 'Mirror  (Top ↔ Buttom)',
    icon: 'i-lucide-arrow-up-down',
    type: 'checkbox',
    checked: settingsInput.mirrorX,
    onUpdateChecked(v: boolean) { settingsInput.mirrorX = v },
    onSelect(e: Event) { e.preventDefault() }
  },

  {
    label: 'Auto Save',
    icon: 'i-lucide-save',
    type: 'checkbox',
    checked: settingsInput.autoSave,
    onUpdateChecked(v: boolean) { settingsInput.autoSave = v },
    onSelect(e: Event) { e.preventDefault() }
  }
])

const { config, tubes: currentTubes, handleUpdateTubes } = useReactorGenerator()
const { scale, tx, ty, zoom, pan, reset } = useViewportTransform()

// Initialize stores
const reactorsStore = useReactorsStore()

const transformStr = computed(() => `translate(${tx.value} ${ty.value}) scale(${scale.value})`)
const svgRef = ref<SVGSVGElement | null>(null)
const svgWidth = 1200, svgHeight = 760
const centerX = svgWidth / 2, centerY = svgHeight / 2, scalePx = 2
const searchValue = ref<string[]>([])
const searchRow = ref<string>('R1')
const items = ref(['Front View', 'Back View'])
const viewDisplay = ref('Front View')

// Computed class for body background based on view
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
function updateCircleVisual(t: Tube) {
  const c = elById.get(t.id)
  if (!c) return
  const propertyColor = propertiesOptions.find(p => p.value === t.property)?.color
  const isSelected = selectedIds.value.has(t.id)
  const hasComment = !!t.comment

  c.setAttribute('cx', String(centerX + t.x * scalePx))
  c.setAttribute('cy', String(centerY + t.y * scalePx))
  c.setAttribute('r', String(t.r * scalePx))
  c.setAttribute('fill', propertyColor ? propertyColor : isSelected ? '#FFA500' : '#fff')
  c.setAttribute('stroke', hasComment ? '#facc15' : isSelected ? '#FFA500' : '#0f172a')
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
  const selectedTubes = currentTubes.value.filter(t => idsToEdit.includes(t.id))
  const first = selectedTubes[0]
  const allSameComment = !!first && selectedTubes.every(t => t.comment === first.comment)
  const allSameProperty = !!first && selectedTubes.every(t => t.property === first.property)

  editModal.comment = allSameComment ? (first?.comment || '') : ''
  editModal.property = allSameProperty ? (first?.property || '') : ''
}

/* ----------------------------
   SAVE CHANGES (Partial Update)
----------------------------- */
function saveChanges() {
  const { comment, property, targetIds } = editModal
  const propertyColor = property
    ? propertiesOptions.find(p => p.value === property)?.color ?? undefined
    : undefined

  for (const id of targetIds) {
    const tube = currentTubes.value.find(t => t.id === id)
    if (!tube) continue
    tube.comment = comment || null
    tube.property = property || null
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
  editModal.visible = false
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
function saveReactorData(autoUPdate = false) {
  // Save reactor data to store
  reactorsStore.saveReactor({
    sheetId: sheetId,
    reactorId: reactorId,
    config: config.value,
    tubes: currentTubes.value

  })
  saveChangesModal.value = false
  if (!autoUPdate)
    useToast().add({
      title: 'Reactor Saved',
      description: 'Reactor configuration has been saved successfully',
      color: 'success'
    })
}

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
