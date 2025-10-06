export type ShapeType = 'circle' | 'square' | 'rectangle' | 'hexagon' | 'doughnut'
export type LatticeType = 'triangular' | 'square'

export interface ReactorConfig {
  shape: ShapeType
  outerDimension: number // radius for circle/hexagon, side for square, full length for rectangle (we'll map)
  width?: number
  height?: number
  innerRadius?: number
  tubeRadius: number
  padding: number
  shapeColor: string
  paddingColor: string
  pitch: number
  lattice: LatticeType
}

export interface Tube {
  id: string
  x: number
  y: number
  r: number
  capped?: boolean
  capColor?: string | null
  blocked?: boolean
  deleted?: boolean
}
