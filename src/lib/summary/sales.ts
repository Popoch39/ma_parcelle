import { loadSales } from '@/api/sales'
import type { DwellingType } from '@/lib/sales'
import { contribution, type SummaryFact } from './summary'

const euros = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

const LABELS: Record<DwellingType, { plural: string; complement: string }> = {
  apartment: { plural: 'appartements', complement: 'd’appartements' },
  house: { plural: 'maisons', complement: 'de maisons' },
}

/** Facts of the Sales block: the neighborhood's median price per m², by dwelling type. */
export const salesSummary = contribution({
  block: 'sales',
  load: loadSales,
  facts: ({ medians, radius, since }) =>
    (['apartment', 'house'] as const).flatMap((type): SummaryFact[] => {
      const { pricePerSqm, salesCount } = medians[type]
      // Too few sales: the section says so, the summary has no price to put forward.
      if (pricePerSqm === null) return []
      return [
        {
          id: `price-${type}`,
          label: `Prix médian au m², ${LABELS[type].plural}`,
          value: `${euros.format(pricePerSqm)} €/m² · ${salesCount} ventes`,
          level: 'info',
          detail: `Médiane des ventes simples ${LABELS[type].complement} à moins de ${radius} m depuis ${since} : un repère du voisinage, pas une estimation de la parcelle.`,
        },
      ]
    }),
})
