import type { ComponentType } from 'react'
import { BatimentSection } from './batiment/BatimentSection'
import { CadastreSection } from './cadastre/CadastreSection'
import { DpeSection } from './dpe/DpeSection'
import { UrbanismeSection } from './urbanisme/UrbanismeSection'

/** Ce que la fiche passe à chaque bloc : la parcelle sélectionnée, rien d'autre. */
export interface BlocProps {
  idu: string
}

/**
 * Blocs de la fiche, dans leur ordre d'affichage. Ajouter, retirer ou déplacer un bloc =
 * une ligne. Chaque bloc charge et échoue seul (`<Bloc>Section`).
 */
export const BLOCS: ReadonlyArray<{ id: string; Section: ComponentType<BlocProps> }> = [
  { id: 'cadastre', Section: CadastreSection },
  { id: 'urbanisme', Section: UrbanismeSection },
  { id: 'batiment', Section: BatimentSection },
  { id: 'dpe', Section: DpeSection },
]
