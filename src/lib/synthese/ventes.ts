import { loadVentes } from '@/api/ventes'
import type { TypeLogement } from '@/lib/ventes'
import { contribution, type FaitSynthese } from './synthese'

const euros = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

const LIBELLES: Record<TypeLogement, { pluriel: string; complement: string }> = {
  appartement: { pluriel: 'appartements', complement: 'd’appartements' },
  maison: { pluriel: 'maisons', complement: 'de maisons' },
}

/** Faits du bloc Ventes : le prix médian au m² du voisinage, par type de logement. */
export const syntheseVentes = contribution({
  bloc: 'ventes',
  charger: loadVentes,
  faits: ({ medianes, rayon, depuis }) =>
    (['appartement', 'maison'] as const).flatMap((type): FaitSynthese[] => {
      const { prixM2, ventes } = medianes[type]
      // Trop peu de ventes : la section le dit, la synthèse n'a pas de prix à avancer.
      if (prixM2 === null) return []
      return [
        {
          id: `prix-${type}`,
          libelle: `Prix médian au m², ${LIBELLES[type].pluriel}`,
          valeur: `${euros.format(prixM2)} €/m² · ${ventes} ventes`,
          niveau: 'information',
          detail: `Médiane des ventes simples ${LIBELLES[type].complement} à moins de ${rayon} m depuis ${depuis} : un repère du voisinage, pas une estimation de la parcelle.`,
        },
      ]
    }),
})
