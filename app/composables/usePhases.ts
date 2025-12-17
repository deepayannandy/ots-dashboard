import { ref } from 'vue'

const phases = ref([])
let fetched = false

export const usePhases = () => {
  if (!fetched) {
    fetched = true
    ;(async () => {
      try {
        const { data } = await useAxios().$get('/api/v2/phase/getAllPhases')
        phases.value = data
      } catch (e) {
        console.error(e)
      }
    })()
  }
  return phases
}
