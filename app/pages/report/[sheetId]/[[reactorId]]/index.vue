<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
      <p class="text-gray-600">
        Loading report data...
      </p>
    </div>
  </div>

  <div v-else-if="error" class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center text-red-600">
      <p class="text-xl font-bold mb-2">
        Error
      </p>
      <p>{{ error }}</p>
    </div>
  </div>

  <div v-else class="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white">
    <div class="container mx-auto px-4 print:px-0">
      <!-- Print Controls (hidden in print) -->
      <div class="mb-4 flex gap-4 print:hidden">
        <button
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          @click="handlePrint"
        >
          Print / Save as PDF
        </button>
        <button
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          @click="goBack"
        >
          Go Back
        </button>
      </div>

      <!-- Report Component -->
      <SurveyReport
        ref="reportRef"
        :tube-sheet-details="tubeSheetDetails"
        :survey-data="surveyData"
        :reactor-data="reactorData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Tube, ReactorConfig } from '@/types'

definePageMeta({
  layout: false
})

interface SurveyDataItem {
  tubeId: number
  tubeIdAsperLayout: string
  activity: string
  color: string
  timeStamp: string
  isDetected: boolean
  isDuplicate?: boolean
  face?: string
  _id: string
}

interface CommentItem {
  tubeIdAsperLayout: string
  comment: string
  timeStamp: string
  _id: string
}

interface TubeSheetData {
  _id?: string
  equipmentId?: string
  clientName?: string
  clientAddress?: string
  type?: string
  material?: string
  totalNoOfTubes?: number
  numberOfCameras?: number
  cameras?: string[]
  typeOfPhases?: string[]
}

interface SurveyInfo {
  _id?: string
  status?: string
  surveyType?: string
  repeat?: number
  createdAt?: string
  endTimeStamp?: string
  data?: SurveyDataItem[]
  comments?: CommentItem[]
}

interface ReactorData {
  config: ReactorConfig
  tubes: Tube[]
}

const route = useRoute()
const router = useRouter()
const axios = useAxios()

const loading = ref(true)
const error = ref<string | null>(null)
const reportRef = ref()

const tubeSheetDetails = ref<TubeSheetData | null>(null)
const surveyData = ref<SurveyInfo | null>(null)
const reactorData = ref<ReactorData | null>(null)

async function fetchReportData() {
  loading.value = true
  error.value = null

  try {
    const surveyId = route.query.surveyId as string
    const sheetId = route.params.sheetId as string
    const reactorId = route.params.reactorId as string

    if (!surveyId) {
      throw new Error('Survey ID is required')
    }

    // Fetch survey data - response is { success, data: { ...surveyInfo } }
    const surveyResponse = await axios.$get(`/api/v2/survey/getSurveyData/${surveyId}`)
    surveyData.value = surveyResponse.data || surveyResponse

    // Fetch tubesheet details
    if (sheetId) {
      const sheetResponse = await axios.$get(`/api/v2/tubeSheet/getSpecificTubeSheet/${sheetId}`)
      tubeSheetDetails.value = sheetResponse.data || sheetResponse
    }

    // Fetch reactor data
    if (reactorId) {
      const reactorResponse = await axios.$get(`/api/v2/reactor/getReactorById/${reactorId}`)
      const reactor = reactorResponse.data || reactorResponse
      if (reactor) {
        reactorData.value = {
          config: reactor.config,
          tubes: reactor.tubes || []
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch report data:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load report data'
  } finally {
    loading.value = false
  }
}

function handlePrint() {
  window.print()
}

function goBack() {
  router.back()
}

onMounted(() => {
  fetchReportData()
})
</script>

<style>
@media print {
  @page {
    size: A4;
    margin: 0;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
