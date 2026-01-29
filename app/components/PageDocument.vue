<template>
  <div
    ref="sourceRef"
    class="hidden"
  >
    <slot />
  </div>
  <!-- Hidden measurement container for header/footer -->
  <div
    ref="measureRef"
    class="fixed invisible pointer-events-none"
    style="top: -9999px; left: -9999px;"
    :style="getMeasureContainerStyle()"
  >
    <div
      ref="headerMeasureRef"
      class="header"
    >
      <slot
        name="header"
        :page="1"
        :total="1"
      />
    </div>
    <div
      ref="footerMeasureRef"
      class="footer"
    >
      <slot
        name="footer"
        :page="1"
        :total="1"
      />
    </div>
  </div>
  <div class="page-document space-y-6 print:space-y-0">
    <div
      v-for="(page, pageIndex) in pages"
      :key="pageIndex"
      class="page mx-auto flex flex-col border bg-white print:border-none print:shadow-none print:m-0"
      :style="getPageStyle(pageIndex)"
    >
      <div
        v-if="!page.noHeader"
        ref="headerRefs"
        class="header mb-4 shrink-0"
      >
        <slot
          name="header"
          :page="pageIndex + 1"
          :total="pages.length"
        />
      </div>
      <div class="content flex-1 overflow-hidden">
        <div
          v-for="(html, i) in page.content"
          :key="i"
          :class="{ 'h-full': page.fullPage }"
          v-html="html"
        />
      </div>
      <div
        v-if="!page.noFooter"
        ref="footerRefs"
        class="footer mt-4 shrink-0"
      >
        <slot
          name="footer"
          :page="pageIndex + 1"
          :total="pages.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import type {
  PaddingValue,
  PaddingBox,
  Page,
  PageDocumentProps
} from '~/types'
import { PAGE_SIZES, DEFAULT_PADDING } from '~/types/constants'

/* -------------------------------------------------- */
/* INTERNAL TYPES */
/* -------------------------------------------------- */

interface Block {
  type: 'node' | 'table' | 'pageBreak'
  html?: string
  el?: HTMLElement
  table?: HTMLTableElement
}

/* -------------------------------------------------- */
/* PROPS & EMITS */
/* -------------------------------------------------- */

const props = withDefaults(
  defineProps<PageDocumentProps>(),
  {
    size: 'A4',
    orientation: 'portrait',
    padding: DEFAULT_PADDING
  }
)

const emit = defineEmits<{
  paginated: [totalPages: number]
}>()

/* -------------------------------------------------- */
/* STATE */
/* -------------------------------------------------- */

const sourceRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)
const headerMeasureRef = ref<HTMLElement | null>(null)
const footerMeasureRef = ref<HTMLElement | null>(null)
const headerRefs = ref<HTMLElement[]>([])
const footerRefs = ref<HTMLElement[]>([])
const pages = ref<Page[]>([])
const measuredHeaderHeight = ref(0)
const measuredFooterHeight = ref(0)

/* -------------------------------------------------- */
/* COMPUTED */
/* -------------------------------------------------- */

const pageSize = computed(() => {
  const base = PAGE_SIZES[props.size]
  return props.orientation === 'portrait'
    ? base
    : { w: base.h, h: base.w }
})

/* -------------------------------------------------- */
/* PADDING UTILITIES */
/* -------------------------------------------------- */

function normalizePadding(value: PaddingValue): PaddingBox {
  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value }
  }
  return {
    top: value.top ?? DEFAULT_PADDING,
    right: value.right ?? DEFAULT_PADDING,
    bottom: value.bottom ?? DEFAULT_PADDING,
    left: value.left ?? DEFAULT_PADDING
  }
}

function getPagePadding(pageIndex: number): PaddingBox {
  const { padding } = props

  // Single value for all pages
  if (typeof padding === 'number' || isPartialPaddingBox(padding)) {
    return normalizePadding(padding)
  }

  // Object with page-specific values
  const pageNum = pageIndex + 1
  const pageValue = padding[pageNum]
  const defaultValue = padding.default ?? DEFAULT_PADDING

  return normalizePadding(pageValue ?? defaultValue)
}

function isPartialPaddingBox(value: unknown): value is Partial<PaddingBox> {
  if (typeof value !== 'object' || value === null) return false
  const keys = Object.keys(value)
  return keys.some(k => ['top', 'right', 'bottom', 'left'].includes(k))
}

