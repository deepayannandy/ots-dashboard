import { defineStore } from 'pinia'

import type { ReactorConfig, Tube } from '~/types'
import { useTubeSheets } from './tubesheets'

export interface Reactor {
  reactorId: string
  config: ReactorConfig
  tubes: Tube[]
  sheetId: string
  updatedAt?: string | Date
  createdAt?: string | Date
}

export const useReactorsStore = defineStore('reactors', () => {
  async function saveReactor(reactor: Reactor, navigate: boolean = true): Promise<string | undefined> {
    const api = useAxios()
    try {
      if (reactor.reactorId) {
        await api.$patch(`/api/v2/reactor/patchReactor/${reactor.reactorId}`, reactor)
        if (navigate) navigateTo('/')
        return reactor.reactorId
      } else {
        const response = await api.$post(`/api/v2/reactor/createReactor`, reactor)
        const id = response?.id || response?.data?.id || response?._id || response?.data?._id
        if (id) {
          useTubeSheets().updateTubeSheet({ _id: reactor.sheetId, status: 'REACTOR_CREATED', reactorId: id })
        }
        if (navigate) navigateTo('/')
        return id
      }
    } catch (e) {
      console.error('Failed to save reactor:', e)
      return undefined
    }
  }

  async function getAReactor(id: string) {
    const api = useAxios()
    try {
      const { data } = await api.$get(`/api/v2/reactor/getReactorById/${id}`)
      return data
    } catch (e) {
      console.error('Failed to get reactor:', e)
    }
  }

  return {
    saveReactor,
    getAReactor
  }
}, {
  persist: {
    storage: localStorage
  }
})
