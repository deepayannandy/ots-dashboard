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
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import ConfigPanel from "@/components/ConfigPanel.vue";
import ReactorCanvas from "@/components/ReactorCanvas.vue";
import { useReactorGenerator } from "@/composables/useReactorGenerator";

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
</script>
