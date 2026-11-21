import { defineStore } from 'pinia'

const DEFAULT_LOGO = '/ots.jpeg'

interface CompanyData {
  _id: string
  companyName: string
  email: string
  address: string
  numberOfLayouts: number
  logo: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export const useCompany = defineStore('company', {
  state: () => ({
    data: null as CompanyData | null,
    logoUrl: DEFAULT_LOGO,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchCompanyDetails() {
      if (this.data) return // Already fetched

      this.loading = true
      this.error = null

      try {
        const config = useRuntimeConfig()
        const axios = useAxios()
        const response = await axios.$get('/api/v2/company/getCompanyDetails')

        if (response?.data) {
          this.data = response.data

          // Construct full logo URL
          if (response.data.logo) {
            this.logoUrl = `${config.public.axios.baseURL}${response.data.logo}`
          }
        }
      } catch (error: any) {
        this.error = error?.response?.data?.message || 'Failed to fetch company details'
        console.error('Failed to fetch company details:', error)
      } finally {
        this.loading = false
      }
    },

    // Called when the company logo fails to load (e.g. 404) — fall back to the OTS logo
    useFallbackLogo() {
      if (this.logoUrl !== DEFAULT_LOGO) this.logoUrl = DEFAULT_LOGO
    },

    clearCompanyData() {
      this.data = null
      this.logoUrl = DEFAULT_LOGO
      this.error = null
    }
  },

  persist: {
    storage: localStorage
  }
})
