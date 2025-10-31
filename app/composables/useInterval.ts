// composables/useInterval.ts
import { onMounted, onUnmounted, ref } from 'vue'

export function useInterval(callback: () => void, delay: number) {
  const intervalId = ref<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    if (!intervalId.value) {
      intervalId.value = setInterval(callback, delay)
    }
  }

  const stop = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  onMounted(() => {
    start()
  })

  onUnmounted(() => {
    stop()
  })

  return { start, stop }
}
