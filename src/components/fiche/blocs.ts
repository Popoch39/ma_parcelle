import type { ComponentType } from 'react'
import { CadastreSection } from './cadastre/CadastreSection'

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
]
