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

          <span class="text-xs sm:text-sm text-slate-600"
            >Show Measurements</span
          >
          <USwitch v-model="showMeasurements" />
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
        class="absolute top-3 right-3 bg-white/90 rounded-xl p-2 shadow-md text-xs sm:text-sm w-48"
      >
        <div
          class="flex items-center justify-between cursor-pointer select-none"
          @click="isRowCountCollapsed = !isRowCountCollapsed"
        >
          <span class="font-medium text-slate-700">Row Counts</span>
          <UIcon name="i-mdi-shape-plus-outline" @click="copyTubes"></UIcon>
          <span
            class="text-slate-500 text-[10px] transition-transform"
            :class="{ 'rotate-90': isRowCountCollapsed }"
          >
            ▶
          </span>
        </div>

        <transition name="fade">
          <div
            v-if="!isRowCountCollapsed"
            class="mt-2 max-h-96 overflow-y-auto pr-1"
          >
            <div
              v-for="(count, idx) in rowCountsLocal"
              :key="idx"
              class="flex justify-between border-b border-slate-200 py-0.5 cursor-pointer"
              @click="selectRowByDisplayIndex(idx)"
            >
              <span :class="{ 'text-blue-600 font-semibold': selectedRowDisplayIndex === idx, 'text-red-500 font-bold': idx === Math.floor(rowCountsLocal.length / 2) }">Row {{ idx + 1 }}</span>
              <span class="font-medium text-slate-600">{{ count }}</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- Fixed toolbar at top -->
      <div
        v-if="selectedRowDisplayIndex !== null"
        class="absolute z-20 top-3 left-1/2 -translate-x-1/2 transform"
      >
        <div class="bg-white/90 rounded-md shadow-sm p-1 flex items-center gap-1">
          <span class="text-[10px] sm:text-xs text-slate-700">Row {{ (selectedRowDisplayIndex ?? 0) + 1 }}</span>
          <UInput
            v-model.number="selectedRowTargetCount"
            type="number"
            min="0"
            class="w-16"
          />
          <UButton size="xs" variant="solid" @click="applySelectedRowCount">Apply</UButton>
          <UButton size="xs" variant="soft" @click="addRowAbove">↑</UButton>
          <UButton size="xs" variant="soft" @click="addRowBelow">↓</UButton>
          <UButton size="xs" variant="outline" color="error" @click="deleteSelectedRow">Delete</UButton>
        </div>
      </div>

      <!-- Bottom Controls -->
      <div
        class="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white/90 rounded-xl p-2 shadow-md flex flex-col items-center gap-2"
      >
        <ZoomControls
          @zoomIn="zoomIn"
          @zoomOut="zoomOut"
          @pan="panXY"
          @reset="resetView"
        />
      </div>

      <div
        class="absolute bottom-3 left-3 bg-white/80 p-2 rounded shadow-sm text-[10px] sm:text-xs text-slate-600"
      >
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
const showMeasurements = ref(false);
const isRowCountCollapsed = ref(true);
const selectedRowDisplayIndex = ref<number | null>(null);
const selectedRowIndex = ref<number | null>(null); // base-grid i index
const rowCountsLocal = computed(() => groupRows().map((r) => r.length));
const selectedRowTargetCount = ref<number | null>(null);

watch(rowCountsLocal, (counts) => {
  if (selectedRowDisplayIndex.value !== null) {
    selectedRowTargetCount.value = counts[selectedRowDisplayIndex.value] ?? null;
  }
});

const isDragging = ref(false);
const dragStart = ref<{ x: number; y: number } | null>(null);
const dragRect = ref<SVGRectElement | null>(null);

watch(() => props.tubes, renderAll, { deep: true });
watch(() => props.config, renderAll, { deep: true });
watch(showMeasurements, renderAll);

function renderAll() {
  const svg = svgRef.value;
  if (!svg) return;
  const vp = svg.querySelector("#viewport") as SVGGElement;
  if (!vp) return;
  vp.innerHTML = "";

  drawBoundary(vp, props.config, centerX, centerY, scalePx);

  const frag = document.createDocumentFragment();

  props.tubes.forEach((t) => {
    if (t.deleted) return;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", String(centerX + t.x * scalePx));
    c.setAttribute("cy", String(centerY + t.y * scalePx));
    c.setAttribute("r", String(t.r * scalePx));
    c.setAttribute("data-name", t.id);
    const fill = t.blocked
      ? "#ef4444"
      : t.capped
      ? t.capColor || "#facc15"
      : "#60a5fa";
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
      if (showMeasurements.value) drawMeasurements(vp);
    });

    frag.appendChild(c);
  });

  vp.appendChild(frag);
  if (showMeasurements.value) drawMeasurements(vp);
}

onMounted(() => {
  renderAll();
  initDragSelection();
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

// --- MEASUREMENT LINES ---
function drawMeasurements(vp: SVGGElement) {
  const sel = props.tubes.filter((t) => selectedIds.value.includes(t.id));
  vp.querySelectorAll(".measure-line, .measure-text").forEach((e) => e.remove());
  if (sel.length < 2) return;

  for (let i = 0; i < sel.length - 1; i++) {
    for (let j = i + 1; j < sel.length; j++) {
      const a = sel[i]!;
      const b = sel[j]!;
      const x1 = centerX + a.x * scalePx;
      const y1 = centerY + a.y * scalePx;
      const x2 = centerX + b.x * scalePx;
      const y2 = centerY + b.y * scalePx;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy).toFixed(2);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", "#f43f5e");
      line.setAttribute("stroke-width", "0.8");
      line.setAttribute("class", "measure-line");
      vp.appendChild(line);

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.textContent = `${dist}`;
      txt.setAttribute("x", String(midX + 5));
      txt.setAttribute("y", String(midY - 5));
      txt.setAttribute("fill", "#dc2626");
      txt.setAttribute("font-size", "10");
      txt.setAttribute("class", "measure-text");
      vp.appendChild(txt);
    }
  }
}

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
  const ids = rows[idx].map((t) => t.id);
  selectedIds.value = ids;
  const svg = svgRef.value;
  const vp = svg?.querySelector("#viewport") as SVGGElement | null;
  if (vp && showMeasurements.value) drawMeasurements(vp);
  // sync floating control input with current count
  selectedRowTargetCount.value = rowCountsLocal.value[idx] ?? null;
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
  setRowCount(selectedRowDisplayIndex.value, Math.max(0, (val as number) | 0));
}

