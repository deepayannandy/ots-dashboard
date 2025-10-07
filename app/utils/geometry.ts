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
    if (cfg.outerDimension - pad - r <= 0)
      throw new Error('Not enough radial space (outer - pad - r <= 0)')
  }
  if (cfg.shape === 'doughnut') {
    if ((cfg.innerRadius ?? 0) < 0)
      throw new Error('Inner radius must be >= 0')
    if ((cfg.innerRadius ?? 0) + pad + r >= cfg.outerDimension - pad - r)
      throw new Error('No annulus available for centers')
  }
  if (cfg.shape === 'square') {
    if (!(cfg.outerDimension > 0)) throw new Error('Side must be > 0')
    if (cfg.outerDimension / 2 - pad - r <= 0)
      throw new Error('Not enough room in square')
  }
  if (cfg.shape === 'rectangle') {
    if (!cfg.width || !cfg.height)
      throw new Error('Rectangle width and height required')
    if (
      cfg.width / 2 - pad - r <= 0 ||
      cfg.height / 2 - pad - r <= 0
    )
      throw new Error('Not enough room in rectangle')
  }
  if (cfg.shape === 'hexagon') {
    const apothem = cfg.outerDimension * Math.cos(Math.PI / 6)
    if (apothem - pad - r <= 0)
      throw new Error('Not enough room in hexagon (apothem too small)')
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
    return Math.hypot(x, y) <= cfg.outerDimension - pad - r + eps
  }
  if (shape === 'doughnut') {
    const d = Math.hypot(x, y)
    return (
      d >= (cfg.innerRadius ?? 0) + pad + r - eps &&
      d <= cfg.outerDimension - pad - r + eps
    )
  }
  if (shape === 'square') {
    return (
      Math.abs(x) <= cfg.outerDimension / 2 - pad - r + eps &&
      Math.abs(y) <= cfg.outerDimension / 2 - pad - r + eps
    )
  }
  if (shape === 'rectangle') {
    return (
      Math.abs(x) <= cfg.width! / 2 - pad - r + eps &&
      Math.abs(y) <= cfg.height! / 2 - pad - r + eps
    )
  }
  if (shape === 'hexagon') {
    const apothem = cfg.outerDimension * Math.cos(Math.PI / 6)
    const s = apothem - pad - r
    if (s <= 0) return false
    const qx = Math.abs(x)
    const qy = Math.abs(y)
    return (
      qx <= s + eps &&
      qy <= (Math.sqrt(3) * s) / 2 + eps &&
      Math.sqrt(3) * qx + qy <= Math.sqrt(3) * s + eps
    )
  }
  return false
}

/**
 * Generate tubes (centers) using lattice sampling. Returns Tube[] with ids and positions in model units.
 */
export function generateTubes(cfg: ReactorConfig): Tube[] {
  validateConfig(cfg)

  const tubes: Tube[] = []
  const r = cfg.tubeRadius
  const spacing = cfg.pitch * (2 * r) // center-to-center spacing
  const vspace = cfg.lattice === 'triangular' ? spacing * Math.sqrt(3) / 2 : spacing

  // angle (deg) -> radians for rotation
  const deg = cfg.angle ?? (cfg.lattice === 'triangular' ? 60 : 90)
  const theta = (deg * Math.PI) / 180
  const cosA = Math.cos(theta)
  const sinA = Math.sin(theta)

  // compute search extent (cover bounding box sufficiently)
  let searchExtent = cfg.outerDimension
  if (cfg.shape === 'rectangle') searchExtent = Math.max(cfg.width!, cfg.height!) / 2
  if (cfg.shape === 'doughnut') searchExtent = cfg.outerDimension
  const N = Math.ceil((searchExtent * 2) / spacing) + 4

  // Generate base grid (ORIGINAL orientation)
  // y steps = i * vspace, offset = spacing/2 for triangular rows
  let row = 1
  for (let i = -N; i <= N; i++) {
    const y = i * vspace
    const offset = cfg.lattice === 'triangular' && (i % 2 !== 0) ? spacing / 2 : 0
    let col = 1
    let placedInRow = 0

    // iterate columns **reversed** so first placed becomes left-most visually
    for (let j = N; j >= -N; j--) {
      const x = j * spacing + offset

      // rotate candidate (x,y) by chosen angle
      const xr = x * cosA - y * sinA
      const yr = x * sinA + y * cosA

      // keep only those inside the shape (pointInShape handles padding/radius)
      if (pointInShape(cfg.shape, xr, yr, cfg)) {
        tubes.push({
          id: `R${row}C${col}`,
          x: xr,
          y: yr,
          r,
          capped: false,
          capColor: null,
          blocked: false,
          deleted: false,
        })
        col++
        placedInRow++
      }
    }

    if (placedInRow > 0) row++
  }

  // Center the whole pattern (so it's visually centered in the shape)
  if (tubes.length > 0) {
    const avgX = tubes.reduce((s, t) => s + t.x, 0) / tubes.length
    const avgY = tubes.reduce((s, t) => s + t.y, 0) / tubes.length
    tubes.forEach((t) => {
      t.x -= avgX
      t.y -= avgY
    })
  }

  // Sort top->bottom (y) then left->right (x) so IDs are consistent
  tubes.sort((a, b) => {
    // small rounding to stabilize near-equal y values
    const ay = Math.round(a.y * 1e6) / 1e6
    const by = Math.round(b.y * 1e6) / 1e6
    if (ay !== by) return ay - by
    return a.x - b.x
  })

  // Reassign IDs using a row grouping tolerance to prevent tiny floating diffs from splitting rows
  let currentRow = 1
  let currentCol = 1
  let lastY: number | null = null
  const rowThreshold = spacing * 0.3 // experimentally robust grouping tolerance

  for (const t of tubes) {
    if (lastY !== null && Math.abs(t.y - lastY) > rowThreshold) {
      currentRow++
      currentCol = 1
    }
    t.id = `R${currentRow}C${currentCol}`
    lastY = t.y
    currentCol++
  }

  return tubes
}