function getDefaultPadding(): PaddingBox {
  const { padding } = props

  // Single value for all pages
  if (typeof padding === 'number' || isPartialPaddingBox(padding)) {
    return normalizePadding(padding)
  }

  // Object with page-specific values - use default
  const defaultValue = padding.default ?? DEFAULT_PADDING
  return normalizePadding(defaultValue)
}

function getPageStyle(pageIndex: number) {
  const { w, h } = pageSize.value
  const p = getPagePadding(pageIndex)

  return {
    width: `${w}px`,
    height: `${h}px`,
    paddingTop: `${p.top}px`,
    paddingRight: `${p.right}px`,
    paddingBottom: `${p.bottom}px`,
    paddingLeft: `${p.left}px`
  }
}

function getMeasureContainerStyle() {
  const { w } = pageSize.value
  const p = getDefaultPadding()

  return {
    width: `${w}px`,
    paddingLeft: `${p.left}px`,
    paddingRight: `${p.right}px`
  }
}

/* -------------------------------------------------- */
/* DATA ATTRIBUTE HELPERS */
/* -------------------------------------------------- */

const hasAttribute = (el: HTMLElement, attr: string) => el.hasAttribute(attr)
const isFullPage = (el: HTMLElement) => hasAttribute(el, 'data-full-page')
const isPageBreak = (el: HTMLElement) => hasAttribute(el, 'data-page-break') || el.classList.contains('page-break')
const shouldHideHeader = (el: HTMLElement) => hasAttribute(el, 'data-no-header')
const shouldHideFooter = (el: HTMLElement) => hasAttribute(el, 'data-no-footer')
const isNoBreak = (el: HTMLElement) => hasAttribute(el, 'data-no-break')

/* -------------------------------------------------- */
/* BLOCK EXTRACTION */
/* -------------------------------------------------- */

function shouldExtractChildren(el: HTMLElement, maxContentHeight?: number): boolean {
  // If element has data-no-break, check if it fits in one page
  if (isNoBreak(el)) {
    // If we have a max height to check against, measure the element
    if (maxContentHeight !== undefined) {
      // Clone and measure the element
      const clone = el.cloneNode(true) as HTMLElement
      const measureDiv = document.createElement('div')
      Object.assign(measureDiv.style, {
        position: 'absolute',
        visibility: 'hidden',
        width: el.offsetWidth ? `${el.offsetWidth}px` : '555px', // A4 width - padding
        overflow: 'hidden'
      })
      measureDiv.appendChild(clone)
      document.body.appendChild(measureDiv)
      const height = measureDiv.scrollHeight
      document.body.removeChild(measureDiv)

      // If it fits in one page, treat as atomic (don't extract children)
      if (height <= maxContentHeight) {
        return false
      }
      // If too large, we need to extract children so content can be split
      return true
    }
    // No height info available, default to keeping it atomic
    return false
  }

  // Extract children if element contains tables, break-inside-avoid elements, or page breaks
  return !!(
    el.querySelector('table')
    || el.querySelector('.break-inside-avoid')
    || el.querySelector('[data-page-break]')
    || el.querySelector('.page-break-marker')
  )
}

function extractBlocks(root: HTMLElement, maxContentHeight?: number): Block[] {
  const blocks: Block[] = []

  for (const child of Array.from(root.children) as HTMLElement[]) {
    // Detect page break markers first
    if (isPageBreak(child)) {
      blocks.push({ type: 'pageBreak', el: child })
      continue
    }

    if (child.tagName === 'TABLE') {
      blocks.push({ type: 'table', table: child as HTMLTableElement })
      continue
    }

    // Recursively extract if child contains tables, break-inside-avoid, or page breaks
    if (shouldExtractChildren(child, maxContentHeight)) {
      blocks.push(...extractBlocks(child, maxContentHeight))
      continue
    }

    blocks.push({ type: 'node', html: child.outerHTML, el: child })
  }

  return blocks
}

/* -------------------------------------------------- */
/* TABLE SPLITTING */
/* -------------------------------------------------- */

