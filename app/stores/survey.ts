import { defineStore } from 'pinia'

export interface Survey {
  tubeSheetId: string
  surveyType: string
  eactorId: string
}

export const useSurveyStore = defineStore('survey', () => {
  const currentSurveyId = ref<''>()

  async function createSurvey(survey: Survey) {
    const api = useAxios()
    try {
      const data = await api.$post(`api/v2/survey/createSurveyReactor`, survey)
      currentSurveyId.value = data.id
      await getSurveyUpdates()
      return data
    } catch (e) {
      console.error('Failed to create survey:', e)
    }
  }

  async function getSurveyUpdates() {
    const api = useAxios()
    try {
      const { data } = await api.$get(`api/v2/survey/getSurveyData/${currentSurveyId.value}`)
      return {
        data: [
          {
            tubeId: 0,
            color: 'green',
            timeStamp: '2025-10-31T09:39:36.423Z',
            isDetected: true,
            _id: '690483d8fc72f28ba256069c'
          },
          {
            tubeId: 1,
            color: 'green',
            timeStamp: '2025-10-31T09:42:59.604Z',
            isDetected: true,
            _id: '690484a30aaf93fa1027c4da'
          },
          {
            tubeId: 2,
            color: 'green',
            timeStamp: '2025-10-31T09:43:05.569Z',
            isDetected: true,
            _id: '690484a90aaf93fa1027c4df'
          }
        ]
      }
    } catch (e) {
      console.error('Failed to get survey updates:', e)
    }
  }

  return {
    currentSurveyId,
    createSurvey,
    getSurveyUpdates
  }
}, {
  persist: {
    storage: localStorage
  }
})
