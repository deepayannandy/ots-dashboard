import type { Tube, ReactorConfig } from '@/types'

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}

export function ensureLayers(vp: SVGGElement, tooltipEl: SVGTextElement | null = null) {
  let boundary = vp.querySelector('#boundary-layer') as SVGGElement | null
  let highlights = vp.querySelector('#highlight-layer') as SVGGElement | null
  let tubes = vp.querySelector('#tubes-layer') as SVGGElement | null
  let labels = vp.querySelector('#labels-layer') as SVGGElement | null
  const create = (id: string) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('id', id)
    return g as SVGGElement
  }
  let appended = false
  if (!boundary) {
    boundary = create('boundary-layer')
    vp.appendChild(boundary)
    appended = true
  }
  if (!highlights) {
    highlights = create('highlight-layer')
    vp.appendChild(highlights)
    appended = true
  }
  if (!tubes) {
    tubes = create('tubes-layer')
    vp.appendChild(tubes)
    appended = true
  }
  if (!labels) {
    labels = create('labels-layer')
    vp.appendChild(labels)
    appended = true
  }
  // Ensure a single virtualized tooltip element exists
  let tip = labels.querySelector('#tooltip') as SVGTextElement | null
  if (!tip) {
    tip = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'text'
    ) as SVGTextElement
    tip.setAttribute('id', 'tooltip')
    tip.setAttribute('fill', '#334155')
    tip.setAttribute('font-size', '12')
    tip.setAttribute('visibility', 'hidden')
    labels.appendChild(tip)
  }
  tooltipEl = tip
  // Ensure correct ordering if newly appended
  if (appended) {
    // boundary -> highlights -> tubes -> labels
    const order = [
      'boundary-layer',
      'highlight-layer',
      'tubes-layer',
      'labels-layer'
    ]
    const children = Array.from(vp.children) as SVGGElement[]
    children.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    children.forEach(c => vp.appendChild(c))
  }
  return {
    boundary: boundary!,
    highlights: highlights!,
    tubes: tubes!,
    labels: labels!,
    tooltipEl: tooltipEl
  }
}

/**
 * Groups tubes into horizontal rows based on Y position and pitch tolerance
 */
export function groupRowsFrom(tubes: Tube[], pitch: number): Tube[][] {
  if (!tubes.length) return []
  const sorted = [...tubes].sort((a, b) => a.y - b.y || a.x - b.x)
  const grouped: Tube[][] = []
  let current: Tube[] = []
  let lastY = sorted[0].y
  const tolerance = pitch * 0.2 || 1e-3

  for (const t of sorted) {
    if (Math.abs(t.y - lastY) > tolerance) {
      grouped.push(current)
      current = []
    }
    current.push(t)
    lastY = t.y
  }
  if (current.length) grouped.push(current)
  return grouped.map(r => r.sort((a, b) => a.x - b.x))
}

/**
 * Adds a new row relative to an existing one (top or bottom)
 * offsetSign = -1 means above, +1 means below
 */
