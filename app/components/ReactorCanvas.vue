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
import { ref, watch, computed, onMounted } from "vue";
import type { ReactorConfig, Tube } from "~/types";
import { drawBoundary } from "~/utils/svgHelpers";
import ZoomControls from "@/components/Controls/ZoomControls.vue";
import SearchBar from "@/components/Controls/SearchBar.vue";
import GridRuler from "@/components/GridRuler.vue";

const props = defineProps<{ config: ReactorConfig; tubes: Tube[] }>();
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

  // Draw tubes
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
      const txt = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
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

    // Selection
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

// 📏 Draw distance lines and labels between selected tubes

onMounted(() => renderAll());

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
  const el = vp.querySelector(
    `circle[data-name='${term}']`
  ) as SVGCircleElement | null;
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

function smoothZoomAndPan(
  targetX: number,
  targetY: number,
  targetZoom: number
) {
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
    setTimeout(() => (isDownloading = false), 1000); // reset guard
  }

  emits("download");
}

onBeforeUnmount(() => {
  isDownloading = false;
});

function drawMeasurements(vp: SVGGElement) {
  const sel = props.tubes.filter((t) => selectedIds.value.includes(t.id));
  vp.querySelectorAll(".measure-line, .measure-text").forEach((e) =>
    e.remove()
  );
  if (sel.length < 2) return;

  for (let i = 0; i < sel.length - 1; i++) {
    for (let j = i + 1; j < sel.length; j++) {
      const a = sel[i];
      const b = sel[j];
      if (!a || !b) continue;
      const x1 = centerX + a.x * scalePx;
      const y1 = centerY + a.y * scalePx;
      const x2 = centerX + b.x * scalePx;
      const y2 = centerY + b.y * scalePx;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy).toFixed(2);

      // Line
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", "#f43f5e");
      line.setAttribute("stroke-width", "0.8");
      line.setAttribute("class", "measure-line");
      vp.appendChild(line);

      // Label
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const txt = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
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

defineExpose({
  capSelected,
  blockSelected,
  deleteSelected,
  downloadSvg,
  copyJson,
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
</style>
