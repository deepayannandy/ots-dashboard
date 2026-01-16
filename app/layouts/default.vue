<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useTubeSheets } from '@/stores/tubesheets'

const route = useRoute()
const open = ref(false)
const collapsed = ref(false)

const tubeSheetsStore = useTubeSheets()

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
  if (newValue) (collapsed.value = true)
  else {
    collapsed.value = false
  }
})
const companyLogo = ref('/ots.jpeg')

onMounted(() => {
  const storedLogo = localStorage.getItem('companyLogo')
  if (storedLogo) {
    companyLogo.value = storedLogo
  }
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
      label: 'Ruleboard',
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

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links.flat()
  },
  {
    id: 'code',
    label: 'Code',
    items: [
      {
        id: 'source',
        label: 'View page source',
        icon: 'i-simple-icons-github',
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${
          route.path === '/' ? '/index' : route.path
        }.vue`,
        target: '_blank'
      }
    ]
  }
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      v-if="!useRoute().path.startsWith('/survey-details')"
      id="default"
      v-model:open="open"
      v-model:collapsed="collapsed"
      collapsible
      resizable
      :collapsed-size="4"
      class="gradient-card elevation-3 border-r border-neutral-200/60 dark:border-neutral-800/40"
      :ui="{ footer: 'lg:border-t lg:border-neutral-200/60 dark:lg:border-neutral-800/40' }"
    >
      <template #header>
        <img :src="companyLogo" class="size-12 rounded-lg elevation-1" :class="collapsed&&'size-8!'">
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

    <UDashboardSearch :groups="groups" />

    <slot />

    <!-- <NotificationsSlideover /> -->
  </UDashboardGroup>
</template>
