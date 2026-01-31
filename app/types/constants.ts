import type { PageSize } from './index.d'

export const PAGE_SIZES: Record<PageSize, { w: number, h: number }> = {
  A4: { w: 794, h: 1123 },
  A5: { w: 559, h: 794 }
}

export const DEFAULT_PADDING = 40

// Survey polling interval in milliseconds (5 seconds)
export const SURVEY_POLLING_INTERVAL = 5000
