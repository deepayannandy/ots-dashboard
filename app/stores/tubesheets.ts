import { defineStore } from 'pinia'
import type { TubeSheet } from '@/types'

export const useTubeSheets = defineStore('tubesheets', {
  state: () => ({
    list: [] as Partial<TubeSheet>[]
  }),

  actions: {
    async addTubeSheet(sheet: Partial<TubeSheet>) {
      try {
        const { id } = await useAxios().$post('/api/v2/tubeSheet/createTubeSheet', sheet)

        await this.getAllSheet()

        return this.list.find(sheet => sheet._id === id)
      } catch (e) {
        console.error(e)
      }
    },

    async getAllSheet() {
      try {
        const { data } = await useAxios().$get('/api/v2/tubeSheet/getAllTubeSheet')

        // sort first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sorted = data.sort((a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )

        // mutate instead of replacing
        this.list.length = 0
        this.list.push(...sorted)

        return this.list
      } catch (e) {
        console.error(e)
      }
    },

    async updateTubeSheet(sheet: Partial<TubeSheet>) {
      try {
        await useAxios().$patch(`/api/v2/tubeSheet/patchTubeSheet/${sheet._id}`, { ...sheet })
        await this.getAllSheet()
        return this.list.find(s => s._id === sheet._id)
      } catch (e) {
        console.error(e)
      }
    },

    deleteTubeSheet(id?: string) {
      this.list = this.list.filter(s => s._id !== id)
    }
  },

  persist: {
    storage: localStorage
  }
})
