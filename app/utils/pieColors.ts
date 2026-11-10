/** Base palette used when the reactor has few enough slices to fit it. */
export const PIE_COLORS = [
  '#3B82F6',
  '#10B981',
  '#EC4899',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4'
]

/**
 * Colour for a pie slice (0-based). Every slice of a reactor gets its own
 * colour: the base palette when it fits, otherwise evenly spaced hues so no
 * two slices (including the first and last, which are adjacent) ever match.
 */
export function getPieColor(sliceIdx: number, totalSlices?: number | null): string {
  if (!Number.isInteger(sliceIdx) || sliceIdx < 0) return '#fff'
  const n = Math.max(totalSlices || 0, sliceIdx + 1)
  if (n <= PIE_COLORS.length) return PIE_COLORS[sliceIdx]!
  const hue = Math.round((sliceIdx * 360) / n)
  return `hsl(${hue}, 70%, 50%)`
}
