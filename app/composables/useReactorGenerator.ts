import { ref } from 'vue'
import { generateTubes } from '@/utils/geometry'
import { groupRowsFrom } from '@/utils' // adjust path if needed
import type { ReactorConfig, Tube } from '@/types'

const config = ref<ReactorConfig>({
  shape: 'CIRCLE',
  outerDimension: 100,
  width: 160,
  height: 100,
  innerRadius: 50,
  tubeRadius: 5,
  padding: 5,
  shapeColor: '#d3d3d3',
  paddingColor: '#a9a9a9',
  pitch: 15,
  lattice: 'triangular',
  angle: 60
})

const tubes = ref<Tube[]>([])
const error = ref<string | null>(null)
const rowCount = ref<number[]>([])

function validateAndGenerate() {
  try {
    const { tubes: generated, rowCounts } = generateTubes(config.value)
    tubes.value = generated.filter((t: Tube) => !t.deleted)
    rowCount.value = rowCounts
    error.value = null
  } catch (e: unknown) {
    tubes.value = []
    const message = e instanceof Error ? e.message : String(e) || 'Error generating tubes'
    error.value = message
    useToast().add({
      title: error.value || '',
      color: 'error'
    })
  }
}

function setConfig(partial: Partial<ReactorConfig>) {
  config.value = { ...config.value, ...partial }
}

/* ---------- handleUpdateTubes (now uses groupRowsFrom consistently) ---------- */
function handleUpdateTubes(updated: Tube[]) {
  const active = updated.filter(t => !t.deleted)
  if (active.length === 0) {
    tubes.value = []
    return
  }

  // Use the shared grouping function for deterministic grouping
  const grouped = groupRowsFrom(active, config.value.pitch ?? 0)

  const reassigned: Tube[] = []
  grouped.forEach((row, i) => {
    const sortedRow = row.slice().sort((a, b) => a.x - b.x)
    sortedRow.forEach((tube, j) => {
      reassigned.push({ ...tube, id: `R${i + 1}C${j + 1}` })
    })
  })

  tubes.value = reassigned

  // update rowCount if you keep it synced here
  rowCount.value = grouped.map(r => r.length)

  // NOTE: avoid automatically changing config outerDimension / width / height
  // unless explicit. If you still want to grow outerDimension, do it conservatively:
  const xs = reassigned.map(t => t.x)
  const ys = reassigned.map(t => t.y)
  const pad = config.value.padding ?? 0
  const tubeR = config.value.tubeRadius ?? 0

  if (['CIRCLE', 'HEXAGONE', 'DONUT'].includes(config.value.shape)) {
    const maxTubeEdgeRadius = reassigned.reduce((m, t) => Math.max(m, Math.hypot(t.x, t.y) + tubeR), 0)
    const nextOuter = maxTubeEdgeRadius + pad
    // Grow only if it exceeds current by a meaningful amount (avoid micro changes)
    if ((config.value.outerDimension ?? 0) + (config.value.pitch ?? 0) * 0.05 < nextOuter) {
      config.value.outerDimension = nextOuter
    }
  } else if (config.value.shape === 'RECTANGLE') {
    const extentX = xs.reduce((m, x) => Math.max(m, Math.abs(x)), 0)
    const extentY = ys.reduce((m, y) => Math.max(m, Math.abs(y)), 0)
    const halfW = extentX + pad + tubeR
    const halfH = extentY + pad + tubeR
    config.value.width = Math.max((config.value.width ?? 0), halfW * 2)
    config.value.height = Math.max((config.value.height ?? 0), halfH * 2)
  }
}

export function useReactorGenerator() {
  return {
    config,
    tubes,
    error,
    validateAndGenerate,
    setConfig,
    rowCount,
    handleUpdateTubes
  }
}
