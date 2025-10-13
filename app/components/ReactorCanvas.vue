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
        class="absolute top-3 right-3 bg-white/90 rounded-xl p-3 shadow-md text-xs sm:text-sm w-80"
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

        
        <div class="mt-2 flex items-center justify-end gap-2" v-if="!isRowCountCollapsed">
          <template v-if="mirrorMode">
            <UButton size="xs" variant="soft" @click="addRowEnds">Add Ends</UButton>
          </template>
          <template v-else>
            <UButton size="xs" variant="soft" @click="addRowTop">Add Top</UButton>
            <UButton size="xs" variant="soft" @click="addRowBottom">Add Bottom</UButton>
          </template>
        </div>

        
        <div v-if="!isRowCountCollapsed" class="mt-2 space-y-2">
          <label class="text-[10px] sm:text-xs text-slate-600">Counts Array (comma-separated or JSON)</label>
          <textarea
            v-model="rowCountsArrayInput"
            rows="3"
            class="w-full text-xs sm:text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-300"
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
            class="mt-2 max-h-96 overflow-y-auto pr-1 space-y-1"
          >
            <div
              v-for="(count, idx) in rowCountsLocal"
              :key="idx"
              class="flex items-center gap-3 border-b border-slate-200 py-2 cursor-pointer"
              :class="{ 'opacity-60 line-through': rowsToDelete.includes(idx), 'bg-blue-50 rounded-md': selectedRowIndices.includes(idx) }"
              @click="toggleRowSelection(idx)"
            >
              <div class="flex items-center gap-2 flex-1 cursor-pointer">
                <UCheckbox :model-value="selectedRowIndices.includes(idx)" @update:modelValue="() => toggleRowSelection(idx)" @click.stop />
                <button class="text-left cursor-pointer">
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
            <div v-if="rowCountsLocal.length" class="mt-2 sticky bottom-0 bg-white shadow w-full right-0">
              <UButton size="xs" block variant="solid" @click="applyAllRowUpdates">Apply All</UButton>
            </div>
            </div>
          </div>
        </transition>
      </div>

      

      

      
      <div
        class="absolute bottom-3 left-3 sm:bottom-0 flex flex-col items-center gap-2"
      >
        <ZoomControls
          @zoomIn="zoomIn"
          @zoomOut="zoomOut"
          @pan="panXY"
          @reset="resetView"
        />
        <p class="text-[10px] sm:text-xs">Zoom: {{ scale.toFixed(2) }}</p>
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
import { groupRowsFrom as groupRowsFromModule,  computeSetRowCountUpdate as computeSetRowCountUpdateModule, computeAddRowForIndex as computeAddRowForIndexModule } from "@/modules/reactor";

const props = defineProps<{ config: ReactorConfig; tubes: Tube[]; rowCount: number[] }>();
const emits = defineEmits(["updateTubes", "copyJson", "download"]);

const svgRef = ref<SVGSVGElement | null>(null);
const svgWidth = 1200;
const svgHeight = 760;
const centerX = svgWidth / 2;
const centerY = svgHeight / 2;
const scalePx = 2;

// Rendering layers and caching
const elById = new Map<string, SVGCircleElement>();
let rafId: number | null = null;
let tooltipEl: SVGTextElement | null = null;

