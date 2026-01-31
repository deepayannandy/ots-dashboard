import { ref } from 'vue'

interface ViewportOptions {
  scale?: number
  tx?: number
  ty?: number
  rotation?: number
}

export function useViewportTransform(defaults: ViewportOptions = { scale: 1, tx: 0, ty: 0, rotation: 0 }) {
  const scale = ref(defaults.scale ?? 1)
  const tx = ref(defaults.tx ?? 0)
  const ty = ref(defaults.ty ?? 0)
  const rotation = ref(defaults.rotation ?? 0)

  function zoom(factor: number) {
    scale.value *= factor
  }

  function pan(dx: number, dy: number) {
    tx.value += dx
    ty.value += dy
  }

  function rotate(degrees: number) {
    rotation.value += degrees
  }

  function setZoom(value: number) {
    scale.value = value
  }

  function setPan(x: number, y: number) {
    tx.value = x
    ty.value = y
  }

  function setRotation(value: number) {
    rotation.value = value
  }

  function reset() {
    scale.value = defaults.scale ?? 1
    tx.value = defaults.tx ?? 0
    ty.value = defaults.ty ?? 0
    rotation.value = defaults.rotation ?? 0
  }

  function resetWithoutRotation() {
    scale.value = defaults.scale ?? 1
    tx.value = defaults.tx ?? 0
    ty.value = defaults.ty ?? 0
    // Keep rotation unchanged
  }

  function fitToScreen(contentWidth: number, contentHeight: number, containerWidth: number, containerHeight: number, padding = 40, svgCenter = 600) {
    // Calculate scale to fit content within container with padding
    const availableWidth = containerWidth - padding * 2
    const availableHeight = containerHeight - padding * 2
    
    const scaleX = availableWidth / contentWidth
    const scaleY = availableHeight / contentHeight
    const fitScale = Math.min(scaleX, scaleY, 2) // Cap at 2x to avoid too much zoom
    
    // Set scale
    const newScale = Math.max(0.1, fitScale) // Minimum 0.1 scale
    scale.value = newScale
    
    // Center the content properly
    // Since scaling happens around origin (0,0), we need to offset to keep center at svgCenter
    // After scaling by s, point (svgCenter, svgCenter) becomes (svgCenter*s, svgCenter*s)
    // To bring it back to center, we need: tx = svgCenter * (1 - s)
    tx.value = svgCenter * (1 - newScale)
    ty.value = svgCenter * (1 - newScale)
    // Keep rotation unchanged
  }

  return {
    scale,
    tx,
    ty,
    rotation,
    zoom,
    pan,
    rotate,
    setZoom,
    setPan,
    setRotation,
    reset,
    resetWithoutRotation,
    fitToScreen
  }
}
