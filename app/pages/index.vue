<template>
  <UDashboardPanel id="index">
    <template #header>
      <UDashboardNavbar title="Tubesheets">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid>
        <TubeSheet v-model="newSheet" add-new />
        <TubeSheet
          v-for="(sheet, i) in list"
          :key="sheet._id"
          v-model="list[i]!"
        />
      </UPageGrid>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useTubeSheets } from '~/stores/tubesheets'
import type { TubeSheet } from '~/types'

const { getAllSheet } = useTubeSheets()
const list = ref<Partial<TubeSheet>[]>([])
onMounted(async () => {
  const data = await getAllSheet()
  list.value = data ?? []
})
const newSheet = reactive<Partial<TubeSheet>>({
  name: '',
  type: 'REACTOR',
  siteName: ''

})
</script>