function ensureLayers(vp: SVGGElement) {
  let boundary = vp.querySelector('#boundary-layer') as SVGGElement | null;
  let highlights = vp.querySelector('#highlight-layer') as SVGGElement | null;
  let tubes = vp.querySelector('#tubes-layer') as SVGGElement | null;
  let labels = vp.querySelector('#labels-layer') as SVGGElement | null;
  const create = (id: string) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', id);
    return g as SVGGElement;
  };
  let appended = false;
  if (!boundary) { boundary = create('boundary-layer'); vp.appendChild(boundary); appended = true; }
  if (!highlights) { highlights = create('highlight-layer'); vp.appendChild(highlights); appended = true; }
  if (!tubes) { tubes = create('tubes-layer'); vp.appendChild(tubes); appended = true; }
  if (!labels) { labels = create('labels-layer'); vp.appendChild(labels); appended = true; }
  // Ensure a single virtualized tooltip element exists
  let tip = labels.querySelector('#tooltip') as SVGTextElement | null;
  if (!tip) {
    tip = document.createElementNS('http://www.w3.org/2000/svg', 'text') as SVGTextElement;
    tip.setAttribute('id', 'tooltip');
    tip.setAttribute('fill', '#334155');
    tip.setAttribute('font-size', '12');
    tip.setAttribute('visibility', 'hidden');
    labels.appendChild(tip);
  }
  tooltipEl = tip;
  // Ensure correct ordering if newly appended
  if (appended) {
    // boundary -> highlights -> tubes -> labels
    const order = ['boundary-layer', 'highlight-layer', 'tubes-layer', 'labels-layer'];
    const children = Array.from(vp.children) as SVGGElement[];
    children.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    children.forEach((c) => vp.appendChild(c));
  }
  return { boundary: boundary!, highlights: highlights!, tubes: tubes!, labels: labels! };
}

function scheduleRender() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    rafId = null;
    renderAll();
  });
}

const { scale, tx, ty, zoom, pan, reset } = useViewportTransform();
const transformStr = computed(
  () => `translate(${tx.value} ${ty.value}) scale(${scale.value})`
);

const selectedIds = ref<string[]>([]);
const autoZoom = ref(true);
const multiSelect = ref(false);
const mirrorMode = ref(false);
const isRowCountCollapsed = ref(true);
const selectedRowDisplayIndex = ref<number | null>(null);
const selectedRowIndex = ref<number | null>(null); // base-grid i index
const rowCountsLocal = computed(() => groupRows().map((r) => r.length));
const selectedRowTargetCount = ref<number | null>(null);

// Optional: Precompute a Map<string, Tube> for reuse in updates
const tubeById = computed(() => {
  const m = new Map<string, Tube>();
  for (const t of props.tubes) m.set(t.id, t);
  return m;
});

// Precompute rows and an index->ids mapping to avoid repeated work on selection
const rowsComputed = computed(() => groupRows());
const rowIndexToIds = computed(() => rowsComputed.value.map((row) => row.map((t) => t.id)));

function updateSelectionVisuals(prev: Set<string>, next: Set<string>) {
  const svg = svgRef.value;
  if (!svg) return;
  const vp = svg.querySelector('#viewport') as SVGGElement;
  if (!vp) return;
  // Toggle highlight class only for changed ids
  for (const id of next) {
    if (!prev.has(id)) {
      const el = elById.get(id);
      if (el) el.classList.add('highlight');
    }
  }
  for (const id of prev) {
    if (!next.has(id)) {
      const el = elById.get(id);
      if (el) el.classList.remove('highlight');
    }
  }
}

function updateRowHighlights() {
  const svg = svgRef.value;
  if (!svg) return;
  const vp = svg.querySelector('#viewport') as SVGGElement;
  if (!vp) return;
  const { highlights } = ensureLayers(vp);
  highlights.innerHTML = '';
  drawRowHighlights(highlights);
}

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

const rowCountsEdits = ref<number[]>([]);
const rowsToDelete = ref<number[]>([]);
const selectedRowIndices = ref<number[]>([]);

watch(rowCountsLocal, (counts) => {
  rowCountsEdits.value = counts.slice();
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
    selectedRowIndices.value.splice(pos, 1);
    if (selectedRowDisplayIndex.value === idx) {
      selectedRowDisplayIndex.value = null;
      selectedRowIndex.value = null;
      selectedRowTargetCount.value = null;
    }
    if (mirrorIdx !== null && mirrorIdx !== idx) {
      const mpos = selectedRowIndices.value.indexOf(mirrorIdx);
      if (mpos >= 0) selectedRowIndices.value.splice(mpos, 1);
    }
  } else {
    selectedRowIndices.value.push(idx);
    selectedRowDisplayIndex.value = idx;
    selectedRowIndex.value = idx;
    selectedRowTargetCount.value = rowCountsLocal.value[idx] ?? null;
    if (mirrorIdx !== null && mirrorIdx !== idx && !selectedRowIndices.value.includes(mirrorIdx)) {
      selectedRowIndices.value.push(mirrorIdx);
    }
  }
  const prev = new Set<string>(selectedIds.value);
  const ids = new Set<string>();
  selectedRowIndices.value.forEach((i) => {
    const arr = rowIndexToIds.value[i];
    if (arr) arr.forEach((id) => ids.add(id));
  });
  selectedIds.value = Array.from(ids);
  updateSelectionVisuals(prev, new Set<string>(selectedIds.value));
  updateRowHighlights();
}

