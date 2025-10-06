import { ref } from 'vue'

export function useViewportTransform() {
  const scale = ref(1)
  const tx = ref(0)
  const ty = ref(0)

  function zoom(factor: number) {
    scale.value *= factor
  }
  function pan(dx: number, dy: number) {
    tx.value += dx
    ty.value += dy
  }
  function reset() {
    scale.value = 1
    tx.value = 0
    ty.value = 0
  }
  return { scale, tx, ty, zoom, pan, reset }
}
