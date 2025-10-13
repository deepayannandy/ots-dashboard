import type { ReactorConfig } from '@/types'

/**
 * scale factor: converts model units -> pixels
 * centerX/centerY are pixel coordinates of reactor center in the SVG.
 */
export function drawBoundary(viewport: SVGGElement, cfg: ReactorConfig, centerX = 460, centerY = 380, scale = 3) {
  const create = (n: string) => document.createElementNS('http://www.w3.org/2000/svg', n)

  if (cfg.shape === 'circle' || cfg.shape === 'doughnut') {
    const outer = create('circle')
    outer.setAttribute('cx', String(centerX))
    outer.setAttribute('cy', String(centerY))
    outer.setAttribute('r', String(cfg.outerDimension * scale))
    outer.setAttribute('fill', cfg.shapeColor)
    outer.setAttribute('stroke', '#0f172a')
    outer.setAttribute('stroke-width', '1')
    viewport.appendChild(outer)

    const padLayer = create('circle')
    padLayer.setAttribute('cx', String(centerX))
    padLayer.setAttribute('cy', String(centerY))
    padLayer.setAttribute('r', String(Math.max(0, (cfg.outerDimension - cfg.padding)) * scale))
    padLayer.setAttribute('fill', cfg.paddingColor)
    viewport.appendChild(padLayer)

    if (cfg.shape === 'doughnut') {
      const inner = create('circle')
      inner.setAttribute('cx', String(centerX))
      inner.setAttribute('cy', String(centerY))
      inner.setAttribute('r', String(Math.max(0, (cfg.innerRadius ?? 0) + cfg.padding) * scale))
      inner.setAttribute('fill', 'white')
      viewport.appendChild(inner)
    }
  } else if (cfg.shape === 'square') {
    const size = cfg.outerDimension
    const outer = create('rect')
    outer.setAttribute('x', String(centerX - size * scale / 2))
    outer.setAttribute('y', String(centerY - size * scale / 2))
    outer.setAttribute('width', String(size * scale))
    outer.setAttribute('height', String(size * scale))
    outer.setAttribute('fill', cfg.shapeColor)
    outer.setAttribute('stroke', '#0f172a')
    viewport.appendChild(outer)

    const innerSide = Math.max(0, size - 2 * cfg.padding)
    const padRect = create('rect')
    padRect.setAttribute('x', String(centerX - innerSide * scale / 2))
    padRect.setAttribute('y', String(centerY - innerSide * scale / 2))
    padRect.setAttribute('width', String(innerSide * scale))
    padRect.setAttribute('height', String(innerSide * scale))
    padRect.setAttribute('fill', cfg.paddingColor)
    viewport.appendChild(padRect)
  } else if (cfg.shape === 'rectangle') {
    const outer = create('rect')
    outer.setAttribute('x', String(centerX - (cfg.width! * scale) / 2))
    outer.setAttribute('y', String(centerY - (cfg.height! * scale) / 2))
    outer.setAttribute('width', String(cfg.width! * scale))
    outer.setAttribute('height', String(cfg.height! * scale))
    outer.setAttribute('fill', cfg.shapeColor)
    outer.setAttribute('stroke', '#0f172a')
    viewport.appendChild(outer)

    const innerW = Math.max(0, cfg.width! - 2 * cfg.padding)
    const innerH = Math.max(0, cfg.height! - 2 * cfg.padding)
    const padRect = create('rect')
    padRect.setAttribute('x', String(centerX - innerW * scale / 2))
    padRect.setAttribute('y', String(centerY - innerH * scale / 2))
    padRect.setAttribute('width', String(innerW * scale))
    padRect.setAttribute('height', String(innerH * scale))
    padRect.setAttribute('fill', cfg.paddingColor)
    viewport.appendChild(padRect)
  } else if (cfg.shape === 'hexagon') {
    const ptsOuter: string[] = []
    const ptsInner: string[] = []
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 3 * i - Math.PI / 6
      ptsOuter.push(`${centerX + Math.cos(a) * cfg.outerDimension * scale},${centerY + Math.sin(a) * cfg.outerDimension * scale}`)
      ptsInner.push(`${centerX + Math.cos(a) * Math.max(0, cfg.outerDimension - cfg.padding) * scale},${centerY + Math.sin(a) * Math.max(0, cfg.outerDimension - cfg.padding) * scale}`)
    }
    const polyOuter = create('polygon')
    polyOuter.setAttribute('points', ptsOuter.join(' '))
    polyOuter.setAttribute('fill', cfg.shapeColor)
    polyOuter.setAttribute('stroke', '#0f172a')
    viewport.appendChild(polyOuter)
    const polyPad = create('polygon')
    polyPad.setAttribute('points', ptsInner.join(' '))
    polyPad.setAttribute('fill', cfg.paddingColor)
    viewport.appendChild(polyPad)
  }
}
