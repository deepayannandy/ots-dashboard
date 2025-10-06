<script setup lang="ts">
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import ConfigPanel from '@/components/ConfigPanel.vue'
import ReactorCanvas from '@/components/ReactorCanvas.vue'
import { useReactorGenerator } from '@/composables/useReactorGenerator'

const { config, tubes, error, validateAndGenerate, setConfig } = useReactorGenerator()

// ref to ReactorCanvas component
const canvasRef = ref<InstanceType<typeof ReactorCanvas> | null>(null)

/**
 * Trigger geometry generation (refresh tubes layout)
 */
function onGenerate() {
  validateAndGenerate()
}

/**
 * Cap selected tube
 * Changes its color to selected capColor from ConfigPanel
 */
function onCap(capColor = '#facc15') {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.capSelected(capColor)
}

/**
 * Block selected tube (mark as blocked, turns red)
 */
function onBlock() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.blockSelected()
}

/**
 * Delete selected tube (remove from view and mark as deleted)
 */
function onDelete() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.deleteSelected()
}

/**
 * Copy tubes data to clipboard as JSON
 */
function onCopyJson() {
  try {
    const json = JSON.stringify(tubes.value, null, 2)
    navigator.clipboard?.writeText(json)
    alert('Configuration JSON copied!')
  } catch (e) {
    alert('Failed to copy JSON.')
  }
}

/**
 * Trigger download of the current SVG view
 */
function onDownload() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.downloadSvg()
}

onMounted(() => {
  
console.log(canvasRef.value);

})
</script>

<template>
  <div class="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700">
    <Navbar />
    <main class="flex flex-1 p-4 gap-4 overflow-hidden">
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
      <ReactorCanvas
        ref="canvasRef"
        :config="config"
        :tubes="tubes"
        @copyJson="onCopyJson"
        @download="onDownload"
      />
    </main>
  </div>
</template>