function applyAllRowUpdates() {
  const originalCounts = rowCountsLocal.value.slice();
  let tubesArr = props.tubes.slice();

  for (let idx = 0; idx < rowCountsEdits.value.length; idx++) {
    const target = rowCountsEdits.value[idx] ?? originalCounts[idx] ?? 0;
    const current = originalCounts[idx] ?? 0;
    if (target !== current && target >= 0) {
      const targets = selectedRowIndices.value.includes(idx)
        ? selectedRowIndices.value
        : [idx];
      for (const i of targets) {
        tubesArr = computeSetRowCountUpdate(tubesArr, i, target);
      }
    }
  }

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

  emits("updateTubes", tubesArr);
  selectedRowIndices.value = [];
  selectedRowDisplayIndex.value = null;
  selectedRowIndex.value = null;
  selectedIds.value = [];
  rowsToDelete.value = [];
  selectedRowTargetCount.value = null;
  renderAll();
  useToast().add({ title: "Row updates applied" });
}

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
  }
  return s
    .split(/[^0-9.]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

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
    useToast().add({ title: "Input has fewer rows than current", color: "warning" });
  }

  if (targetLen > currentLen) {
    const toAdd = targetLen - currentLen;
    const addTop = Math.floor(toAdd / 2);
    const addBottom = toAdd - addTop;
    for (let i = 0; i < addTop; i++) {
      const rows = groupRowsFrom(tubesArr);
      const newRow = computeAddRowForIndex(rows, 0, -1 as 1 | -1, vspace);
      tubesArr = [...tubesArr, ...newRow];
    }
    for (let i = 0; i < addBottom; i++) {
      const rows = groupRowsFrom(tubesArr);
      const newRow = computeAddRowForIndex(rows, rows.length - 1, 1 as 1 | -1, vspace);
      tubesArr = [...tubesArr, ...newRow];
    }
  }

  const finalRows = groupRowsFrom(tubesArr);
  const len = Math.min(finalRows.length, counts.length);
  for (let i = 0; i < len; i++) {
    const target = Math.max(0, Number(counts[i]) || 0);
    tubesArr = computeSetRowCountUpdate(tubesArr, i, target);
  }

  emits("updateTubes", tubesArr);
  selectedRowIndices.value = [];
  selectedRowDisplayIndex.value = null;
  selectedRowIndex.value = null;
  selectedIds.value = [];
  rowsToDelete.value = [];
  selectedRowTargetCount.value = null;
  renderAll();
  useToast().add({ title: "Array counts applied" });
}

function onRowCountEdit(idx: number, val: number) {
  if (selectedRowIndices.value.length > 1 && selectedRowIndices.value.includes(idx)) {
    selectedRowIndices.value.forEach((i) => {
      rowCountsEdits.value[i] = val;
    });
  }
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
  const len = rowCountsLocal.value.length;
  if (enabled) {
    const set = new Set<number>(selectedRowIndices.value);
    selectedRowIndices.value.forEach((i) => {
      const m = len - 1 - i;
      if (m !== i && m >= 0 && m < len) set.add(m);
    });
    selectedRowIndices.value = Array.from(set);
  } else {
  }
  const prev = new Set<string>(selectedIds.value);
  const ids = new Set<string>();
  selectedRowIndices.value.forEach((i) => {
    const arr = rowIndexToIds.value[i];
    if (arr) arr.forEach((id) => ids.add(id));
  });
  selectedIds.value = Array.from(ids);
  if (selectedRowDisplayIndex.value !== null) {
    selectedRowTargetCount.value = rowCountsLocal.value[selectedRowDisplayIndex.value] ?? null;
  }
  updateSelectionVisuals(prev, new Set<string>(selectedIds.value));
  updateRowHighlights();
});