function splitTable(
  table: HTMLTableElement,
  container: HTMLElement,
  maxHeight: number
): string[][] {
  const result: string[][] = []
  const thead = table.querySelector('thead')?.outerHTML ?? ''
  const rows = Array.from(table.querySelectorAll('tbody tr'))

  if (rows.length === 0) return result

  // Create a separate measurement container for the table
  const measureContainer = document.createElement('div')
  Object.assign(measureContainer.style, {
    position: 'absolute',
    visibility: 'hidden',
    width: container.offsetWidth + 'px',
    overflow: 'hidden'
  })
  document.body.appendChild(measureContainer)

  const temp = document.createElement('table')
  temp.className = table.className
  measureContainer.appendChild(temp)

  const resetTable = () => {
    temp.innerHTML = `${thead}<tbody></tbody>`
  }

  const getTbody = () => temp.querySelector('tbody')!

  resetTable()

  for (const row of rows) {
    getTbody().appendChild(row.cloneNode(true))

    if (temp.offsetHeight > maxHeight) {
      getTbody().lastElementChild?.remove()
      if (getTbody().children.length > 0) {
        result.push([temp.outerHTML])
      }
      resetTable()
      getTbody().appendChild(row.cloneNode(true))
    }
  }

  if (getTbody().children.length > 0) {
    result.push([temp.outerHTML])
  }

  document.body.removeChild(measureContainer)
  return result
}

/**
 * Split a table considering remaining space on current page
 * First chunk uses remainingHeight, subsequent chunks use fullHeight
 */
function splitTableWithRemaining(
  table: HTMLTableElement,
  container: HTMLElement,
  remainingHeight: number,
  fullHeight: number
): string[][] {
  const result: string[][] = []
  const thead = table.querySelector('thead')?.outerHTML ?? ''
  const rows = Array.from(table.querySelectorAll('tbody tr'))

  if (rows.length === 0) return result

  // Create a separate measurement container for the table
  const measureContainer = document.createElement('div')
  Object.assign(measureContainer.style, {
    position: 'absolute',
    visibility: 'hidden',
    width: container.offsetWidth + 'px',
    overflow: 'hidden'
  })
  document.body.appendChild(measureContainer)

  const temp = document.createElement('table')
  temp.className = table.className
  measureContainer.appendChild(temp)

  const resetTable = () => {
    temp.innerHTML = `${thead}<tbody></tbody>`
  }

  const getTbody = () => temp.querySelector('tbody')!

  resetTable()

  let isFirstChunk = true
  const currentMaxHeight = () => isFirstChunk ? remainingHeight : fullHeight

  for (const row of rows) {
    getTbody().appendChild(row.cloneNode(true))

    if (temp.offsetHeight > currentMaxHeight()) {
      getTbody().lastElementChild?.remove()

      // Only push if we have rows
      if (getTbody().children.length > 0) {
        result.push([temp.outerHTML])
        isFirstChunk = false
      }

      resetTable()
      getTbody().appendChild(row.cloneNode(true))
    }
  }

  if (getTbody().children.length > 0) {
    result.push([temp.outerHTML])
  }

  document.body.removeChild(measureContainer)
  return result
}

/* -------------------------------------------------- */
/* MEASUREMENT HELPERS */
/* -------------------------------------------------- */

function createMeasurementPage(width: number, height: number, padding: PaddingBox) {
  const page = document.createElement('div')
  Object.assign(page.style, {
    width: `${width}px`,
    height: `${height}px`,
    paddingTop: `${padding.top}px`,
    paddingRight: `${padding.right}px`,
    paddingBottom: `${padding.bottom}px`,
    paddingLeft: `${padding.left}px`,
    boxSizing: 'border-box',
    position: 'absolute',
    visibility: 'hidden',
    overflow: 'hidden'
  })

  const content = document.createElement('div')

  page.append(content)
  document.body.appendChild(page)

  return { page, content }
}

function removeMeasurementPage(page: HTMLElement) {
  document.body.removeChild(page)
}

/* -------------------------------------------------- */
/* PAGINATION */
/* -------------------------------------------------- */

function measureHeaderFooter() {
  if (headerMeasureRef.value) {
    const rect = headerMeasureRef.value.getBoundingClientRect()
    measuredHeaderHeight.value = Math.ceil(rect.height)
  }
  if (footerMeasureRef.value) {
    const rect = footerMeasureRef.value.getBoundingClientRect()
    measuredFooterHeight.value = Math.ceil(rect.height)
  }
}

