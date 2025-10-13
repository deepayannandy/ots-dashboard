<template>
  <div class="flex-1 bg-white p-4 flex flex-col border-l border-gray-200">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2"
    >
      <div class="flex items-center justify-between gap-3 w-full">
        Total Tubes: {{ tubes.length }}
        <div class="flex items-center gap-2 flex-wrap justify-end">
          <span class="text-xs sm:text-sm text-slate-600">Auto Zoom</span>
          <USwitch v-model="autoZoom" />

          <span class="text-xs sm:text-sm text-slate-600">Multi Select</span>
          <USwitch v-model="multiSelect" />

          <span class="text-xs sm:text-sm text-slate-600">Mirror</span>
          <USwitch v-model="mirrorMode" />

          
        </div>
        <SearchBar @search="onSearch" class="w-full sm:w-auto" />
      </div>
    </div>

    <div
      class="relative flex-1 flex justify-center items-center rounded-xl overflow-hidden bg-slate-50"
    >
      <svg
        ref="svgRef"
        class="w-full h-full max-h-[100vh] aspect-[16/9]"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <GridRuler :width="svgWidth" :height="svgHeight" />
        <g id="viewport" :transform="transformStr"></g>
      </svg>


      <div
        class="absolute top-3 right-3 bg-white/90 rounded-xl p-2 shadow-md text-xs sm:text-sm w-56"
      >
        <div
          class="flex items-center justify-between cursor-pointer select-none"
          @click="isRowCountCollapsed = !isRowCountCollapsed"
        >
          <span class="font-medium text-slate-700">Row Counts({{ rowCountsLocal.length }})</span>
          <UIcon name="i-mdi-shape-plus-outline" @click="copyTubes"></UIcon>
          <span
            class="text-slate-500 text-[10px] transition-transform"
            :class="{ 'rotate-90': isRowCountCollapsed }"
          >
            ▶
          </span>
        </div>

        <!-- Add rows at ends controls -->
        <div class="mt-2 flex items-center justify-end gap-2" v-if="!isRowCountCollapsed">
          <template v-if="mirrorMode">
            <UButton size="xs" variant="soft" @click="addRowEnds">Add Ends</UButton>
          </template>
          <template v-else>
            <UButton size="xs" variant="soft" @click="addRowTop">Add Top</UButton>
            <UButton size="xs" variant="soft" @click="addRowBottom">Add Bottom</UButton>
          </template>
        </div>

        <!-- Bulk apply from counts array -->
        <div v-if="!isRowCountCollapsed" class="mt-2 space-y-2">
          <label class="text-[10px] sm:text-xs text-slate-600">Counts Array (comma-separated or JSON)</label>
          <textarea
            v-model="rowCountsArrayInput"
            rows="3"
            class="w-full text-xs border border-slate-300 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
            placeholder="e.g., 7,12,15,... or [7,12,15,...]"
          ></textarea>
          <div  class="flex items-center justify-end">
            <UButton size="xs" variant="solid" @click="applyCountsArray">Apply Counts Array</UButton>
          </div>
        </div>

        <transition name="fade">
          <div>
          <div
            v-if="!isRowCountCollapsed"
            class="mt-2 max-h-96 overflow-y-auto pr-1"
          >
            <div
              v-for="(count, idx) in rowCountsLocal"
              :key="idx"
              class="flex items-center justify-between gap-2 border-b border-slate-200 py-1"
              :class="{ 'opacity-60 line-through': rowsToDelete.includes(idx), 'bg-blue-50 rounded-md': selectedRowIndices.includes(idx) }"
            >
              <div class="flex items-center gap-2 flex-1 ">
                <button class="text-left" @click="toggleRowSelection(idx)">
                  <span :class="{ 'text-blue-700 font-semibold': selectedRowIndices.includes(idx), 'text-red-500 font-bold': idx === Math.floor(rowCountsLocal.length / 2) }">Row {{ idx + 1 }}</span>
                </button>
              </div>
              <UInput
                v-model.number="rowCountsEdits[idx]"
                type="number"
                min="0"
                class="w-16"
                @click.stop
                @update:modelValue="(val) => onRowCountEdit(idx, Number(val))"
              />
              <UButton
                icon="i-mdi-delete-outline"
                square
                size="xs"
                variant="ghost"
                color="error"
                @click.stop="toggleDeleteRow(idx)"
              />
            </div>
            <div v-if="rowCountsLocal.length" class="mt-2 absolute bottom-0  bg-white shadow-2xl w-full right-0">
              <UButton size="xs" block variant="solid" @click="applyAllRowUpdates">Apply All</UButton>
            </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Toolbar removed; inline controls moved to Row Counts panel -->

      <!-- Bottom Controls -->
      <div
        class="absolute bottom-3 left-3 sm:bottom-4  bg-white/90 rounded-xl p-2 shadow-md flex flex-col items-center gap-2"
      >
        <ZoomControls
          @zoomIn="zoomIn"
          @zoomOut="zoomOut"
          @pan="panXY"
          @reset="resetView"
        />
        Zoom: {{ scale.toFixed(2) }}
      </div>

      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import type { ReactorConfig, Tube } from "~/types";
