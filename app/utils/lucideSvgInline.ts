import iconsJson from '@iconify-json/lucide/icons.json'

const icons = iconsJson.icons as Record<string, { body?: string } | undefined>

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Lucide icon names from `@iconify-json/lucide` (kebab-case), e.g. `"pen"`, `"arrow-big-down"`, `"message-circle"`.
 */
export function getLucideIconBody(iconName: string): string | null {
  return icons[iconName]?.body ?? null
}

function applyLucideColorOverrides(
  el: Element,
  stroke: string,
  fill?: string,
) {
  if (el.getAttribute('stroke') === 'currentColor') {
    el.setAttribute('stroke', stroke)
  }
  if (el.getAttribute('fill') === 'currentColor') {
    el.setAttribute('fill', fill ?? stroke)
  }
  el.querySelectorAll('*').forEach((child) => {
    if (child.getAttribute('stroke') === 'currentColor') {
      child.setAttribute('stroke', stroke)
    }
    if (child.getAttribute('fill') === 'currentColor') {
      child.setAttribute('fill', fill ?? stroke)
    }
  })
}

const SOLID_SHAPE_TAGS = new Set([
  'path',
  'circle',
  'rect',
  'ellipse',
  'polygon',
  'polyline',
])

/**
 * Lucide icons are stroke outlines (`fill="none"`). This fills closed shapes for a solid look.
 * Open strokes (`line`) stay stroked.
 */
function applySolidVariant(root: Element, color: string) {
  const nodes = [root, ...Array.from(root.querySelectorAll('*'))]
  for (const node of nodes) {
    const tag = node.tagName.toLowerCase()
    if (!SOLID_SHAPE_TAGS.has(tag)) continue
    if (node.getAttribute('fill') !== 'none') continue
    const stroke = node.getAttribute('stroke')
    if (!stroke || stroke === 'none') continue
    node.setAttribute('fill', color)
    node.setAttribute('stroke', 'none')
    node.removeAttribute('stroke-width')
    node.removeAttribute('stroke-linecap')
    node.removeAttribute('stroke-linejoin')
  }
}

/**
 * Append Lucide icon markup (24×24) into an SVG `<g>`. Intended for programmatic SVG (e.g. reactor overlays).
 * Icons use `stroke="currentColor"` in the source; pass `stroke` / `fill` to replace.
 *
 * @returns `true` if the icon was found and appended
 */
export function appendLucideIconToSvgGroup(
  group: SVGGElement,
  iconName: string,
  options: {
    stroke?: string
    fill?: string
    opacity?: string
    /** `solid` fills stroke-based paths (Lucide default is outline-only). */
    variant?: 'outline' | 'solid'
  } = {},
): boolean {
  const body = getLucideIconBody(iconName)
  if (!body) {
    if (import.meta.dev) {
      console.warn(`[lucideSvgInline] Unknown Lucide icon: "${iconName}"`)
    }
    return false
  }

  const doc = group.ownerDocument
  const wrapper = doc.createElementNS(SVG_NS, 'svg')
  wrapper.innerHTML = body

  const stroke = options.stroke ?? '#3b82f6'
  const variant = options.variant ?? 'outline'

  while (wrapper.firstChild) {
    const node = wrapper.firstChild
    wrapper.removeChild(node)
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const el = node as Element
    applyLucideColorOverrides(el, stroke, options.fill)
    if (variant === 'solid') {
      applySolidVariant(el, stroke)
    }
    if (options.opacity != null) {
      el.setAttribute('opacity', options.opacity)
    }
    group.appendChild(el)
  }

  return true
}
