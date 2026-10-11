import { loadBatiment } from '@/api/batiment'
import { contribution } from './synthese'

/** Faits du bloc Bâtiment : le bâti que la BDNB recense sur la parcelle. */
export const syntheseBatiment = contribution({
  bloc: 'batiment',
  charger: loadBatiment,
  faits: ({ batiments }) => {
    // L'absence de la BDNB ne prouve pas un terrain nu : rien à affirmer en tête de fiche.
    if (batiments.length === 0) return []
    const annee = batiments.length === 1 ? batiments[0].anneeConstruction : null
    return [
      {
        id: 'bati',
        libelle: 'Bâti',
        valeur: batiments.length === 1 ? '1 bâtiment recensé' : `${batiments.length} bâtiments recensés`,
        niveau: 'information',
        ...(annee !== null && { detail: `Construit en ${annee} selon la BDNB.` }),
      },
    ]
  },
})
