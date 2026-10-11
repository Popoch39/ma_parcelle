import { describe, expect, it } from 'vitest'
import { loadParcel } from '@/api/cadastre'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import noDpe from '@/api/__fixtures__/ademe/no-dpe.json'
import bboxKj44 from '@/api/__fixtures__/ademe/bbox-bordeaux-33063-kj-44.json'
import bboxKm239 from '@/api/__fixtures__/ademe/bbox-bordeaux-33063-km-239.json'
import neighborhoodAiguesJuntes from '@/api/__fixtures__/ademe/neighborhood-aigues-juntes-09001-zc-148.json'
import neighborhoodBordeauxPage1 from '@/api/__fixtures__/ademe/neighborhood-bordeaux-33063-kj-33-page-1.json'
import neighborhoodBordeauxPage2 from '@/api/__fixtures__/ademe/neighborhood-bordeaux-33063-kj-33-page-2.json'
import neighborhoodBordeauxPage3 from '@/api/__fixtures__/ademe/neighborhood-bordeaux-33063-kj-33-page-3.json'
import parcelAiguesJuntes from '@/api/__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelBordeaux from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelKj44 from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-kj-44.json'
import parcelKm239 from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-km-239.json'
import { dpeSummary } from './dpe'

/** DPE facts of a parcel's summary, the block loaded by its loader as in the report. */
async function dpeFacts(idu: string, parcel: unknown, routes: FakeRoute[]) {
  const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: parcel }, ...routes])
  return dpeSummary.facts(await dpeSummary.load(fetch, await loadParcel(fetch, idu)))
}

describe('summary: facts of the DPE block', () => {
  it('gives the distribution of the parcel grades, at caution level when dwellings are graded F or G', async () => {
    const facts = await dpeFacts('33063000KJ0044', parcelKj44, [{ match: 'lines?bbox=', body: bboxKj44 }])

    expect(facts).toEqual([
      {
        id: 'dpe',
        label: 'DPE des logements',
        value: '10 DPE : 1 C, 4 D, 3 E, 1 F, 1 G',
        level: 'caution',
        detail:
          '2 logements classés F ou G : leur location est progressivement interdite (G depuis 2025, F à partir de 2028).',
      },
    ])
  })

  it('stays at info level when no dwelling of the parcel is graded F or G', async () => {
    const facts = await dpeFacts('33063000KM0239', parcelKm239, [{ match: 'lines?bbox=', body: bboxKm239 }])

    expect(facts).toEqual([{ id: 'dpe', label: 'DPE des logements', value: '2 DPE : 1 D, 1 E', level: 'info' }])
  })

  it('presents the DPEs within 100 m as those of the neighborhood, without drawing an alert for the parcel', async () => {
    const facts = await dpeFacts('09001000ZC0148', parcelAiguesJuntes, [
      { match: 'lines?bbox=', body: noDpe },
      { match: 'lines?geo_distance=', body: neighborhoodAiguesJuntes },
    ])

    expect(facts).toEqual([
      {
        id: 'dpe',
        label: 'DPE du voisinage (moins de 100 m)',
        value: '3 DPE : 1 C, 1 F, 1 G',
        level: 'info',
        detail: 'Aucun DPE n’est localisé sur la parcelle : ce sont ceux des logements voisins.',
      },
    ])
  })

  it('says when the neighborhood has more DPEs than those kept', async () => {
    const facts = await dpeFacts('33063000KJ0033', parcelBordeaux, [
      { match: 'lines?bbox=', body: noDpe },
      { match: 'after=52.29016186365669', body: neighborhoodBordeauxPage2 },
      { match: 'after=70.73690557292974', body: neighborhoodBordeauxPage3 },
      { match: 'lines?geo_distance=', body: neighborhoodBordeauxPage1 },
    ])

    expect(facts[0].detail).toBe(
      'Aucun DPE n’est localisé sur la parcelle : ce sont ceux des logements voisins, les 7 plus proches sur 377.',
    )
  })

  it('says nothing when neither the parcel nor its neighborhood has any DPE', async () => {
    const facts = await dpeFacts('33063000KJ0044', parcelKj44, [{ match: 'dpe03existant/lines?', body: noDpe }])

    expect(facts).toEqual([])
  })
})