export function computeAddRowForIndex(
  rows: Tube[][],
  rowIdx: number,
  offsetSign: 1 | -1,
  vspace: number,
  lattice: ReactorConfig['lattice'],
  pitch: number,
  tubeRadius: number
): Tube[] {
  if (!rows || rows.length === 0) return []
  // clamp rowIdx to an existing index for safety
  const baseIdx = Math.max(0, Math.min(rowIdx, rows.length - 1))
  const base = rows[baseIdx]
  if (!base || base.length === 0) return []

  const yOffset = offsetSign * vspace
  const newY = base[0].y + yOffset

  const isTriangular = lattice === 'triangular'
  if (!isTriangular || !(pitch > 0)) {
    // rectangular / square style: same x positions as base
    return base.map(t => ({
      id: '',
      x: t.x,
      y: newY,
      r: tubeRadius,
      capped: false,
      capColor: null,
      blocked: false,
      deleted: false
    }))
  }

  // helper: detect whether a row is already half-offset (approx)
  const rowHasHalfOffset = (row: Tube[]) => {
    if (!row || row.length < 2) {
      // fallback: inspect x of single element vs nearest integer multiple of pitch
      const rem = ((row[0].x / pitch) % 1 + 1) % 1
      return rem > 0.25 && rem < 0.75
    }
    // compute average x and check remainder modulo pitch
    const avgX = row.reduce((s, t) => s + t.x, 0) / row.length
    const rem = ((avgX / pitch) % 1 + 1) % 1
    return rem > 0.25 && rem < 0.75
  }

  // base row offset state
  const baseOffset = rowHasHalfOffset(base)

  // Determine new row offset by flipping base's offset.
  // If there is an adjacent neighbor row (the row we are inserting relative to),
  // ensure alternation relative to that neighbor instead when possible.
  let neighbor: Tube[] | undefined
  const intendedIdx = baseIdx + (offsetSign === -1 ? -1 : 1)
  if (intendedIdx >= 0 && intendedIdx < rows.length) neighbor = rows[intendedIdx]

  let newOffsetFlag: boolean
  if (neighbor) {
    // If neighbor exists, prefer to be opposite of neighbor (guarantees alternation)
    const neighborOffset = rowHasHalfOffset(neighbor)
    newOffsetFlag = !neighborOffset
  } else {
    // else fallback to opposite of base
    newOffsetFlag = !baseOffset
  }

  const offsetX = newOffsetFlag ? pitch / 2 : 0

  return base.map(t => ({
    id: '',
    x: t.x + offsetX,
    y: newY,
    r: tubeRadius,
    capped: false,
    capColor: null,
    blocked: false,
    deleted: false
  }))
}

/**
 * Adjusts tube count for a specific row (adds or removes tubes symmetrically)
 */
export function computeSetRowCountUpdate(
  tubes: Tube[],
  rowIdx: number,
  targetCount: number,
  pitch: number,
  tubeRadius: number
): Tube[] {
  if (targetCount < 0) return tubes
  const grouped = groupRowsFrom(tubes, pitch)
  if (rowIdx < 0 || rowIdx >= grouped.length) return tubes

  const row = grouped[rowIdx]
  const current = row.length
  if (targetCount === current) return tubes

  let updated = [...tubes]

  if (targetCount > current) {
    const delta = targetCount - current
    const addRight = Math.ceil(delta / 2)
    const addLeft = Math.floor(delta / 2)
    const xs = row.map(t => t.x).sort((a, b) => a - b)
    const minX = xs[0] ?? 0
    const maxX = xs[xs.length - 1] ?? 0
    const y = row[0]?.y ?? 0
    const newTubes: Tube[] = []

    for (let i = 1; i <= addRight; i++) {
      newTubes.push({
        id: '',
        x: maxX + i * pitch,
        y,
        r: tubeRadius,
        capped: false,
        capColor: null,
        blocked: false,
        deleted: false
      })
    }
    for (let i = 1; i <= addLeft; i++) {
      newTubes.push({
        id: '',
        x: minX - i * pitch,
        y,
        r: tubeRadius,
        capped: false,
        capColor: null,
        blocked: false,
        deleted: false
      })
    }

    updated = [...updated, ...newTubes]
  } else {
    const removeDelta = current - targetCount
    const sortedRow = [...row].sort((a, b) => a.x - b.x)
    const leftToDelete = Math.floor(removeDelta / 2)
    const rightToDelete = Math.ceil(removeDelta / 2)
    const leftIds = sortedRow.slice(0, leftToDelete).map(t => t.id)
    const rightIds = sortedRow.slice(-rightToDelete).map(t => t.id)
    const idsToDelete = new Set([...leftIds, ...rightIds])
    updated = updated.map(t =>
      idsToDelete.has(t.id) ? { ...t, deleted: true } : t
    )
  }

  return updated
}