import { drawBoundary } from "~/utils/svgHelpers";
import ZoomControls from "@/components/Controls/ZoomControls.vue";
import SearchBar from "@/components/Controls/SearchBar.vue";
import GridRuler from "@/components/GridRuler.vue";

const props = defineProps<{ config: ReactorConfig; tubes: Tube[]; rowCount: number[] }>();
const emits = defineEmits(["updateTubes", "copyJson", "download"]);

const svgRef = ref<SVGSVGElement | null>(null);
const svgWidth = 1200;
const svgHeight = 760;
const centerX = svgWidth / 2;
const centerY = svgHeight / 2;
const scalePx = 2;

const { scale, tx, ty, zoom, pan, reset } = useViewportTransform();
const transformStr = computed(
  () => `translate(${tx.value} ${ty.value}) scale(${scale.value})`
);

const selectedIds = ref<string[]>([]);
const autoZoom = ref(true);
const multiSelect = ref(false);
// Measurements removed
const mirrorMode = ref(false);
const isRowCountCollapsed = ref(true);
const selectedRowDisplayIndex = ref<number | null>(null);
const selectedRowIndex = ref<number | null>(null); // base-grid i index
const rowCountsLocal = computed(() => groupRows().map((r) => r.length));
const selectedRowTargetCount = ref<number | null>(null);

// Bulk counts array input
const rowCountsArrayInput = ref<string>("");
const selectedRowSecondaryIndex = computed(() => {
  if (!mirrorMode.value) return null;
  if (selectedRowDisplayIndex.value === null) return null;
  const len = rowCountsLocal.value.length;
  const idx = selectedRowDisplayIndex.value;
  const mirrorIdx = len - 1 - idx;
  if (mirrorIdx === idx) return null; // same row, avoid duplicate
  return mirrorIdx;
});

// Inline row edits and batch apply/delete tracking
const rowCountsEdits = ref<number[]>([]);
const rowsToDelete = ref<number[]>([]);
// Multi-row selection indices
const selectedRowIndices = ref<number[]>([]);

// Initialize and sync edits when rows change
watch(rowCountsLocal, (counts) => {
  rowCountsEdits.value = counts.slice();
  // Ensure delete indexes remain valid
  rowsToDelete.value = rowsToDelete.value.filter((i) => i < counts.length);
}, { immediate: true });

function toggleDeleteRow(idx: number) {
  const targets = selectedRowIndices.value.includes(idx)
    ? selectedRowIndices.value
    : [idx];
  targets.forEach((i) => {
    const pos = rowsToDelete.value.indexOf(i);
    if (pos >= 0) rowsToDelete.value.splice(pos, 1);
    else rowsToDelete.value.push(i);
  });
}

function toggleRowSelection(idx: number) {
  const len = rowCountsLocal.value.length;
  const mirrorIdx = mirrorMode.value ? (len - 1 - idx) : null;
  const pos = selectedRowIndices.value.indexOf(idx);
  if (pos >= 0) {
    // Remove idx and its mirror if present
    selectedRowIndices.value.splice(pos, 1);
    if (mirrorIdx !== null && mirrorIdx !== idx) {
      const mpos = selectedRowIndices.value.indexOf(mirrorIdx);
      if (mpos >= 0) selectedRowIndices.value.splice(mpos, 1);
    }
  } else {
    // Add idx and its mirror if applicable
    selectedRowIndices.value.push(idx);
    if (mirrorIdx !== null && mirrorIdx !== idx && !selectedRowIndices.value.includes(mirrorIdx)) {
      selectedRowIndices.value.push(mirrorIdx);
    }
  }
  // Update selectedIds to include all tubes from selected rows
  const rows = groupRows();
  const ids = new Set<string>();
  selectedRowIndices.value.forEach((i) => {
    const row = rows[i];
    if (row) row.forEach((t) => ids.add(t.id));
  });
  selectedIds.value = Array.from(ids);
  renderAll();
}

function applyAllRowUpdates() {
  const originalCounts = rowCountsLocal.value.slice();
  let tubesArr = props.tubes.slice();

  // First, apply count changes per row (based on current grouping indices)
  for (let idx = 0; idx < rowCountsEdits.value.length; idx++) {
    const target = rowCountsEdits.value[idx] ?? originalCounts[idx] ?? 0;
    const current = originalCounts[idx] ?? 0;
    if (target !== current && target >= 0) {
      // If multiple rows selected and this idx is selected, propagate same target to all selected
      const targets = selectedRowIndices.value.includes(idx)
        ? selectedRowIndices.value
        : [idx];
      for (const i of targets) {
        tubesArr = computeSetRowCountUpdate(tubesArr, i, target);
      }
    }
  }

  // Then, apply deletions per row using original grouping to avoid index drift
  const rows = groupRowsFrom(tubesArr);
  const deleteSet = new Set<string>();
  rowsToDelete.value.forEach((idx) => {
    const targets = selectedRowIndices.value.includes(idx)
      ? selectedRowIndices.value
      : [idx];
    targets.forEach((i) => {
      const row = rows[i];
      if (row && row.length) {
        row.forEach((t) => deleteSet.add(t.id));
      }
    });
  });
  if (deleteSet.size > 0) {
    tubesArr = tubesArr.map((t) => (deleteSet.has(t.id) ? { ...t, deleted: true } : t));
  }

  // Emit updated tubes and redraw
  emits("updateTubes", tubesArr);
  // Clear all selections and pending deletes/edits after apply
  selectedRowIndices.value = [];
  selectedRowDisplayIndex.value = null;
  selectedRowIndex.value = null;
  selectedIds.value = [];
  rowsToDelete.value = [];
  selectedRowTargetCount.value = null;
  renderAll();
  useToast().add({ title: "Row updates applied" });
}

