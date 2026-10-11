import type { Parcelle } from '@/api/cadastre'
import { contribution } from './synthese'

const entier = new Intl.NumberFormat('fr-FR')

/** Faits du bloc Cadastre : la surface de la parcelle. */
export const syntheseCadastre = contribution({
  bloc: 'cadastre',
  // La parcelle est déjà chargée pour tous les blocs : le Cadastre n'a rien d'autre à demander.
  charger: async (_fetch, parcelle: Parcelle) => parcelle,
  faits: (parcelle) => [
    { id: 'surface', libelle: 'Surface', valeur: `${entier.format(parcelle.contenance)} m²`, niveau: 'information' },
  ],
})
