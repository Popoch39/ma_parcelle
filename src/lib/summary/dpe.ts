import { loadDpe, NEIGHBORHOOD_RADIUS, type DpeBlock } from '@/api/ademe'
import { contribution, type SummaryFact } from './summary'

/** Facts of the DPE block: the distribution of the dwellings' energy grades. */
export const dpeSummary = contribution({
  block: 'dpe',
  load: loadDpe,
  facts: (block) => {
    // No DPE proves nothing: the ADEME dataset only covers DPEs since July 2021.
    if (block.dpes.length === 0) return []
    return [block.scope === 'parcel' ? parcelFact(block) : neighborhoodFact(block)]
  },
})

// Neighboring dwellings say nothing about those of the parcel: never an alert, and the label
// says so.
function neighborhoodFact(block: DpeBlock): SummaryFact {
  const closest = block.limit?.total ? `, les ${block.limit.read} plus proches sur ${block.limit.total}` : ''
  return {
    id: 'dpe',
    label: `DPE du voisinage (moins de ${NEIGHBORHOOD_RADIUS} m)`,
    value: distributionOf(block),
    level: 'info',
    detail: `Aucun DPE n’est localisé sur la parcelle : ce sont ceux des logements voisins${closest}.`,
  }
}

function parcelFact(block: DpeBlock): SummaryFact {
  const inefficient = block.distribution
    .filter(({ grade }) => grade === 'F' || grade === 'G')
    .reduce((total, { count }) => total + count, 0)
  return {
    id: 'dpe',
    label: 'DPE des logements',
    value: distributionOf(block),
    level: inefficient > 0 ? 'caution' : 'info',
    ...(inefficient > 0 && {
      detail: `${inefficient === 1 ? '1 logement classé' : `${inefficient} logements classés`} F ou G : ${inefficient === 1 ? 'sa' : 'leur'} location est progressivement interdite (G depuis 2025, F à partir de 2028).`,
    }),
  }
}

/** « 10 DPE : 1 C, 4 D, 3 E, 1 F, 1 G ». */
function distributionOf({ dpes, distribution }: DpeBlock): string {
  const grades = distribution.filter(({ count }) => count > 0).map(({ grade, count }) => `${count} ${grade}`)
  return `${dpes.length} DPE : ${grades.join(', ')}`
}