watch(() => props.tubes, () => { scheduleRender(); }, { deep: true });
watch(() => props.config, () => { scheduleRender(); }, { deep: true });
watch(selectedRowDisplayIndex, () => scheduleRender());

function renderAll() {
  const svg = svgRef.value;
  if (!svg) return;
  const vp = svg.querySelector('#viewport') as SVGGElement;
  if (!vp) return;

  const { boundary, highlights, tubes, labels } = ensureLayers(vp);
  // Clear non-tube layers
  boundary.innerHTML = '';
  highlights.innerHTML = '';
  // Preserve the virtualized tooltip element in labels layer
  Array.from(labels.children).forEach((child) => {
    if ((child as Element).id !== 'tooltip') child.remove();
  });

  // Boundary
  drawBoundary(boundary, props.config, centerX, centerY, scalePx);
  // Row highlights
  drawRowHighlights(highlights);

  const activeTubes = props.tubes.filter((t) => !t.deleted);
  const presentIds = new Set(activeTubes.map((t) => t.id));

  // Remove stale elements
  for (const [id, el] of Array.from(elById.entries())) {
    if (!presentIds.has(id)) {
      el.remove();
      elById.delete(id);
    }
  }

  // Update/add elements
  const propertyColors: Record<string, string> = {
    catalyst_tc: '#16a34a',
    coolant: '#22c55e',
    solid: '#64748b',
    bend: '#f97316',
    salt_tc: '#0ea5e9',
    blocked: '#ef4444',
  };

  const useFragment = elById.size === 0 && activeTubes.length >= 50;
  const fragment = useFragment ? document.createDocumentFragment() : null;
  const newElements: SVGCircleElement[] = [];

  activeTubes.forEach((t) => {
    let c = elById.get(t.id);
    if (!c) {
      c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('data-name', t.id);
      c.addEventListener('mouseenter', () => {
        if (!tooltipEl) return;
        tooltipEl.textContent = t.id;
        tooltipEl.setAttribute('x', String(centerX + t.x * scalePx + 10));
        tooltipEl.setAttribute('y', String(centerY + t.y * scalePx - 4));
        tooltipEl.setAttribute('visibility', 'visible');
      });
      c.addEventListener('mouseleave', () => {
        if (!tooltipEl) return;
        tooltipEl.setAttribute('visibility', 'hidden');
      });
      c.addEventListener('click', () => {
        const id = t.id;
        if (multiSelect.value) {
          if (selectedIds.value.includes(id)) {
            selectedIds.value = selectedIds.value.filter((sid) => sid !== id);
            c!.classList.remove('highlight');
          } else {
            selectedIds.value.push(id);
            c!.classList.add('highlight');
          }
        } else {
          // Clear previous highlights via cache
          selectedIds.value.forEach((sid) => {
            const el = elById.get(sid);
            if (el) el.classList.remove('highlight');
          });
          selectedIds.value = [id];
          c!.classList.add('highlight');
        }
      });
      if (fragment) newElements.push(c);
      else tubes.appendChild(c);
      elById.set(t.id, c);
    }

    c.setAttribute('cx', String(centerX + t.x * scalePx));
    c.setAttribute('cy', String(centerY + t.y * scalePx));
    c.setAttribute('r', String(t.r * scalePx));
    const defaultFill = t.capped ? (t.capColor ?? '#facc15') : '#ffffff';
    const propKey = t.blocked ? 'blocked' : (t.property ?? null);
    const fill: string = propKey
      ? (t.propertyColor ?? propertyColors[propKey as keyof typeof propertyColors] ?? defaultFill)
      : defaultFill;
    c.setAttribute('fill', fill);
    c.setAttribute('stroke', '#0f172a');
    c.setAttribute('stroke-width', '0.2');

    if (selectedIds.value.includes(t.id)) c.classList.add('highlight');
    else c.classList.remove('highlight');
  });

  if (fragment && newElements.length) {
    newElements.forEach((el) => fragment!.appendChild(el));
    tubes.appendChild(fragment!);
  }
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
  const el = elById.get(term) ?? null;
  if (!el) return alert("Tube not found");

  // Clear previous highlights via cache
  selectedIds.value.forEach((sid) => {
    const prev = elById.get(sid);
    if (prev) prev.classList.remove('highlight');
  });
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
  if (property === 'solid') {
    const updated = props.tubes.map((t) => ({
      ...t,
      deleted: selectedIds.value.includes(t.id) ? true : t.deleted,
      property: selectedIds.value.includes(t.id) ? null : t.property,
      propertyColor: selectedIds.value.includes(t.id) ? null : t.propertyColor,
      blocked: selectedIds.value.includes(t.id) ? false : t.blocked,
    }));
    selectedIds.value.forEach((id) => useToast().add({ title: `${id} Deleted` }));
    selectedIds.value = [];
    emits('updateTubes', updated);
    renderAll();
    return;
  }
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
  const payload = rowCountsLocal.value.join(', ');
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


function groupRows(): Tube[][] {
  // Compute rows directly from current props to ensure reactivity
  return groupRowsFromModule(props.tubes, props.config.pitch!);
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
    selectedRowIndices.value = [];
    selectedRowDisplayIndex.value = null;
    selectedRowIndex.value = null;
    selectedIds.value = [];
    selectedRowTargetCount.value = null;
    renderAll();
    return;
  }
  const rows = groupRows();
  const primaryIdx = selectedRowDisplayIndex.value;
  const mirrorIdx = rows.length - 1 - primaryIdx;
  const updatedOnce = computeSetRowCountUpdate(props.tubes, primaryIdx, target);
  let updatedFinal = updatedOnce;
  if (mirrorIdx !== primaryIdx && mirrorIdx >= 0 && mirrorIdx < rows.length) {
    updatedFinal = computeSetRowCountUpdate(updatedOnce, mirrorIdx, target);
  }
  emits("updateTubes", updatedFinal);
  selectedRowIndices.value = [];
  selectedRowDisplayIndex.value = null;
  selectedRowIndex.value = null;
  selectedIds.value = [];
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




defineExpose({
  capSelected,
  blockSelected,
  deleteSelected,
  downloadSvg,
  copyJson,
  applyProperty,
});

function drawRowHighlights(vp: SVGGElement) {
  const rows = groupRows();
  const indicesSet = new Set<number>();
  selectedRowIndices.value.forEach((i) => indicesSet.add(i));
  if (selectedRowDisplayIndex.value !== null) indicesSet.add(selectedRowDisplayIndex.value);
  if (indicesSet.size === 0) return;
  if (rows.length === 0) return;
  const pitchVal = props.config.pitch ?? 0;
  const vspace = props.config.lattice === "triangular"
    ? (pitchVal * Math.sqrt(3)) / 2
    : pitchVal;
  const bandHeightPx = (vspace ?? 0) * scalePx;

  const indices: number[] = Array.from(indicesSet);
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
function groupRowsFrom(tubesArr: Tube[]): Tube[][] {
  return groupRowsFromModule(tubesArr, props.config.pitch!);
}

function computeSetRowCountUpdate(tubesArr: Tube[], rowIdx: number, targetCount: number): Tube[] {
  return computeSetRowCountUpdateModule(
    tubesArr,
    rowIdx,
    targetCount,
    props.config.pitch!,
    props.config.tubeRadius
  );
}

function computeAddRowForIndex(rows: Tube[][], rowIdx: number, offsetSign: 1 | -1, vspace: number): Tube[] {
  return computeAddRowForIndexModule(
    rows,
    rowIdx,
    offsetSign,
    vspace,
    props.config.lattice,
    props.config.pitch!,
    props.config.tubeRadius
  );
}
</script>

<style>
.highlight {
  stroke: #f43f5e;
  stroke-width: 2 !important;
  filter: drop-shadow(0 0 4px #f43f5e88);
}

.selection-box {
  pointer-events: none;
  stroke-dasharray: 4 2;
}

.row-highlight {
  fill: rgba(255, 0, 0, 0.487);
  stroke: rgb(0, 98, 255);
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




