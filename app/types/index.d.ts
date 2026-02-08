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
  positions?: {
    scale: number
    tx: number
    ty: number
    rotation: number
  }
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
  _backendUpdatedBack?: boolean
  backColor?: string
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
  dayStart?: string
  dayEnd?: string
  timeZoneOffset?: number

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

/* -------------------------------------------------- */
/* PAGE TYPES */
/* -------------------------------------------------- */

export type PageSize = 'A4' | 'A5'
export type Orientation = 'portrait' | 'landscape'

/* -------------------------------------------------- */
/* PADDING TYPES */
/* -------------------------------------------------- */

export interface PaddingBox {
  top: number
  right: number
  bottom: number
  left: number
}

export type PaddingValue = number | Partial<PaddingBox>
export type PaddingConfig = PaddingValue | Record<number | 'default', PaddingValue>

/* -------------------------------------------------- */
/* PAGE CONTENT */
/* -------------------------------------------------- */

export interface Page {
  content: string[]
  noHeader?: boolean
  noFooter?: boolean
  fullPage?: boolean
}

/* -------------------------------------------------- */
/* SLOT PROPS */
/* -------------------------------------------------- */

export interface HeaderFooterSlotProps {
  page: number
  total: number
}

/* -------------------------------------------------- */
/* COMPONENT PROPS */
/* -------------------------------------------------- */

export interface PageDocumentProps {
  /**
   * Page size format
   * @default 'A4'
   */
  size?: PageSize
  /**
   * Page orientation
   * @default 'portrait'
   */
  orientation?: Orientation
  /**
   * Page padding configuration
   * Can be a single number for all sides, an object with individual sides,
   * or an object with page-specific padding (using page numbers as keys)
   * @default 40
   */
  padding?: PaddingConfig
}

export type DocumentViewerProps = PageDocumentProps
