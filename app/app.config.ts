export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc'
    },
    UInput: {
      root: 'w-full'
    },
    UModal: {
      overlay: 'bg-neutral-950/60 dark:bg-neutral-950/80 backdrop-blur-sm',
      content: 'elevation-4 gradient-card'
    },
    UDropdownMenu: {
      content: 'elevation-3 gradient-card'
    },
    UPopover: {
      content: 'elevation-3 gradient-card'
    },
    UTooltip: {
      content: 'elevation-2'
    },
    UPageCard: {
      root: 'border border-neutral-200/80 dark:border-neutral-700/50 elevation-2 gradient-card'
    },
    UTable: {
      root: 'elevation-1 rounded-lg overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60'
    },
    UButton: {
      base: 'transition-all duration-150'
    }
  }
})
