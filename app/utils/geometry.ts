import type { ReactorConfig, Tube } from '@/types'

/**
 * Validate config and throw with message if invalid
 */
function validateConfig(cfg: ReactorConfig) {
  const r = cfg.tubeRadius
  const pad = cfg.padding
  if (!(r > 0)) throw new Error('Tube radius must be > 0')
  if (pad < 0) throw new Error('Padding must be >= 0')
  if (cfg.shape === 'circle') {
    if (!(cfg.outerDimension > 0)) throw new Error('Outer radius must be > 0')
    if (cfg.outerDimension - pad - r <= 0) throw new Error('Not enough radial space (outer - pad - r <= 0)')
  }
  if (cfg.shape === 'doughnut') {
    if ((cfg.innerRadius ?? 0) < 0) throw new Error('Inner radius must be >= 0')
    if ((cfg.innerRadius ?? 0) + pad + r >= cfg.outerDimension - pad - r) throw new Error('No annulus available for centers')
  }
  if (cfg.shape === 'square') {
    if (!(cfg.outerDimension > 0)) throw new Error('Side must be > 0')
    if (cfg.outerDimension / 2 - pad - r <= 0) throw new Error('Not enough room in square')
  }
  if (cfg.shape === 'rectangle') {
    if (!cfg.width || !cfg.height) throw new Error('Rectangle width and height required')
    if (cfg.width / 2 - pad - r <= 0 || cfg.height / 2 - pad - r <= 0) throw new Error('Not enough room in rectangle')
  }
  if (cfg.shape === 'hexagon') {
    const apothem = cfg.outerDimension * Math.cos(Math.PI / 6)
    if (apothem - pad - r <= 0) throw new Error('Not enough room in hexagon (apothem too small)')
  }
}

/**
 * Point-in-shape: whether center (x,y) is valid for a tube center.
 * Coordinates assume center origin (0,0) in model units.
 */
function pointInShape(
  shape: string,
  x: number,
  y: number,
  cfg: ReactorConfig
): boolean {
  const eps = 1e-9
  const r = cfg.tubeRadius
  const pad = cfg.padding
  if (shape === 'circle') {
    return Math.hypot(x, y) <= (cfg.outerDimension - pad - r) + eps
  }
  if (shape === 'doughnut') {
    const d = Math.hypot(x, y)
    return d >= ((cfg.innerRadius ?? 0) + pad + r) - eps && d <= (cfg.outerDimension - pad - r) + eps
  }
  if (shape === 'square') {
    return Math.abs(x) <= (cfg.outerDimension / 2 - pad - r) + eps && Math.abs(y) <= (cfg.outerDimension / 2 - pad - r) + eps
  }
  if (shape === 'rectangle') {
    return Math.abs(x) <= (cfg.width! / 2 - pad - r) + eps && Math.abs(y) <= (cfg.height! / 2 - pad - r) + eps
  }
  if (shape === 'hexagon') {
    const apothem = cfg.outerDimension * Math.cos(Math.PI / 6)
    const s = apothem - pad - r
    if (s <= 0) return false
    const qx = Math.abs(x), qy = Math.abs(y)
    return qx <= s + eps && qy <= Math.sqrt(3) * s / 2 + eps && (Math.sqrt(3) * qx + qy) <= (Math.sqrt(3) * s + eps)
  }
  return false
}

/**
 * Generate tubes (centers) using lattice sampling. Returns Tube[] with ids and positions in model units.
 */
export function generateTubes(cfg: ReactorConfig): Tube[] {
  validateConfig(cfg)
  const tubes: Tube[] = []
  const spacing = cfg.pitch * (2 * cfg.tubeRadius)
  const vspace = cfg.lattice === 'triangular' ? spacing * Math.sqrt(3) / 2 : spacing

  // decide search bounds in model units
  let searchExtent = cfg.outerDimension
  if (cfg.shape === 'rectangle') searchExtent = Math.max(cfg.width!, cfg.height!) / 2
  if (cfg.shape === 'doughnut') searchExtent = cfg.outerDimension
  const N = Math.ceil((searchExtent * 2) / spacing) + 4

  let row = 1
  for (let i = -N; i <= N; i++) {
    const y = i * vspace
    const offset = cfg.lattice === 'triangular' && (i % 2 !== 0) ? spacing / 2 : 0
    let col = 1
    let placedInRow = 0
    for (let j = -N; j <= N; j++) {
      const x = j * spacing + offset
      if (pointInShape(cfg.shape, x, y, cfg)) {
        const id = `R${row}C${col}`
        tubes.push({ id, x, y, r: cfg.tubeRadius, capped: false, capColor: null, blocked: false, deleted: false })
        col++; placedInRow++
      }
    }
    if (placedInRow > 0) row++
  }
  return tubes
}
