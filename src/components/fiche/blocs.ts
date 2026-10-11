import type { ComponentType } from 'react'
import { BatimentSection } from './batiment/BatimentSection'
import { CadastreSection } from './cadastre/CadastreSection'
import { DpeSection } from './dpe/DpeSection'
import { RisquesSection } from './risques/RisquesSection'
import { UrbanismeSection } from './urbanisme/UrbanismeSection'
import { VentesSection } from './ventes/VentesSection'

/** Ce que la fiche passe à chaque bloc : la parcelle sélectionnée, rien d'autre. */
export interface BlocProps {
  idu: string
}

/**
 * Blocs de la fiche, dans leur ordre d'affichage. Ajouter, retirer ou déplacer un bloc =
 * une ligne. Chaque bloc charge et échoue seul (`<Bloc>Section`).
 */
export const BLOCS = [
  { id: 'cadastre', Section: CadastreSection },
  { id: 'urbanisme', Section: UrbanismeSection },
  { id: 'risques', Section: RisquesSection },
  { id: 'ventes', Section: VentesSection },
  { id: 'batiment', Section: BatimentSection },
  { id: 'dpe', Section: DpeSection },
] as const satisfies ReadonlyArray<{ id: string; Section: ComponentType<BlocProps> }>

/** Clé d'un bloc : celle de sa query, de sa contribution à la synthèse et de son état déplié. */
export type BlocId = (typeof BLOCS)[number]['id']