// Parse counts array from text input (comma-separated or JSON array)
function parseCountsInput(str: string): number[] {
  const s = (str || "").trim();
  if (!s) return [];
  try {
    if (s.startsWith("[") && s.endsWith("]")) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n >= 0);
      }
    }
  } catch (e) {
    // fall through to CSV parsing
  }
  return s
    .split(/[^0-9.]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

// Apply array-driven row additions (dup ends) and per-row tube counts
function applyCountsArray() {
  const counts = parseCountsInput(rowCountsArrayInput.value);
  if (!counts.length) {
    useToast().add({ title: "Invalid counts array", color: "error" });
    return;
  }
  const pitch = props.config.pitch ?? 0;
  if (!(pitch > 0)) {
    useToast().add({ title: "Invalid pitch", color: "error" });
    return;
  }
  const vspace = props.config.lattice === "triangular"
    ? pitch * Math.sqrt(3) / 2
    : pitch;

  let tubesArr = props.tubes.slice();
  const currentLen = groupRowsFrom(tubesArr).length;
  const targetLen = counts.length;

  if (targetLen < currentLen) {
    // For now, only support adding rows; warn if fewer provided
    useToast().add({ title: "Input has fewer rows than current", color: "warning" });
  }

  if (targetLen > currentLen) {
    const toAdd = targetLen - currentLen;
    const addTop = Math.floor(toAdd / 2);
    const addBottom = toAdd - addTop;
    // Add rows at top by duplicating first row
    for (let i = 0; i < addTop; i++) {
      const rows = groupRowsFrom(tubesArr);
      const newRow = computeAddRowForIndex(rows, 0, -1 as 1 | -1, vspace);
      tubesArr = [...tubesArr, ...newRow];
    }
    // Add rows at bottom by duplicating last row
    for (let i = 0; i < addBottom; i++) {
      const rows = groupRowsFrom(tubesArr);
      const newRow = computeAddRowForIndex(rows, rows.length - 1, 1 as 1 | -1, vspace);
      tubesArr = [...tubesArr, ...newRow];
    }
  }

  // Now set tube count per row according to counts array
  const finalRows = groupRowsFrom(tubesArr);
  const len = Math.min(finalRows.length, counts.length);
  for (let i = 0; i < len; i++) {
    const target = Math.max(0, Number(counts[i]) || 0);
    tubesArr = computeSetRowCountUpdate(tubesArr, i, target);
  }

  emits("updateTubes", tubesArr);
  // Clear selections and edits
  selectedRowIndices.value = [];
  selectedRowDisplayIndex.value = null;
  selectedRowIndex.value = null;
  selectedIds.value = [];
  rowsToDelete.value = [];
  selectedRowTargetCount.value = null;
  renderAll();
  useToast().add({ title: "Array counts applied" });
}

// When two rows are selected in mirror mode, keep their counts in sync
function onRowCountEdit(idx: number, val: number) {
  // Update local edit at idx is already handled by v-model; we mirror to opposite when applicable
  // If multiple selections: propagate the edit value to all selected rows
  if (selectedRowIndices.value.length > 1 && selectedRowIndices.value.includes(idx)) {
    selectedRowIndices.value.forEach((i) => {
      rowCountsEdits.value[i] = val;
    });
  }
  // Mirror mode: keep opposite in sync when one of mirrored rows is edited
  if (mirrorMode.value) {
    const primary = selectedRowDisplayIndex.value;
    const secondary = selectedRowSecondaryIndex.value;
    if (primary === null || secondary === null) return; // not both selected
    if (idx !== primary && idx !== secondary) return; // Only when editing one of selected pair
    const len = rowCountsEdits.value.length;
    const mirrorIdx = len - 1 - idx;
    if (mirrorIdx < 0 || mirrorIdx >= len) return;
    rowCountsEdits.value[mirrorIdx] = val;
  }
}

function addRowTop() {
  const rows = groupRows();
  if (rows.length === 0) return;
  const vspace = props.config.lattice === "triangular"
    ? (props.config.pitch ?? 0) * Math.sqrt(3) / 2
    : (props.config.pitch ?? 0);
  const newRow = computeAddRowForIndex(rows, 0, -1, vspace);
  if (newRow.length === 0) return;
  const updated = [...props.tubes, ...newRow];
  emits("updateTubes", updated);
  renderAll();
}

function addRowBottom() {
  const rows = groupRows();
  if (rows.length === 0) return;
  const vspace = props.config.lattice === "triangular"
    ? (props.config.pitch ?? 0) * Math.sqrt(3) / 2
    : (props.config.pitch ?? 0);
  const newRow = computeAddRowForIndex(rows, rows.length - 1, 1, vspace);
  if (newRow.length === 0) return;
  const updated = [...props.tubes, ...newRow];
  emits("updateTubes", updated);
  renderAll();
}

function addRowEnds() {
  const rows = groupRows();
  if (rows.length === 0) return;
  const vspace = props.config.lattice === "triangular"
    ? (props.config.pitch ?? 0) * Math.sqrt(3) / 2
    : (props.config.pitch ?? 0);
  const top = computeAddRowForIndex(rows, 0, -1, vspace);
  const bottom = computeAddRowForIndex(rows, rows.length - 1, 1, vspace);
  const updated = [...props.tubes, ...top, ...bottom];
  emits("updateTubes", updated);
  renderAll();
}

watch(rowCountsLocal, (counts) => {
  if (selectedRowDisplayIndex.value !== null) {
    selectedRowTargetCount.value = counts[selectedRowDisplayIndex.value] ?? null;
  }
});

watch(mirrorMode, (enabled) => {
  // Re-apply selection to include/exclude mirrored row
  const len = rowCountsLocal.value.length;
  if (enabled) {
    // Add mirrors for all selected indices
    const set = new Set<number>(selectedRowIndices.value);
    selectedRowIndices.value.forEach((i) => {
      const m = len - 1 - i;
      if (m !== i && m >= 0 && m < len) set.add(m);
    });
    selectedRowIndices.value = Array.from(set);
  } else {
    // Remove mirrored indices that were only present due to mirroring
    // Keep current selection as-is; user can manually adjust.
    // No-op for simplicity.
  }
  // Refresh selectedIds and highlight bands
  const rows = groupRows();
  const ids = new Set<string>();
  selectedRowIndices.value.forEach((i) => {
    const row = rows[i];
    if (row) row.forEach((t) => ids.add(t.id));
  });
  selectedIds.value = Array.from(ids);
  if (selectedRowDisplayIndex.value !== null) {
    selectedRowTargetCount.value = rowCountsLocal.value[selectedRowDisplayIndex.value] ?? null;
  }
  renderAll();
});

// Drag-to-select removed

watch(() => props.tubes, renderAll, { deep: true });
watch(() => props.config, renderAll, { deep: true });
// Redraw when row selection changes so highlight bands update immediately
watch(selectedRowDisplayIndex, renderAll);

function renderAll() {
  const svg = svgRef.value;
  if (!svg) return;
  const vp = svg.querySelector("#viewport") as SVGGElement;
  if (!vp) return;
  vp.innerHTML = "";

  drawBoundary(vp, props.config, centerX, centerY, scalePx);

  // Row highlight bands (draw behind circles)
  drawRowHighlights(vp);

  const frag = document.createDocumentFragment();

  props.tubes.forEach((t) => {
    if (t.deleted) return;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", String(centerX + t.x * scalePx));
    c.setAttribute("cy", String(centerY + t.y * scalePx));
    c.setAttribute("r", String(t.r * scalePx));
    c.setAttribute("data-name", t.id);
    // Determine fill color based on tube property or capped/blocked
    const propertyColors: Record<string, string> = {
      catalyst_tc: '#16a34a',
      coolant: '#22c55e',
      solid: '#64748b',
      bend: '#f97316',
      salt_tc: '#0ea5e9',
      blocked: '#ef4444',
    };
    const defaultFill = t.capped ? (t.capColor ?? '#facc15') : '#60a5fa';
    const propKey = t.blocked ? 'blocked' : (t.property ?? null);
    const fill: string = propKey
      ? (t.propertyColor ?? propertyColors[propKey as keyof typeof propertyColors] ?? defaultFill)
      : defaultFill;
    c.setAttribute("fill", fill);
    c.setAttribute("stroke", "#0f172a");
    c.setAttribute("stroke-width", "0.2");

    if (selectedIds.value.includes(t.id)) c.classList.add("highlight");

    // Tooltip
    c.addEventListener("mouseenter", () => {
      const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("id", `tip-${t.id}`);
      txt.setAttribute("x", String(centerX + t.x * scalePx + 10));
      txt.setAttribute("y", String(centerY + t.y * scalePx - 4));
      txt.setAttribute("fill", "#334155");
      txt.setAttribute("font-size", "12");
      txt.textContent = t.id;
      vp.appendChild(txt);
    });
    c.addEventListener("mouseleave", () => {
      const tip = vp.querySelector(`#tip-${t.id}`);
      if (tip) tip.remove();
    });

    // Click selection
    c.addEventListener("click", () => {
      const id = t.id;
      if (multiSelect.value) {
        if (selectedIds.value.includes(id)) {
          selectedIds.value = selectedIds.value.filter((sid) => sid !== id);
          c.classList.remove("highlight");
        } else {
          selectedIds.value.push(id);
          c.classList.add("highlight");
        }
      } else {
        vp.querySelectorAll("circle[data-name]").forEach((z) =>
          z.classList.remove("highlight")
        );
        selectedIds.value = [id];
        c.classList.add("highlight");
      }
      
    });

    frag.appendChild(c);
  });

  vp.appendChild(frag);
}

onMounted(() => {
  renderAll();
});

onBeforeUnmount(() => {
  isDownloading = false;
});

function zoomIn() {
  zoom(1.15);
}
function zoomOut() {
  zoom(1 / 1.15);
}
function panXY(dx: number, dy: number) {
  pan(dx, dy);
}
function resetView() {
  reset();
}

function onSearch(term: string) {
  if (!term) return alert("Enter tube ID");
  const svg = svgRef.value;
  if (!svg) return;
  const vp = svg.querySelector("#viewport") as SVGGElement;
  vp.querySelectorAll("circle[data-name]").forEach((c) =>
    c.classList.remove("highlight")
  );
  const el = vp.querySelector(`circle[data-name='${term}']`) as SVGCircleElement | null;
  if (!el) return alert("Tube not found");

  selectedIds.value = [term];
  el.classList.add("highlight");

  if (autoZoom.value) {
    const bbox = el.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;
    smoothZoomAndPan(cx, cy, 3);
  }
}

function smoothZoomAndPan(targetX: number, targetY: number, targetZoom: number) {
  const steps = 20;
  const startZoom = scale.value;
  const startTx = tx.value;
  const startTy = ty.value;
  const endZoom = targetZoom;
  const endTx = centerX - targetX * targetZoom;
  const endTy = centerY - targetY * targetZoom;
  let step = 0;
  function animate() {
    step++;
    const t = step / steps;
    scale.value = startZoom + (endZoom - startZoom) * t;
    tx.value = startTx + (endTx - startTx) * t;
    ty.value = startTy + (endTy - startTy) * t;
    if (step < steps) requestAnimationFrame(animate);
  }
  animate();
}

// --- CAP / BLOCK / DELETE / COPY / DOWNLOAD ---

function capSelected(capColor = "#facc15") {
  if (selectedIds.value.length === 0)
    return useToast().add({ title: "No Tube Selected", color: "error" });
  props.tubes.forEach((t) => {
    if (selectedIds.value.includes(t.id)) {
      t.capped = true;
      t.capColor = capColor;
      useToast().add({ title: `${t.id} Capped` });
    }
  });
  renderAll();
  emits("updateTubes", props.tubes);
}

function blockSelected() {
  if (selectedIds.value.length === 0)
    return useToast().add({ title: "No Tube Selected", color: "error" });
  props.tubes.forEach((t) => {
    if (selectedIds.value.includes(t.id)) {
      t.blocked = true;
      useToast().add({ title: `${t.id} Blocked` });
    }
  });
  renderAll();
  emits("updateTubes", props.tubes);
}

function applyProperty(property: 'catalyst_tc' | 'coolant' | 'solid' | 'bend' | 'salt_tc' | 'blocked', color?: string) {
  if (selectedIds.value.length === 0)
    return useToast().add({ title: 'No Tube Selected', color: 'error' });
  props.tubes.forEach((t) => {
    if (selectedIds.value.includes(t.id)) {
      if (property === 'blocked') {
        t.blocked = true;
        t.property = null;
        t.propertyColor = null;
        useToast().add({ title: `${t.id} Blocked` });
      } else {
        t.blocked = false;
        t.property = property;
        t.propertyColor = null;
        useToast().add({ title: `${t.id} ${property.replace('_', ' ').toUpperCase()}` });
      }
    }
  });
  renderAll();
  emits('updateTubes', props.tubes);
}

function deleteSelected() {
  if (selectedIds.value.length === 0)
    return useToast().add({ title: "No Tube Selected", color: "error" });
  const updatedTubes = props.tubes.map((t) => ({
    ...t,
    deleted: selectedIds.value.includes(t.id) ? true : t.deleted,
  }));

  selectedIds.value.forEach((id) => {
    useToast().add({ title: `${id} Deleted` });
  });
  selectedIds.value = [];

  emits("updateTubes", updatedTubes);
}

function copyJson() {
  const payload = JSON.stringify(props.tubes, null, 2);
  navigator.clipboard?.writeText(payload);
  emits("copyJson");
}

function copyTubes() {
  const payload = JSON.stringify(rowCountsLocal.value, null, 2).replaceAll('[','').replaceAll(']','');
  navigator.clipboard?.writeText(payload);
}

let isDownloading = false;

function downloadSvg() {
  if (isDownloading) return;
  isDownloading = true;

  try {
    const svgData = svgRef.value?.outerHTML;
    if (!svgData) return;

    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ots_layout.svg";
    a.click();
  } finally {
    setTimeout(() => (isDownloading = false), 1000);
  }

  emits("download");
}

// Measurements feature removed

// --- ROW OPERATIONS ---
function groupRows(): Tube[][] {
  const active = props.tubes.filter((t) => !t.deleted);
  if (active.length === 0) return [];
  const sorted = [...active].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: Tube[][] = [];
  let current: Tube[] = [];
  // Guard against potential empty array to satisfy TypeScript's safety checks
  if (sorted.length === 0) return [];
  const first = sorted[0];
  if (!first) return [];
  let lastY = first.y;
  const rowThreshold = (props.config.pitch ?? 1) * 0.3;
  for (const t of sorted) {
    if (Math.abs(t.y - lastY) > rowThreshold) {
      rows.push(current);
      current = [];
    }
    current.push(t);
    lastY = t.y;
  }
  if (current.length) rows.push(current);
  return rows;
}

function selectRowByDisplayIndex(idx: number) {
  const rows = groupRows();
  if (!rows[idx]) return;
  selectedRowDisplayIndex.value = idx;
  selectedRowIndex.value = idx;
  // Add to multi-selection set if not present
  if (!selectedRowIndices.value.includes(idx)) {
    selectedRowIndices.value.push(idx);
  }
  // Mirror: ensure mirrored row also selected in multi-select when enabled
  if (mirrorMode.value) {
    const len = rowCountsLocal.value.length;
    const m = len - 1 - idx;
    if (m !== idx && !selectedRowIndices.value.includes(m)) {
      selectedRowIndices.value.push(m);
    }
  }
  const ids = new Set<string>();
  selectedRowIndices.value.forEach((i) => {
    const row = rows[i];
    if (row) row.forEach((t) => ids.add(t.id));
  });
  selectedIds.value = Array.from(ids);
  const svg = svgRef.value;
  const vp = svg?.querySelector("#viewport") as SVGGElement | null;
  // sync floating control input with current count
  selectedRowTargetCount.value = rowCountsLocal.value[idx] ?? null;
  // Redraw to apply row highlight bands and selection state immediately
  renderAll();
}

function estimateRowOffset(row: Tube[]): number {
  const pitch = props.config.pitch;
  if (!pitch || row.length === 0) return 0;
  const mods = row.map((t) => ((t.x % pitch) + pitch) % pitch);
  const avg = mods.reduce((s, v) => s + v, 0) / mods.length;
  if (Math.abs(avg - pitch / 2) < pitch * 0.25) return pitch / 2;
  return 0;
}

function addTubesToSelectedRow() {
  if (selectedRowIndex.value === null) {
    useToast().add({ title: "Select a row first", color: "error" });
    return;
  }
  const rows = groupRows();
  const row = rows[selectedRowIndex.value];
  if (!row || row.length === 0) return;

  const pitch = props.config.pitch;
  if (!(pitch > 0)) {
    useToast().add({ title: "Invalid pitch", color: "error" });
    return;
  }
  const r = props.config.tubeRadius;
  // Default to adding one tube on each side when invoked from floating controls
  const add = 1;

  const xs = row.map((t) => t.x).sort((a, b) => a - b);
  const y = row[0]?.y ?? 0;
  const minX = xs[0] ?? 0;
  const maxX = xs[xs.length - 1] ?? 0;

  const newTubes: Tube[] = [];
  for (let i = 1; i <= add; i++) {
    newTubes.push({ id: "", x: maxX + i * pitch, y, r, capped: false, capColor: null, blocked: false, deleted: false });
  }
  for (let i = 1; i <= add; i++) {
    newTubes.push({ id: "", x: minX - i * pitch, y, r, capped: false, capColor: null, blocked: false, deleted: false });
  }

  const updated = [...props.tubes, ...newTubes];
  emits("updateTubes", updated);
}

function setRowCount(rowIdx: number, targetCount: number) {
  const rows = groupRows();
  const row = rows[rowIdx];
  if (!row) return;
  const current = row.length;
  const pitch = props.config.pitch;
  const r = props.config.tubeRadius;
  if (!(pitch > 0)) {
    useToast().add({ title: "Invalid pitch", color: "error" });
    return;
  }
  if (targetCount < 0) targetCount = 0;

  const xs = row.map((t) => t.x).sort((a, b) => a - b);
  const y = row[0]?.y ?? 0;
  const minX = xs[0] ?? 0;
  const maxX = xs[xs.length - 1] ?? 0;

  if (targetCount === current) return;

  if (targetCount > current) {
    const delta = targetCount - current;
    const addRight = Math.ceil(delta / 2);
    const addLeft = Math.floor(delta / 2);
    const newTubes: Tube[] = [];
    for (let i = 1; i <= addRight; i++) {
      newTubes.push({ id: "", x: maxX + i * pitch, y, r, capped: false, capColor: null, blocked: false, deleted: false });
    }
    for (let i = 1; i <= addLeft; i++) {
      newTubes.push({ id: "", x: minX - i * pitch, y, r, capped: false, capColor: null, blocked: false, deleted: false });
    }
    const updated = [...props.tubes, ...newTubes];
    emits("updateTubes", updated);
    return;
  }

  // targetCount < current: delete from ends
  const removeDelta = current - targetCount;
  const sortedRow = [...row].sort((a, b) => a.x - b.x);
  const leftToDelete = Math.floor(removeDelta / 2);
  const rightToDelete = Math.ceil(removeDelta / 2);
  const leftIds = sortedRow.slice(0, Math.max(0, leftToDelete)).map((t) => t.id);
  const rightIds = sortedRow.slice(Math.max(sortedRow.length - rightToDelete, 0)).map((t) => t.id);
  const idsToDelete = new Set<string>([...leftIds, ...rightIds]);
  const updated = props.tubes.map((t) => (idsToDelete.has(t.id) ? { ...t, deleted: true } : t));
  emits("updateTubes", updated);
}

function applySelectedRowCount() {
  if (selectedRowDisplayIndex.value === null) return;
  const val = selectedRowTargetCount.value;
  if (val === null || isNaN(val as number)) return;
  const target = Math.max(0, (val as number) | 0);
  if (!mirrorMode.value) {
    setRowCount(selectedRowDisplayIndex.value, target);
    // Clear selection after apply
    selectedRowIndices.value = [];
    selectedRowDisplayIndex.value = null;
    selectedRowIndex.value = null;
    selectedIds.value = [];
    selectedRowTargetCount.value = null;
    renderAll();
    return;
  }
  // Apply to both primary and mirrored rows in one combined update
  const rows = groupRows();
  const primaryIdx = selectedRowDisplayIndex.value;
  const mirrorIdx = rows.length - 1 - primaryIdx;
  const updatedOnce = computeSetRowCountUpdate(props.tubes, primaryIdx, target);
  let updatedFinal = updatedOnce;
  if (mirrorIdx !== primaryIdx && mirrorIdx >= 0 && mirrorIdx < rows.length) {
    updatedFinal = computeSetRowCountUpdate(updatedOnce, mirrorIdx, target);
  }
  emits("updateTubes", updatedFinal);
  // Clear selection after apply
  selectedRowIndices.value = [];
  selectedRowDisplayIndex.value = null;
  selectedRowIndex.value = null;
  selectedIds.value = [];
  selectedRowTargetCount.value = null;
  renderAll();
}

function deleteSelectedRow() {
  if (selectedRowIndex.value === null) {
    useToast().add({ title: "Select a row first", color: "error" });
    return;
  }
  const rows = groupRows();
  const primaryIdx = selectedRowIndex.value;
  const primary = rows[primaryIdx];
  if (!primary) return;
  let idsToDelete = new Set(primary.map((t) => t.id));
  if (mirrorMode.value) {
    const mirrorIdx = rows.length - 1 - primaryIdx;
    if (rows[mirrorIdx] && mirrorIdx !== primaryIdx) {
      rows[mirrorIdx].forEach((t) => idsToDelete.add(t.id));
    }
  }
  const updated = props.tubes.map((t) => ({ ...t, deleted: idsToDelete.has(t.id) ? true : t.deleted }));
  emits("updateTubes", updated);
  // Clear selection after delete apply
  selectedRowIndices.value = [];
  selectedRowDisplayIndex.value = null;
  selectedRowIndex.value = null;
  selectedIds.value = [];
  rowsToDelete.value = [];
  selectedRowTargetCount.value = null;
  renderAll();
}

function addRow(offsetSign: 1 | -1) {
  if (selectedRowIndex.value === null) {
    useToast().add({ title: "Select a row first", color: "error" });
    return;
  }
  const rows = groupRows();
  const primaryIdx = selectedRowIndex.value;
  const primary = rows[primaryIdx];
  if (!primary || primary.length === 0) return;

  const pitch = props.config.pitch;
  if (!(pitch > 0)) {
    useToast().add({ title: "Invalid pitch", color: "error" });
    return;
  }
  const vspace = props.config.lattice === "triangular" ? (pitch * Math.sqrt(3)) / 2 : pitch;

  const newRowPrimary = computeAddRowForIndex(rows, primaryIdx, offsetSign, vspace);
  let newRowMirror: Tube[] = [];
  if (mirrorMode.value) {
    const mirrorIdx = rows.length - 1 - primaryIdx;
    if (rows[mirrorIdx] && mirrorIdx !== primaryIdx) {
      newRowMirror = computeAddRowForIndex(rows, mirrorIdx, offsetSign, vspace);
    }
  }
  const updated = [...props.tubes, ...newRowPrimary, ...newRowMirror];
  emits("updateTubes", updated);
}

function addRowAbove() { addRow(-1); }
function addRowBelow() { addRow(1); }

// Drag-to-select feature removed

  // Toolbar fixed at top: no anchor or drag logic needed

defineExpose({
  capSelected,
  blockSelected,
  deleteSelected,
  downloadSvg,
  copyJson,
  applyProperty,
  // Row operations are internal via UI
});

function drawRowHighlights(vp: SVGGElement) {
  const rows = groupRows();
  const indicesSet = new Set<number>();
  // Include multi-selected indices
  selectedRowIndices.value.forEach((i) => indicesSet.add(i));
  // Include primary selection
  if (selectedRowDisplayIndex.value !== null) indicesSet.add(selectedRowDisplayIndex.value);
  if (indicesSet.size === 0) return;
  if (rows.length === 0) return;
  const pitchVal = props.config.pitch ?? 0;
  const vspace = props.config.lattice === "triangular"
    ? (pitchVal * Math.sqrt(3)) / 2
    : pitchVal;
  const bandHeightPx = (vspace ?? 0) * scalePx;

  const indices: number[] = Array.from(indicesSet);
  // Add mirror index only if primary exists and not already in set
  const mirrorIdx = selectedRowSecondaryIndex.value;
  if (mirrorIdx !== null) {
    indicesSet.add(mirrorIdx);
  }
  const finalIndices: number[] = Array.from(indicesSet);

  for (const idx of finalIndices) {
    const row = rows[idx];
    if (!row || row.length === 0) continue;
    const yModel = row[0]?.y;
    if (typeof yModel !== "number") continue;
    const yPxCenter = centerY + yModel * scalePx;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", String(yPxCenter - bandHeightPx / 2));
    rect.setAttribute("width", String(svgWidth));
    rect.setAttribute("height", String(bandHeightPx));
    rect.setAttribute("class", "row-highlight");
    vp.appendChild(rect);
  }
}
// Local helpers for mirrored operations
function groupRowsFrom(tubesArr: Tube[]): Tube[][] {
  const active = tubesArr.filter((t) => !t.deleted);
  if (active.length === 0) return [];
  const sorted = [...active].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: Tube[][] = [];
  let current: Tube[] = [];
  const first = sorted[0];
  if (!first) return [];
  let lastY = first.y;
  const rowThreshold = (props.config.pitch ?? 1) * 0.3;
  for (const t of sorted) {
    if (Math.abs(t.y - lastY) > rowThreshold) {
      rows.push(current);
      current = [];
    }
    current.push(t);
    lastY = t.y;
  }
  if (current.length) rows.push(current);
  return rows;
}

function computeSetRowCountUpdate(tubesArr: Tube[], rowIdx: number, targetCount: number): Tube[] {
  const rows = groupRowsFrom(tubesArr);
  const row = rows[rowIdx];
  if (!row) return tubesArr;
  const current = row.length;
  const pitch = props.config.pitch;
  const r = props.config.tubeRadius;
  if (!(pitch > 0)) return tubesArr;
  if (targetCount < 0) targetCount = 0;

  const xs = row.map((t) => t.x).sort((a, b) => a - b);
  const y = row[0]?.y ?? 0;
  const minX = xs[0] ?? 0;
  const maxX = xs[xs.length - 1] ?? 0;

  if (targetCount === current) return tubesArr;

  if (targetCount > current) {
    const delta = targetCount - current;
    const addRight = Math.ceil(delta / 2);
    const addLeft = Math.floor(delta / 2);
    const newTubes: Tube[] = [];
    for (let i = 1; i <= addRight; i++) {
      newTubes.push({ id: "", x: maxX + i * pitch, y, r, capped: false, capColor: null, blocked: false, deleted: false });
    }
    for (let i = 1; i <= addLeft; i++) {
      newTubes.push({ id: "", x: minX - i * pitch, y, r, capped: false, capColor: null, blocked: false, deleted: false });
    }
    return [...tubesArr, ...newTubes];
  }

  // targetCount < current: delete from ends
  const removeDelta = current - targetCount;
  const sortedRow = [...row].sort((a, b) => a.x - b.x);
  const leftToDelete = Math.floor(removeDelta / 2);
  const rightToDelete = Math.ceil(removeDelta / 2);
  const leftIds = sortedRow.slice(0, Math.max(0, leftToDelete)).map((t) => t.id);
  const rightIds = sortedRow.slice(Math.max(sortedRow.length - rightToDelete, 0)).map((t) => t.id);
  const idsToDelete = new Set<string>([...leftIds, ...rightIds]);
  return tubesArr.map((t) => (idsToDelete.has(t.id) ? { ...t, deleted: true } : t));
}

function computeAddRowForIndex(rows: Tube[][], rowIdx: number, offsetSign: 1 | -1, vspace: number): Tube[] {
  const row = rows[rowIdx];
  if (!row || row.length === 0) return [];
  const pitch = props.config.pitch!;
  const currentOffset = estimateRowOffset(row);
  const targetOffset = props.config.lattice === "triangular" ? (currentOffset === 0 ? pitch / 2 : 0) : 0;
  const dy = offsetSign * vspace;
  const dx = targetOffset - currentOffset;
  return row.map((t) => ({
    id: "",
    x: t.x + dx,
    y: t.y + dy,
    r: props.config.tubeRadius,
    capped: false,
    capColor: null,
    blocked: false,
    deleted: false,
  }));
}
</script>

<style>
.highlight {
  stroke: #f43f5e;
  stroke-width: 2 !important;
  filter: drop-shadow(0 0 4px #f43f5e88);
}
.measure-line {
  stroke-dasharray: 3 3;
}
.measure-text {
  font-size: 5px;
  fill: #dc2626;
  user-select: none;
}
.selection-box {
  pointer-events: none;
  stroke-dasharray: 4 2;
}

.row-highlight {
  fill: rgba(59, 130, 246, 0.12);
  stroke: rgba(59, 130, 246, 0.3);
  stroke-width: 0.5;
}


.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>


