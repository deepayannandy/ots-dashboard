import { ref } from 'vue'
import { generateTubes } from '@/utils/geometry'
import type { ReactorConfig, Tube } from '@/types'

export function useReactorGenerator() {
  const config = ref<ReactorConfig>({
    shape: 'circle',
    outerDimension: 100,
    width: 160,
    height: 100,
    innerRadius: 50,
    tubeRadius: 2,
    padding: 5,
    shapeColor: '#60a5fa',
    paddingColor: '#fde047',
    pitch: 1.25,
    lattice: 'triangular',
    angle:30
  })

  const tubes = ref<Tube[]>([])
  const error = ref<string | null>(null)



  function validateAndGenerate() {
    // validation lives in geometry too; generateTubes will throw if invalid
    try {
      const generated = generateTubes(config.value)
      tubes.value = generated.filter((t: Tube) => !t.deleted);
      error.value = null
    } catch (e: any) {
      tubes.value = []
      useToast().add({title:error.value ?? 'Error generating tubes',color:'error'})
    }
  }

  function setConfig(partial: Partial<ReactorConfig>) {
    config.value = { ...config.value, ...partial }
  }

  return { config, tubes, error, validateAndGenerate, setConfig }
}
