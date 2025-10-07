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
        @block="onBlock"
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
  meta_b: () => onBlock(),
  meta_d: () => onDownload(),
});

const { config, tubes, validateAndGenerate, setConfig } = useReactorGenerator();

const canvasRef = ref<InstanceType<typeof ReactorCanvas> | null>(null);
function onGenerate() {
  validateAndGenerate();
}

function onCap(capColor = "#facc15") {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.capSelected(capColor);
}

function onBlock() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.blockSelected();
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
}
</script>
