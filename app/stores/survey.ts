import { defineStore } from 'pinia'

export interface Survey {
  tubeSheetId: string
  surveyType: string
  reactorId: string
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

  async function getSurveyUpdates(id?: string) {
    const api = useAxios()
    try {
      const { data } = await api.$get(`api/v2/survey/getSurveyData/${id || currentSurveyId.value}`)
      return data
    } catch (e) {
      console.error('Failed to get survey updates:', e)
    }
  }

  async function stopSurvey(surveyId?: string) {
    const api = useAxios()
    try {
      const data = await api.$post(`api/v2/survey/stopSurvey/${surveyId || currentSurveyId.value}`)
      useRouter().push({
        query: {
          surveyId: currentSurveyId.value
        }
      })
      currentSurveyId.value = ''
      return data
    } catch (e) {
      console.error('Failed to stop survey:', e)
      throw e
    }
  }

  return {
    currentSurveyId,
    createSurvey,
    getSurveyUpdates,
    stopSurvey
  }
}, {
  persist: {
    storage: localStorage
  }
})
