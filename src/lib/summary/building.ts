import { loadBuilding } from '@/api/building'
import { contribution } from './summary'

/** Facts of the Building block: the buildings the BDNB lists on the parcel. */
export const buildingSummary = contribution({
  block: 'building',
  load: loadBuilding,
  facts: ({ buildings }) => {
    // Absence from the BDNB does not prove bare land: nothing to assert at the top of the report.
    if (buildings.length === 0) return []
    const year = buildings.length === 1 ? buildings[0].constructionYear : null
    return [
      {
        id: 'buildings',
        label: 'Bâti',
        value: buildings.length === 1 ? '1 bâtiment recensé' : `${buildings.length} bâtiments recensés`,
        level: 'info',
        ...(year !== null && { detail: `Construit en ${year} selon la BDNB.` }),
      },
    ]
  },
})
