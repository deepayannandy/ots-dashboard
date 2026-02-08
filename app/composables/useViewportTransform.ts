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
    rotation.value = Math.max(-360, Math.min(360, rotation.value + degrees))
  }

  function setZoom(value: number) {
    scale.value = value
  }

  function setPan(x: number, y: number) {
    tx.value = x
    ty.value = y
  }

  function setRotation(value: number) {
    rotation.value = Math.max(-360, Math.min(360, value))
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
    // The goal is to scale the reactor content to fill as much of the container as possible
    const availableWidth = containerWidth - padding * 2
    const availableHeight = containerHeight - padding * 2

    // Calculate scale based on content dimensions
    // contentWidth/Height represent the actual reactor size in SVG units
    const scaleX = availableWidth / contentWidth
    const scaleY = availableHeight / contentHeight

    // Use the smaller scale to ensure content fits, but allow larger scaling
    // Cap at 3x to avoid excessive zoom, minimum 0.5 to keep it visible
    const fitScale = Math.min(scaleX, scaleY, 3)
    const newScale = Math.max(0.5, fitScale)
    scale.value = newScale

    // Center the content properly
    // The transform is: translate(tx, ty) scale(s) rotate(r, cx, cy)
    // After scaling around origin, point (svgCenter, svgCenter) moves to (svgCenter*s, svgCenter*s)
    // To keep the reactor centered in the viewBox, we need: tx = svgCenter * (1 - s)
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
