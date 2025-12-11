import type { CreateAxiosDefaults } from 'axios'

export type LatticeType = 'triangular' | 'square'
export type propertiesTypes = {
  label: string
  value: string
  color: string
}[]
export interface ReactorConfig {
  shape: 'CIRCLE' | 'RECTANGLE' | 'HEXAGONE' | 'DONUT'
  outerDimension: number
  height?: number
  width?: numbber
  innerRadius?: number
  tubeRadius: number
  padding: number
  shapeColor: string
  paddingColor: string
  pitch: number
  lattice: LatticeType
  angle: 30 | 45 | 60 | 90
}

export interface Tube {
  id: string
  x: number
  y: number
  r: number
  capped: boolean
  capColor: string | null
  blocked?: boolean
  deleted?: boolean
  property?: string | null
  propertyColor?: string | null
  comment?: string | null
  _backendUpdated?: boolean
}

export interface Survey {
  id: string
  name: string
}

export interface TubeSheet {
  _id: string
  clientName: string
  type: string
  clientAddress: string
  createdAt: Date
  updatedAt: Date
  status: 'TUBE_SHEET_CREATED' | 'CAMERA_CONFIGURED' | 'REACTOR_CREATED' | 'CAMERA_CALIBRATED' | 'IDLE' | 'UNDER_SURVEY'
  reactorId: string
  date: Date
  projectStartDate: Date
  material: string
  totalNoOfTubes: number
  equipmentId: string
  numberOfCameras: number
  cameras: string[]
  typeOfPhases: string[]

}

export interface Reactor {
  id: string
  config: ReactorConfig
  tubes: Tube[]
}

export interface User {
  id: string
  email: string
  password: string
}
export interface AxiosConfigInterface {
  axios: CreateAxiosDefaults
  RoutesWithoutLoader: string[]
}
