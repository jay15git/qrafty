import type { CrossOrigin, Excavation } from './lib'

export interface FilterFnProps {
  x: number
  y: number
  numCells: number
}

export interface DataModulesNeighbours {
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
  count: number
}

export interface CalculatedImageSettings {
  x: number
  y: number
  h: number
  w: number
  excavation: Excavation | null
  opacity: number
  crossOrigin: CrossOrigin
}
