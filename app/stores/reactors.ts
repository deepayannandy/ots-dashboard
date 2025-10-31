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
  async function saveReactor(reactor: Reactor) {
    const api = useAxios()
    try {
      if (reactor.reactorId) {
        await api.$patch(`api/v2/reactor/patchReactor/${reactor.reactorId}`, reactor)
        navigateTo('/')
      } else {
        const { id } = await api.$post(`/api/v2/reactor/createReactor`, reactor)
        useTubeSheets().updateTubeSheet({ _id: reactor.sheetId, status: 'SHAPE_CREATED', reactorId: id })
        navigateTo('/')
      }
    } catch (e) {
      console.error('Failed to save reactor:', e)
    }
  }

  async function getAReactor(id: string) {
    const api = useAxios()
    try {
      const { data } = await api.$get(`api/v2/reactor/getReactorById/${id}`)
      return data
    } catch (e) {
      console.error('Failed to save reactor:', e)
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
