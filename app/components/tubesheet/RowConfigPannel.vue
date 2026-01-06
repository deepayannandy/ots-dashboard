<template>
  <UPopover v-model:open="open" :dismissible="false">
    <UButton
      color="neutral"
      variant="subtle"
      icon="i-lucide-panel-bottom-close"
    />

    <template #content>
      <div class="p-4" :class="{ 'opacity-50 pointer-events-none': disabled }">
        <UFieldGroup orientation="vertical" class="w-full">
          <UTextarea
            v-model="rowCountsArrayInput"
            class="!rouned-b-none"
            placeholder="e.g., 7,12,15 or [7,12,15]"
            :disabled="disabled"
          />
          <UButton label="Apply Counts Array" :disabled="disabled" @click="applyCountsArray" />
        </UFieldGroup>
        <div class="max-h-96 overflow-auto  mt-2 space-y-2">
          <div
            v-for="(row, idx) in rows"
            :key="idx"
            :class="{ 'opacity-60 line-through': rowsToDelete.includes(idx) }"
          >
            <UCheckbox
              :model-value="selectedRowIndices.includes(idx)"
              :label="`${midRowIndex===idx?'Center ':''}Row ${idx+1}`"
              variant="card"
              class="w-full cursor-pointer"
              indicator="hidden"
              :ui="{
                label: `text-left ${midRowIndex===idx&&'text-red-500'}`
              }"
              @update:model-value="() => toggleRowSelection(idx)"
              @click.stop
            >
              <template #description>
                <UFieldGroup class="w-full bg-red">
                  <UInput
                    v-model.number="rowCountsEdits[idx]"
                    type="number"
                    @click.stop
                    @update:model-value="(val) => onRowCountEdit(idx, Number(val))"
                  />
                  <UButton
                    icon="i-lucide-trash"
                    square
                    variant="outline"
                    color="error"
                    @click.stop="toggleDeleteRow(idx)"
                  />
                </UFieldGroup>
              </template>
            <!-- <template #label>
                  <div />
                </template> -->
            </UCheckbox>
          <!-- <button class="text-left" @click="selectSingleRow(idx)">
                <div :class="{ 'text-blue-700 font-semibold': selectedRowIndices.includes(idx) }">
                  Row {{ idx + 1 }}
                </div>
              </button> -->
          </div>
        </div>
        <div v-if="rows.length" class="mt-3">
          <UButton
            label="Apply All"
            block
            variant="solid"
            :disabled="disabled"
            @click="applyAllRowUpdates"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Tube } from '@/types'
import { useReactorGenerator } from '@/composables/useReactorGenerator'
import {
  groupRowsFrom as groupRowsFromModule,
  computeSetRowCountUpdate as computeSetRowCountUpdateModule,
  computeAddRowForIndex as computeAddRowForIndexModule
} from '@/utils'

const open = ref(false)

/* ---------- Props ---------- */
const props = defineProps<{
  disabled?: boolean
  onBeforeUpdate?: () => void
}>()

const disabled = computed(() => props.disabled)

watch(
  disabled,
  (newVal) => {
    if (newVal) open.value = false
    else { open.value = true }
  }, { immediate: true }
)

/* ---------- Shared composable ---------- */
const { config, tubes: currentTubes, handleUpdateTubes } = useReactorGenerator()

/* ---------- Local reactive state ---------- */
const rowCountsArrayInput = ref<string>('')
const selectedRowIndices = ref<number[]>([])
const rowsToDelete = ref<number[]>([])
const rowCountsEdits = ref<number[]>([])
const midRowIndex = computed(() =>
  rows.value.length ? Math.floor((rows.value.length - 1) / 2) : -1
)

/* ---------- Helpers using your module implementation ---------- */
function computeRowsFrom(tubesArr: Tube[]) {
  try {
    return groupRowsFromModule(tubesArr, config.value.pitch ?? 0).map(r =>
      r.slice().sort((a, b) => a.x - b.x)
    )
  } catch {
    return [] as Tube[][]
  }
}

const rows = computed(() => computeRowsFrom(currentTubes.value))
const rowCounts = computed(() => rows.value.map(r => r.length))

/* Keep local edits in sync with computed row counts */
watch(
  rowCounts,
  (counts) => {
    rowCountsEdits.value = counts.slice()
    rowsToDelete.value = rowsToDelete.value.filter(i => i < counts.length)
    selectedRowIndices.value = selectedRowIndices.value.filter(i => i < counts.length)
  },
  { immediate: true }
)

/* ---------- Selection & UI actions ---------- */
function toggleRowSelection(idx: number) {
  const pos = selectedRowIndices.value.indexOf(idx)
  if (pos >= 0) selectedRowIndices.value.splice(pos, 1)
  else selectedRowIndices.value.push(idx)
}

// function selectSingleRow(idx: number) {
//   selectedRowIndices.value = [idx]
// }

function toggleDeleteRow(idx: number) {
  const pos = rowsToDelete.value.indexOf(idx)
  if (pos >= 0) rowsToDelete.value.splice(pos, 1)
  else rowsToDelete.value.push(idx)
}

/* ---------- Input parsing ---------- */
function parseCountsInput(str: string) {
  const s = (str || '').trim()
  if (!s) return []
  try {
    if (s.startsWith('[') && s.endsWith(']')) {
      const arr = JSON.parse(s)
      if (Array.isArray(arr)) {
        return arr.map((v: unknown) => Math.max(0, Math.floor(Number(String(v)) || 0)))
      }
    }
  } catch {
    // fall through to CSV parse
  }
  return s
    .split(/[^0-9-]+/)
    .map(v => v.trim())
    .filter(v => v.length > 0)
    .map(v => Math.max(0, Math.floor(Number(v) || 0)))
}

