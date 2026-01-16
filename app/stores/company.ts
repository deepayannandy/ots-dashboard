import { defineStore } from 'pinia'

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
    logoUrl: '/ots.jpeg',
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

    clearCompanyData() {
      this.data = null
      this.logoUrl = '/ots.jpeg'
      this.error = null
    }
  },

  persist: {
    storage: localStorage
  }
})