async function paginate() {
  if (!sourceRef.value) return

  pages.value = []
  await nextTick()

  // Measure actual header/footer heights from the hidden measurement container
  measureHeaderFooter()

  const { w, h } = pageSize.value

  // Use default padding for content pages measurement (not page-specific overrides)
  // This ensures consistent content height calculation for pagination
  const defaultPadding = getDefaultPadding()

  const { page, content } = createMeasurementPage(w, h, defaultPadding)

  // Use measured header/footer heights (including margins: mb-4 = 16px, mt-4 = 16px)
  const headerH = measuredHeaderHeight.value
  const footerH = measuredFooterHeight.value
  const headerMargin = headerH > 0 ? 16 : 0 // mb-4
  const footerMargin = footerH > 0 ? 16 : 0 // mt-4
  const contentHeight = h - defaultPadding.top - defaultPadding.bottom - headerH - footerH - headerMargin - footerMargin

  let current: Page = { content: [] }
  const blocks = extractBlocks(sourceRef.value, contentHeight)

  for (const block of blocks) {
    // Page break marker - just force a new page, don't add content
    if (block.type === 'pageBreak') {
      if (current.content.length) {
        pages.value.push(current)
        current = { content: [] }
        content.innerHTML = ''
      }
      continue
    }

    // Full page blocks
    if (block.type === 'node' && block.el && isFullPage(block.el)) {
      if (current.content.length) {
        pages.value.push(current)
        current = { content: [] }
      }

      pages.value.push({
        content: [block.html!],
        noHeader: shouldHideHeader(block.el),
        noFooter: shouldHideFooter(block.el),
        fullPage: true
      })

      content.innerHTML = ''
      continue
    }

    // Table blocks
    if (block.type === 'table' && block.table) {
      // First, check if the entire table fits in the remaining space
      const tableClone = block.table.cloneNode(true) as HTMLTableElement
      content.appendChild(tableClone)
      const tableHeight = content.scrollHeight

      if (tableHeight <= contentHeight) {
        // Table fits on current page
        current.content.push(block.table.outerHTML)
        // Keep the table in content for measuring remaining space
        continue
      }

      // Table doesn't fit - need to split it
      content.removeChild(tableClone)

      // Calculate remaining height on current page
      const currentUsedHeight = content.scrollHeight
      const remainingHeight = contentHeight - currentUsedHeight

      // If there's significant space left, try to fit some rows
      if (remainingHeight > 100) {
        const chunks = splitTableWithRemaining(block.table, content, remainingHeight, contentHeight)

        if (chunks.length === 0) {
          content.innerHTML = ''
          continue
        }

        const [first, ...rest] = chunks

        if (first) {
          current.content.push(...first)
        }

        for (const chunk of rest) {
          pages.value.push(current)
          current = { content: chunk }
        }
      } else {
        // Not enough remaining space, start table on new page
        if (current.content.length) {
          pages.value.push(current)
          current = { content: [] }
        }

        const chunks = splitTable(block.table, content, contentHeight)

        if (chunks.length > 0) {
          const [first, ...rest] = chunks

          if (first) {
            current.content.push(...first)
          }

          for (const chunk of rest) {
            pages.value.push(current)
            current = { content: chunk }
          }
        }
      }

      content.innerHTML = ''
      continue
    }

    // Normal blocks
    if (block.type === 'node' && block.html) {
      const temp = document.createElement('div')
      temp.innerHTML = block.html
      const el = temp.firstElementChild as HTMLElement

      content.appendChild(el)

      if (content.scrollHeight > contentHeight) {
        content.removeChild(el)
        pages.value.push(current)
        current = { content: [] }
        content.innerHTML = ''
        content.appendChild(el)
      }

      current.content.push(block.html)
    }
  }

  if (current.content.length) {
    pages.value.push(current)
  }

  removeMeasurementPage(page)
  emit('paginated', pages.value.length)
}

/* -------------------------------------------------- */
/* LIFECYCLE & WATCHERS */
/* -------------------------------------------------- */

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  await paginate()

  // Re-paginate on window resize
  resizeObserver = new ResizeObserver(() => paginate())
  if (sourceRef.value) {
    resizeObserver.observe(sourceRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// Re-paginate when props change
watch(
  () => [props.size, props.orientation, props.padding],
  () => paginate(),
  { deep: true }
)

/* -------------------------------------------------- */
/* EXPOSE */
/* -------------------------------------------------- */

defineExpose({
  repaginate: paginate,
  totalPages: computed(() => pages.value.length),
  pages
})
</script>

<style scoped>
@media print {
  .page-document {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .page-document .page {
    break-after: page;
    break-inside: avoid;
    page-break-after: always;
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    padding-left: 40px !important;
    padding-right: 40px !important;
    padding-top: 40px !important;
    padding-bottom: 40px !important;
  }

  .page-document .page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
}
</style>
