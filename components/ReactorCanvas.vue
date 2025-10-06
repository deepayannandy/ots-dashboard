<template>
  <div class="flex-1 bg-white p-4 flex flex-col">
    <div class="flex items-center justify-end mb-2">
      <div class="flex items-end gap-2">
        <SearchBar @search="onSearch" />
      </div>
    </div>
    <div
      class="flex justify-center items-center rounded-xl overflow-hidden relative"
    >
      <svg
        ref="svgRef"
        :width="svgWidth"
        :height="svgHeight"
        viewBox="0 0 1200 760"
        xmlns="http://www.w3.org/2000/svg"
      >
        <GridRuler :width="svgWidth" :height="svgHeight" />
        <g id="viewport" :transform="transformStr"></g>
      </svg>

      <div class="absolute bottom-0 right-0">
        <ZoomControls
          @zoomIn="zoomIn"
          @zoomOut="zoomOut"
          @pan="panXY"
          @reset="resetView"
        />
      </div>
      <!-- floating UI info -->
      <div class="absolute left-4 bottom-0 bg-white/80 p-2 rounded shadow">
        <div class="text-xs text-slate-600">Zoom: {{ scale.toFixed(2) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import type { ReactorConfig, Tube } from "@/types";
import { drawBoundary } from "@/utils/svgHelpers";
import ZoomControls from "@/components/Controls/ZoomControls.vue";
import SearchBar from "@/components/Controls/SearchBar.vue";
import { useViewportTransform } from "@/composables/useViewportTransform";

// props + emits
const props = defineProps<{ config: ReactorConfig; tubes: Tube[] }>();
const emits = defineEmits(["updateTubes", "copyJson", "download"]);

const svgRef = ref<SVGSVGElement | null>(null);
const svgWidth = 1200;
const svgHeight = 660;
const centerX = 600;
const centerY = 400;
const scalePx = 2;

const { scale, tx, ty, zoom, pan, reset } = useViewportTransform();
const transformStr = computed(
  () => `translate(${tx.value} ${ty.value}) scale(${scale.value})`
);
const selectedId = ref<string | null>(null);

// re-render whenever config or tubes change
watch(() => props.tubes, renderAll, { deep: true });
watch(() => props.config, renderAll, { deep: true });

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

    // hover tooltip
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

    // click highlight
    c.addEventListener("click", () => {
      vp.querySelectorAll("circle[data-name]").forEach((z) =>
        z.classList.remove("highlight")
      );
      c.classList.add("highlight");
      selectedId.value = t.id;
      console.log("hello", t.id);
    });

    frag.appendChild(c);
  });

  vp.appendChild(frag);
}

onMounted(() => renderAll());

// zoom / pan
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

// search & highlight
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
  el.classList.add("highlight");
  selectedId.value = term;
}

// --- tube actions exposed to parent ---
function capSelected(capColor = "#facc15") {
  if (!selectedId.value) return alert("Select a tube first");
  const t = props.tubes.find((x) => x.id === selectedId.value);
  if (!t) return;
  t.capped = true;
  t.capColor = capColor;
  renderAll();
  emits("updateTubes", props.tubes);
}

function blockSelected() {
  if (!selectedId.value) return alert("Select a tube first");
  const t = props.tubes.find((x) => x.id === selectedId.value);
  if (!t) return;
  t.blocked = true;
  renderAll();
  emits("updateTubes", props.tubes);
}

function deleteSelected() {
  if (!selectedId.value) return alert("Select a tube first");
  const t = props.tubes.find((x) => x.id === selectedId.value);
  if (!t) return;
  t.deleted = true;
  renderAll();
  emits("updateTubes", props.tubes);
}

// export (used by parent page)
function copyJson() {
  const payload = JSON.stringify(props.tubes, null, 2);
  navigator.clipboard?.writeText(payload).then(() => alert("Tube JSON copied"));
  emits("copyJson");
}

function downloadSvg() {
  const data = new Blob([svgRef.value?.outerHTML || ""], {
    type: "image/svg+xml",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(data);
  a.download = "ots_layout.svg";
  a.click();
  emits("download");
}

// ✅ expose these methods so parent can call them via `canvasRef.value?.method()`
defineExpose({
  capSelected,
  blockSelected,
  deleteSelected,
  downloadSvg,
  copyJson,
});
</script>

<style>
.tooltip {
  font-size: 12px;
  fill: #334155;
  pointer-events: none;
}

.highlight {
  stroke: #f43f5e;
  stroke-width: 2 !important;
}
</style>