function deleteSelectedRow() {
  if (selectedRowIndex.value === null) {
    useToast().add({ title: "Select a row first", color: "error" });
    return;
  }
  const rows = groupRows();
  const row = rows[selectedRowIndex.value];
  if (!row) return;
  const ids = new Set(row.map((t) => t.id));
  const updated = props.tubes.map((t) => ({ ...t, deleted: ids.has(t.id) ? true : t.deleted }));
  emits("updateTubes", updated);
  selectedIds.value = [];
}

function addRow(offsetSign: 1 | -1) {
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
  const vspace = props.config.lattice === "triangular" ? (pitch * Math.sqrt(3)) / 2 : pitch;
  const currentOffset = estimateRowOffset(row);
  const targetOffset = props.config.lattice === "triangular" ? (currentOffset === 0 ? pitch / 2 : 0) : 0;

  const dy = offsetSign * vspace;
  const dx = targetOffset - currentOffset;

  const newRow: Tube[] = row.map((t) => ({
    id: "",
    x: t.x + dx,
    y: t.y + dy,
    r: props.config.tubeRadius,
    capped: false,
    capColor: null,
    blocked: false,
    deleted: false,
  }));

  const updated = [...props.tubes, ...newRow];
  emits("updateTubes", updated);
}

function addRowAbove() { addRow(-1); }
function addRowBelow() { addRow(1); }

function initDragSelection() {
  const svg = svgRef.value;
  if (!svg) return;

  const vp = svg.querySelector("#viewport") as SVGGElement;
  if (!vp) return;

  let currentRect: SVGRectElement | null = null;
  const inverseMatrix = () => svg.getScreenCTM()?.inverse();

  svg.addEventListener("mousedown", (e) => {
    if ((e.target as SVGElement).tagName === "circle") return;

    isDragging.value = true;
    const pt = getSvgCoords(e, svg);
    dragStart.value = pt;

    currentRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    currentRect.setAttribute("x", String(pt.x));
    currentRect.setAttribute("y", String(pt.y));
    currentRect.setAttribute("width", "0");
    currentRect.setAttribute("height", "0");
    currentRect.setAttribute("fill", "rgba(59,130,246,0.15)");
    currentRect.setAttribute("stroke", "#2563eb");
    currentRect.setAttribute("stroke-width", "1");
    currentRect.setAttribute("class", "selection-box");
    vp.appendChild(currentRect);
  });

  svg.addEventListener("mousemove", (e) => {
    if (!isDragging.value || !dragStart.value || !currentRect) return;
    const pt = getSvgCoords(e, svg);
    const x = Math.min(pt.x, dragStart.value.x);
    const y = Math.min(pt.y, dragStart.value.y);
    const w = Math.abs(pt.x - dragStart.value.x);
    const h = Math.abs(pt.y - dragStart.value.y);
    currentRect.setAttribute("x", String(x));
    currentRect.setAttribute("y", String(y));
    currentRect.setAttribute("width", String(w));
    currentRect.setAttribute("height", String(h));
  });

  svg.addEventListener("mouseup", () => {
    if (!isDragging.value || !currentRect || !dragStart.value) return;
    isDragging.value = false;

    const { x, y, width, height } = currentRect.getBBox();
    currentRect.remove();

    const xMin = x,
      xMax = x + width,
      yMin = y,
      yMax = y + height;
    const newlySelected: string[] = [];

    vp.querySelectorAll("circle[data-name]").forEach((el) => {
      const cx = parseFloat(el.getAttribute("cx") || "0");
      const cy = parseFloat(el.getAttribute("cy") || "0");

      if (cx >= xMin && cx <= xMax && cy >= yMin && cy <= yMax) {
        newlySelected.push(el.getAttribute("data-name")!);
        el.classList.add("highlight");
      } else if (!multiSelect.value) {
        el.classList.remove("highlight");
      }
    });

    if (multiSelect.value) {
      selectedIds.value = Array.from(new Set([...selectedIds.value, ...newlySelected]));
    } else {
      selectedIds.value = newlySelected;
    }

    dragRect.value = null;
    dragStart.value = null;
    if (showMeasurements.value) drawMeasurements(vp);
  });

  svg.addEventListener("mouseleave", () => {
    if (isDragging.value && currentRect) {
      currentRect.remove();
      isDragging.value = false;
    }
  });

  function getSvgCoords(evt: MouseEvent, svgEl: SVGSVGElement) {
    const pt = svgEl.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const m = inverseMatrix();
    if (m) {
      const transformed = pt.matrixTransform(m);
      return { x: transformed.x, y: transformed.y };
    }
    return { x: pt.x, y: pt.y };
  }
}

// Toolbar fixed at top: no anchor or drag logic needed

defineExpose({
  capSelected,
  blockSelected,
  deleteSelected,
  downloadSvg,
  copyJson,
  // Row operations are internal via UI
});
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

<script lang="ts">
// Helper functions colocated to avoid polluting script setup scope
export default {}
</script>
