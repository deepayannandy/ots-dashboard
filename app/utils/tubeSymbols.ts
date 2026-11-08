import { appendLucideIconToSvgGroup } from './lucideSvgInline'

/** Lucide icon drawn over each special tube, keyed by tube property. */
export const tubeSymbols: Record<string, string> = {
  CATALYST_TC: 'thermometer',
  COOLANT: 'snowflake',
  SOLID: 'bolt',
  BEND: 'corner-down-right',
  SALT_TC: 'flame',
  BLOCKED: 'ban'
}

/** Builds the symbol sized to sit inside a hole, or `null` if the property has none. */
export function createTubeSymbol(
  property: string | null | undefined,
  cx: number,
  cy: number,
  r: number,
  stroke: string
): SVGGElement | null {
  const iconName = tubeSymbols[property ?? '']
  if (!iconName) return null

  const size = r * 1.6
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  group.setAttribute(
    'transform',
    `translate(${cx - size / 2}, ${cy - size / 2}) scale(${size / 24})`
  )
  appendLucideIconToSvgGroup(group, iconName, { stroke, strokeWidth: '2.5' })
  return group
}
