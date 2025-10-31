import { ref } from 'vue'

interface ViewportOptions {
  scale?: number
  tx?: number
  ty?: number
}

export function useViewportTransform(defaults: ViewportOptions = { scale: 1, tx: 0, ty: 0 }) {
  const scale = ref(defaults.scale ?? 1)
  const tx = ref(defaults.tx ?? 0)
  const ty = ref(defaults.ty ?? 0)

  function zoom(factor: number) {
    scale.value *= factor
  }

  function pan(dx: number, dy: number) {
    tx.value += dx
    ty.value += dy
  }

  function setZoom(value: number) {
    scale.value = value
  }

  function setPan(x: number, y: number) {
    tx.value = x
    ty.value = y
  }

  function reset() {
    scale.value = defaults.scale ?? 1
    tx.value = defaults.tx ?? 0
    ty.value = defaults.ty ?? 0
  }

  return {
    scale,
    tx,
    ty,
    zoom,
    pan,
    setZoom,
    setPan,
    reset
  }
}
