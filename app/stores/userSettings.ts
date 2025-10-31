import { defineStore } from 'pinia'
import type { propertiesTypes } from '@/types'

export const useUserSettings = defineStore('userSettings', {
  state: () => {
    return {
      propertiesOptions: [
        { label: 'Catalyst Tc', value: 'CATALYST_TC', color: '#FF6B6B' },
        { label: 'Coolant', value: 'COOLANT', color: '#4ECDC4' },
        { label: 'Solid', value: 'SOLID', color: '#556270' },
        { label: 'Bend', value: 'BEND', color: '#C7F464' },
        { label: 'Salt Tc', value: 'SALT_TC', color: '#FFA500' },
        { label: 'Blocked', value: 'BLOCKED', color: '#1E90FF' }
      ],
      shapes: [
        { label: 'Circle', value: 'CIRCLE', icon: 'i-lucide-circle' },
        { label: 'Rectangle', value: 'RECTANGLE', icon: 'i-lucide-square' },
        { label: 'Hexagone', value: 'HEXAGONE', icon: 'i-lucide-hexagon' },
        { label: 'Donut', value: 'DONUT', icon: 'i-lucide-donut' }
      ]
    }
  },
  actions: {
    setProperties(properties: propertiesTypes) {
      this.propertiesOptions = properties
    }
  }
})
