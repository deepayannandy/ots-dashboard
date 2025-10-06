<script setup lang="ts">
import { ref } from "vue";
import Navbar from "@/components/Navbar.vue";
import ConfigPanel from "@/components/ConfigPanel.vue";
import ReactorCanvas from "@/components/ReactorCanvas.vue";
import { useReactorGenerator } from "@/composables/useReactorGenerator";

const { config, tubes, error, validateAndGenerate, setConfig } =
  useReactorGenerator();

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
    alert("Configuration JSON copied!");
  } catch (e) {
    alert("Failed to copy JSON.");
  }
}

function onDownload() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.downloadSvg();
}
</script>
<template>
  <div class="grid grid-cols-10">
    <div class="col-span-2">
      <ConfigPanel
        :model="config"
        :tubesCount="tubes.length"
        :error="error"
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
      />
    </div>
  </div>
</template>
