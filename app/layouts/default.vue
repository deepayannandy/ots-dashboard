<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const open = ref(false)

const links = [
  [
    {
      label: 'Tubesheets',
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
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <img src="/ots.jpeg" class="size-12" :class="collapsed&&'!size-8'">
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          v-if="!useRoute().path.startsWith('/create-reactor')"
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
        <TubesheetConfigPannel v-else :collapsed="collapsed" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <!-- <NotificationsSlideover /> -->
  </UDashboardGroup>
</template>
