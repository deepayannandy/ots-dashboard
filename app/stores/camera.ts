import { defineStore } from 'pinia'

export interface Camera {
  _id: string
  name: string
  macId: string
  ipAddress: string
  isOccupied: boolean
  status: boolean
  createdAt: string
  updatedAt: string
  controllerIp?: string
  rtspUrl?: string
  x?: number
  y?: number
}

export const useCamera = defineStore('camera', {
  state: () => ({
    currentCamera: null as Camera | null,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async getCameraDetails(cameraId: string): Promise<Camera | null> {
      this.loading = true
      this.error = null
      try {
        const { data } = await useAxios().$get(`/api/v2/camera/getCameraDetails/${cameraId}`)
        this.currentCamera = data
        return data
      } catch (e) {
        console.error('Failed to fetch camera details:', e)
        this.error = 'Failed to fetch camera details'
        return null
      } finally {
        this.loading = false
      }
    },

    async setCameraAngle(cameraId: string, x: number, y: number): Promise<boolean> {
      try {
        await useAxios().$post(`/api/v2/camera/setCameraAngle/${cameraId}`, { x, y })
        if (this.currentCamera) {
          this.currentCamera.x = x
          this.currentCamera.y = y
        }
        return true
      } catch (e) {
        console.error('Failed to set camera angle:', e)
        return false
      }
    },

    clearCamera() {
      this.currentCamera = null
      this.error = null
    }
  }
})
