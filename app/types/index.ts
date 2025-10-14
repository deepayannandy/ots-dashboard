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
  angle?: 30 | 45 | 60 | 90;
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
  property?: 'catalyst_tc' | 'coolant' | 'solid' | 'bend' | 'salt_tc' | null
  propertyColor?: string | null
}
