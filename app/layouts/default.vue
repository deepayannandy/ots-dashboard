<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useTubeSheets } from '@/stores/tubesheets'
import { useCompany } from '@/stores/company'

const route = useRoute()
const open = ref(false)
const collapsed = ref(false)

const tubeSheetsStore = useTubeSheets()
const companyStore = useCompany()

const companyLogo = computed(() => companyStore.logoUrl)

// Get sheetId from route params when on create-reactor page
const sheetId = computed(() => {
  const params = route.params as { sheetId?: string }
  return params.sheetId
})

// Check if tubesheet status is REACTOR_CREATED
const isReactorCreated = computed(() => {
  if (!sheetId.value) return false
  const sheet = tubeSheetsStore.list.find(s => s._id === sheetId.value)
  return sheet?.status === 'REACTOR_CREATED'
})

watch(isReactorCreated, (newValue) => {
  if (newValue) collapsed.value = true
  else {
    collapsed.value = false
  }
})

onMounted(async () => {
  await companyStore.fetchCompanyDetails()
})

const links = [
  [
    {
      label: 'Projects',
      icon: 'i-lucide-layers-2',
      to: '/',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Rule Board',
      icon: 'i-lucide-orbit',
      to: '/ruleboard',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Assets',
      icon: 'i-lucide-package',
      to: '/assets',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Survey History',
      icon: 'i-lucide-clock-3',
      to: '/survey-history',
      onSelect: () => {
        open.value = false
      }
    }
  ]
] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      v-model:collapsed="collapsed"
      collapsible
      resizable
      :collapsed-size="4"
      class="gradient-card elevation-3 border-r border-neutral-200/60 dark:border-neutral-800/40"
      :ui="{
        footer:
          'lg:border-t lg:border-neutral-200/60 dark:lg:border-neutral-800/40'
      }"
    >
      <template #header>
        <img
          :src="companyLogo"
          class="size-12 rounded-lg elevation-1 cursor-pointer"
          :class="collapsed && 'size-8!'"
          @click="useRouter().push('/')"
        >
      </template>

      <template #default>
        <UNavigationMenu
          v-if="!useRoute().path.startsWith('/create-reactor')"
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
        <TubesheetConfigPannel
          v-else
          :collapsed="collapsed"
          :disabled="isReactorCreated"
        />
      </template>

      <template #footer>
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />

    <!-- <NotificationsSlideover /> -->
  </UDashboardGroup>
</template>
