import type { ReactorConfig, Tube } from '@/types'

function validateConfig(cfg: ReactorConfig) {
  const r = cfg.tubeRadius
  const pad = cfg.padding

  if (!(r > 0)) throw new Error('Tube radius must be > 0')
  if (pad < 0) throw new Error('Padding must be >= 0')

  const minPitch = 2 * r
  if (cfg.pitch < minPitch) {
    throw new Error(
      `Pitch too small — must be ≥ ${minPitch.toFixed(2)} to avoid overlap`
    )
  }

  if (cfg.shape === 'CIRCLE') {
    if (!(cfg.outerDimension > 0)) throw new Error('Outer radius must be > 0')
    if (cfg.outerDimension - pad - r <= 0)
      throw new Error('Not enough radial space (outer - pad - r <= 0)')
  }

  if (cfg.shape === 'DONUT') {
    if ((cfg.innerRadius ?? 0) < 0)
      throw new Error('Inner radius must be >= 0')
    if ((cfg.innerRadius ?? 0) + pad + r >= cfg.outerDimension - pad - r)
      throw new Error('No annulus available for centers')
  }

  if (cfg.shape === 'RECTANGLE') {
    if (!(cfg.outerDimension > 0)) throw new Error('Side must be > 0')
    if (cfg.outerDimension / 2 - pad - r <= 0)
      throw new Error('Not enough room in RECTANGLE')
  }

  if (cfg.shape === 'RECTANGLE') {
    if (!cfg.width || !cfg.height)
      throw new Error('RECTANGLE width and height required')
    if (cfg.width / 2 - pad - r <= 0 || cfg.height / 2 - pad - r <= 0)
      throw new Error('Not enough room in RECTANGLE')
  }

  if (cfg.shape === 'HEXAGONE') {
    const apothem = cfg.outerDimension * Math.cos(Math.PI / 6)
    if (apothem - pad - r <= 0)
      throw new Error('Not enough room in HEXAGONE (apothem too small)')
  }
}

function pointInShape(
  shape: string,
  x: number,
  y: number,
  cfg: ReactorConfig
): boolean {
  const eps = 1e-9
  const r = cfg.tubeRadius
  const pad = cfg.padding
  if (shape === 'CIRCLE') {
    return Math.hypot(x, y) <= cfg.outerDimension - pad - r + eps
  }
  if (shape === 'DONUT') {
    const d = Math.hypot(x, y)
    return (
      d >= (cfg.innerRadius ?? 0) + pad + r - eps
      && d <= cfg.outerDimension - pad - r + eps
    )
  }
  if (shape === 'RECTANGLE') {
    return (
      Math.abs(x) <= cfg.outerDimension / 2 - pad - r + eps
      && Math.abs(y) <= cfg.outerDimension / 2 - pad - r + eps
    )
  }
  if (shape === 'RECTANGLE') {
    return (
      Math.abs(x) <= cfg.width! / 2 - pad - r + eps
      && Math.abs(y) <= cfg.height! / 2 - pad - r + eps
    )
  }
  if (shape === 'HEXAGONE') {
    const apothem = cfg.outerDimension * Math.cos(Math.PI / 6)
    const s = apothem - pad - r
    if (s <= 0) return false
    const qx = Math.abs(x)
    const qy = Math.abs(y)
    return (
      qx <= s + eps
      && qy <= (Math.sqrt(3) * s) / 2 + eps
      && Math.sqrt(3) * qx + qy <= Math.sqrt(3) * s + eps
    )
  }
  return false
}

export function generateTubes(cfg: ReactorConfig): {
  tubes: Tube[]
  rowCounts: number[]
} {
  validateConfig(cfg)

  const tubes: Tube[] = []
  const r = cfg.tubeRadius
  const spacing = cfg.pitch
  const vspace
    = cfg.lattice === 'triangular' ? (spacing * Math.sqrt(3)) / 2 : spacing

  const deg = cfg.angle ?? (cfg.lattice === 'triangular' ? 60 : 90)
  const theta = (deg * Math.PI) / 180
  const cosA = Math.cos(theta)
  const sinA = Math.sin(theta)

  let searchExtent = cfg.outerDimension
  if (cfg.shape === 'RECTANGLE')
    searchExtent = Math.max(cfg.width!, cfg.height!) / 2
  if (cfg.shape === 'DONUT') searchExtent = cfg.outerDimension
  const N = Math.ceil((searchExtent * 2) / spacing) + 4

  for (let i = -N; i <= N; i++) {
    const y = i * vspace
    const offset
      = cfg.lattice === 'triangular' && i % 2 !== 0 ? spacing / 2 : 0

    for (let j = N; j >= -N; j--) {
      const x = j * spacing + offset

      const xr = x * cosA - y * sinA
      const yr = x * sinA + y * cosA

      if (pointInShape(cfg.shape, xr, yr, cfg)) {
        tubes.push({
          id: '',
          x: xr,
          y: yr,
          r,
          capped: false,
          capColor: null,
          blocked: false,
          deleted: false,
          property: null,
          propertyColor: null,
          comment: null
        })
      }
    }
  }

  if (tubes.length > 0) {
    const avgX = tubes.reduce((s, t) => s + t.x, 0) / tubes.length
    const avgY = tubes.reduce((s, t) => s + t.y, 0) / tubes.length
    tubes.forEach((t) => {
      t.x -= avgX
      t.y -= avgY
    })
  }

  tubes.sort((a, b) => {
    const ay = Math.round(a.y * 1e6) / 1e6
    const by = Math.round(b.y * 1e6) / 1e6
    if (ay !== by) return ay - by
    return a.x - b.x
  })

  let currentRow = 1
  let currentCol = 1
  let lastY: number | null = null
  const rowThreshold = spacing * 0.3

  for (const t of tubes) {
    if (lastY !== null && Math.abs(t.y - lastY) > rowThreshold) {
      currentRow++
      currentCol = 1
    }
    t.id = `R${currentRow}C${currentCol}`
    lastY = t.y
    currentCol++
  }

  const rowCounts: number[] = []
  let lastRowY: number | null = null
  let count = 0

  for (const t of tubes) {
    if (lastRowY === null || Math.abs(t.y - lastRowY) > rowThreshold) {
      if (count > 0) rowCounts.push(count)
      count = 1
      lastRowY = t.y
    } else {
      count++
    }
  }
  if (count > 0) rowCounts.push(count)

  return { tubes, rowCounts }
}