/* ---------- Core operations (immutable) ---------- */
function applyAllRowUpdates() {
  const originalCounts = rowCounts.value
  const hasSizeChange = rowCountsEdits.value.some((v, i) => (v ?? originalCounts[i]) !== (originalCounts[i] ?? 0))
  const hasDeletes = rowsToDelete.value.length > 0
  if (!hasSizeChange && !hasDeletes) {
    useToast().add({ title: 'No changes to apply', color: 'warning' })
    return
  }

  // Call onBeforeUpdate to allow parent to save history
  props.onBeforeUpdate?.()

  let tubesArr = currentTubes.value.slice()

  // Apply size changes using computeSetRowCountUpdateModule
  for (let idx = 0; idx < rowCountsEdits.value.length; idx++) {
    const target = Math.max(0, Math.floor(rowCountsEdits.value[idx] ?? 0))
    const current = originalCounts[idx] ?? 0
    if (target !== current) {
      const targets = selectedRowIndices.value.includes(idx) ? selectedRowIndices.value : [idx]
      for (const i of targets) {
        tubesArr = computeSetRowCountUpdateModule(
          tubesArr,
          i,
          target,
          config.value.pitch ?? 0,
          config.value.tubeRadius ?? 0
        )
      }
    }
  }

  // Process deletes (soft delete: mark deleted: true)
  const finalRows = computeRowsFrom(tubesArr)
  const deleteSet = new Set<string>()
  for (const idx of rowsToDelete.value) {
    const targets = selectedRowIndices.value.includes(idx) ? selectedRowIndices.value : [idx]
    for (const i of targets) {
      const row = finalRows[i]
      if (row && row.length) row.forEach(t => deleteSet.add(t.id))
    }
  }
  if (deleteSet.size > 0) {
    tubesArr = tubesArr.map(t => (deleteSet.has(t.id) ? { ...t, deleted: true } : t))
  }

  // Hand off to composable which will reassign ids and normalize
  handleUpdateTubes(tubesArr)

  // reset UI state
  selectedRowIndices.value = []
  rowsToDelete.value = []
  rowCountsArrayInput.value = ''
  useToast().add({ title: 'Row updates applied' })
}

/* ---------- Apply counts array (CSV / JSON) ---------- */
function applyCountsArray() {
  const counts = parseCountsInput(rowCountsArrayInput.value)
  if (!counts.length) {
    useToast().add({ title: 'Invalid counts array', color: 'error' })
    return
  }
  const pitch = config.value.pitch ?? 0
  if (!(pitch > 0)) {
    useToast().add({ title: 'Invalid pitch', color: 'error' })
    return
  }

  // Call onBeforeUpdate to allow parent to save history
  props.onBeforeUpdate?.()

  let tubesArr = currentTubes.value.slice()
  const currentLen = computeRowsFrom(tubesArr).length
  const targetLen = counts.length

  // Add missing rows if target has more rows
  if (targetLen > currentLen) {
    const toAdd = targetLen - currentLen
    const addTop = Math.floor(toAdd / 2)
    const addBottom = toAdd - addTop
    const vspace = config.value.lattice === 'triangular' ? (pitch * Math.sqrt(3)) / 2 : pitch

    for (let i = 0; i < addTop; i++) {
      const rowsNow = computeRowsFrom(tubesArr)
      const newRow = computeAddRowForIndexModule(
        rowsNow,
        0,
        -1 as 1 | -1,
        vspace,
        config.value.lattice,
        config.value.pitch ?? 0,
        config.value.tubeRadius ?? 0
      )
      if (newRow && newRow.length) tubesArr = [...tubesArr, ...newRow]
    }
    for (let i = 0; i < addBottom; i++) {
      const rowsNow = computeRowsFrom(tubesArr)
      const newRow = computeAddRowForIndexModule(
        rowsNow,
        Math.max(0, rowsNow.length - 1),
        1 as 1 | -1,
        vspace,
        config.value.lattice,
        config.value.pitch ?? 0,
        config.value.tubeRadius ?? 0
      )
      if (newRow && newRow.length) tubesArr = [...tubesArr, ...newRow]
    }
  }

  // Now set counts for each row up to min(len)
  const finalRows = computeRowsFrom(tubesArr)
  const len = Math.min(finalRows.length, counts.length)
  for (let i = 0; i < len; i++) {
    const target = Math.max(0, Number(counts[i]) || 0)
    tubesArr = computeSetRowCountUpdateModule(tubesArr, i, target, config.value.pitch ?? 0, config.value.tubeRadius ?? 0)
  }

  handleUpdateTubes(tubesArr)
  selectedRowIndices.value = []
  rowsToDelete.value = []
  rowCountsArrayInput.value = ''
  useToast().add({ title: 'Array counts applied' })
}

/* ---------- onRowCountEdit helper ---------- */
function onRowCountEdit(idx: number, val: number) {
  const intVal = Math.max(0, Math.floor(Number(val) || 0))
  if (selectedRowIndices.value.length > 1 && selectedRowIndices.value.includes(idx)) {
    selectedRowIndices.value.forEach((i) => {
      rowCountsEdits.value[i] = intVal
    })
  } else {
    rowCountsEdits.value[idx] = intVal
  }
}

/* expose a few functions for parent if needed */
defineExpose({
  applyAllRowUpdates,
  applyCountsArray
})
</script>
