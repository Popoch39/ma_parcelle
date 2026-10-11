import type { ComponentType } from 'react'
import { BuildingSection } from './building/BuildingSection'
import { CadastreSection } from './cadastre/CadastreSection'
import { DpeSection } from './dpe/DpeSection'
import { PlanningSection } from './planning/PlanningSection'
import { RisksSection } from './risks/RisksSection'
import { SalesSection } from './sales/SalesSection'

/** What the report passes to each block: the selected parcel, nothing else. */
export interface BlockProps {
  idu: string
}

/**
 * Blocks of the report, in their display order. Adding, removing or moving a block =
 * one line. Each block loads and fails on its own (`<Block>Section`).
 */
export const BLOCKS = [
  { id: 'cadastre', Section: CadastreSection },
  { id: 'planning', Section: PlanningSection },
  { id: 'risks', Section: RisksSection },
  { id: 'sales', Section: SalesSection },
  { id: 'building', Section: BuildingSection },
  { id: 'dpe', Section: DpeSection },
] as const satisfies ReadonlyArray<{ id: string; Section: ComponentType<BlockProps> }>

/** Key of a block: that of its query, of its contribution to the summary and of its expanded state. */
export type BlockId = (typeof BLOCKS)[number]['id']
