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
    reset
  }
}
