<template>
  <div class="grid grid-cols-10 relative">
    <div class="col-span-2 sticky">
  <ConfigPanel
    :model="config"
    :tubesCount="tubes.length"
    @update:model="setConfig"
    @generate="onGenerate"
    @copyJson="onCopyJson"
    @download="onDownload"
    @cap="onCap"
    @setProperty="onSetProperty"
    @delete="onDelete"
  />
    </div>
    <div class="col-span-8">
      <ReactorCanvas
        ref="canvasRef"
        :config="config"
        :tubes="tubes"
        @copyJson="onCopyJson"
        @download="onDownload"
        :rowCount="rowCount"
        @updateTubes="handleUpdateTubes"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import ConfigPanel from "@/components/ConfigPanel.vue";
import ReactorCanvas from "@/components/ReactorCanvas.vue";
import { useReactorGenerator } from "@/composables/useReactorGenerator";
import type { Tube } from "~/types";

defineShortcuts({
  meta_backspace: () => onDelete(),
  meta_b: () => onSetProperty('blocked'),
  meta_d: () => onDownload(),
});

const { config, tubes, validateAndGenerate, setConfig,rowCount } = useReactorGenerator();

const canvasRef = ref<InstanceType<typeof ReactorCanvas> | null>(null);
function onGenerate() {
  validateAndGenerate();
}

function onCap(capColor = "#facc15") {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.capSelected(capColor);
}

function onSetProperty(property: 'catalyst_tc' | 'coolant' | 'solid' | 'bend' | 'salt_tc' | 'blocked') {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.applyProperty(property);
}

function onDelete() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.deleteSelected();
}

function onCopyJson() {
  try {
    const json = JSON.stringify(tubes.value, null, 2);
    navigator.clipboard?.writeText(json);
    useToast().add({ title: "Coppied", color: "success" });
  } catch (e) {
    useToast().add({ title: "Failed to copy JSON.", color: "error" });
  }
}

function onDownload() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.downloadSvg();
}

function handleUpdateTubes(updated: Tube[]) {
  const active = updated.filter((t) => !t.deleted);
  if (active.length === 0) {
    tubes.value = [];
    return;
  }

  // Sort by Y first
  const sorted = [...active].sort((a, b) => a.y - b.y || a.x - b.x);

  const grouped: Tube[][] = [];
  let currentRow: Tube[] = [];
  let lastY = sorted[0]?.y || 0;
  const tolerance = 1e-3; // small Y difference threshold

  for (const t of sorted) {
    if (Math.abs(t.y - lastY) > tolerance) {
      grouped.push(currentRow);
      currentRow = [];
    }
    currentRow.push(t);
    lastY = t.y;
  }
  if (currentRow.length) grouped.push(currentRow);

  // Sort each row left→right and assign new IDs
  const reassigned: Tube[] = [];
  grouped.forEach((row, i) => {
    const sortedRow = row.sort((a, b) => a.x - b.x);
    sortedRow.forEach((tube, j) => {
      reassigned.push({ ...tube, id: `R${i + 1}C${j + 1}` });
    });
  });

  tubes.value = reassigned;

  // Auto-update shape dimensions to fit tubes while keeping padding
  const xs = reassigned.map((t) => t.x);
  const ys = reassigned.map((t) => t.y);
  const pad = config.value.padding ?? 0;
  const tubeR = config.value.tubeRadius ?? 0;

  if (config.value.shape === 'circle' || config.value.shape === 'hexagon' || config.value.shape === 'doughnut') {
    // Use radial distance so diagonal rows don't overflow the boundary
    const maxTubeEdgeRadius = reassigned.reduce((m, t) => Math.max(m, Math.hypot(t.x, t.y) + tubeR), 0);
    const newOuter = maxTubeEdgeRadius + pad;
    config.value.outerDimension = Math.max(newOuter, config.value.outerDimension);
  } else if (config.value.shape === 'square') {
    const extentX = xs.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    const extentY = ys.reduce((m, y) => Math.max(m, Math.abs(y)), 0);
    const half = Math.max(extentX, extentY) + pad + tubeR;
    config.value.outerDimension = Math.max(half * 2, config.value.outerDimension);
  } else if (config.value.shape === 'rectangle') {
    const extentX = xs.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    const extentY = ys.reduce((m, y) => Math.max(m, Math.abs(y)), 0);
    const halfW = extentX + pad + tubeR;
    const halfH = extentY + pad + tubeR;
    config.value.width = Math.max((config.value.width ?? 0), halfW * 2);
    config.value.height = Math.max((config.value.height ?? 0), halfH * 2);
  }
}
</script>
