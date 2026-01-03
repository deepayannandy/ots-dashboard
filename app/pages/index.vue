<template>
  <UDashboardPanel id="index">
    <template #header>
      <UDashboardNavbar title="Projects">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid>
        <TubeSheet v-model="newSheet" add-new />
        <div v-for="(sheet, i) in list" :key="sheet._id">
          <TubeSheet
            v-model="list[i]!"
            @saved="(sheet) => { currentSheet = sheet.value; }"
            @update:open-config-camera="(val) => { currentSheet = val; CameraConfigModal = true; }"
          />
        </div>
      </UPageGrid>
      <CameraConfig v-model:open="CameraConfigModal" v-model="currentSheet" @update:open="val => CameraConfigModal = val" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useTubeSheets } from '~/stores/tubesheets'
import type { TubeSheet } from '~/types'
import { CalendarDate } from '@internationalized/date'

const CameraConfigModal = ref(false)
const { list, getAllSheet } = useTubeSheets()
await getAllSheet()
const newSheet = reactive<Partial<TubeSheet>>({
  date: new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
  clientName: '',
  projectStartDate: new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
})
const currentSheet = ref<Partial<TubeSheet>>({})
</script>
