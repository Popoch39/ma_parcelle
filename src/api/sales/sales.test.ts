import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import { loadParcel } from '../cadastre'
import parcelAiguesJuntes from '../__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelBordeaux from '../__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelParis from '../__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'
import divisionAiguesJuntes from '../__fixtures__/cadastre/division-neighborhood-aigues-juntes-09001-zc-148.json'
import divisionParis from '../__fixtures__/cadastre/division-neighborhood-paris-75107-bq-3.json'
import ceremaAiguesJuntes from '../__fixtures__/cerema/geomutations-aigues-juntes-09001-zc-148.json'
import ceremaRefusal from '../__fixtures__/cerema/geomutations-bbox-too-large-403.json'
import dvfAiguesJuntesZC from '../__fixtures__/datagouv/dvf-section-09001000ZC.csv?raw'
import dvfParisBQ from '../__fixtures__/datagouv/dvf-section-75107000BQ-no-sales.csv?raw'
import dvfParisCX from '../__fixtures__/datagouv/dvf-section-75115000CX.csv?raw'
import bordeauxPage1 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-1.json'
import bordeauxPage2 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-2.json'
import bordeauxPage3 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-3.json'
import bordeauxPage4 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-4.json'
import bordeauxPage5 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-5.json'
import { loadSales, type SalesBlock } from '.'

const parcel = (idu: string, body: unknown) => loadParcel(fakeFetch([{ match: 'cadastre/parcelle', body }]), idu)

/**
 * The five pages of mutations of the Cerema API around 33063 KJ 33, each reduced to
 * a few mutations. A page is only served at its https URL: following the `next` link as is
 * (in http) would hit "No fixture".
 */
const ceremaBordeaux: FakeRoute[] = [
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/.*page=2&/, body: bordeauxPage2 },
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/.*page=3&/, body: bordeauxPage3 },
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/.*page=4&/, body: bordeauxPage4 },
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/.*page=5&/, body: bordeauxPage5 },
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/dvf_opendata\/geomutations\/\?in_bbox=/, body: bordeauxPage1 },
]

beforeAll(() => {
  // The sales period (the last five years) is counted from today.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-11T12:00:00+02:00'))
})

describe('loadSales', () => {
  it('computes the median price per sqm of apartments over the neighborhood simple sales, with their count', async () => {
    const fetch = fakeFetch(ceremaBordeaux)

    const sales = await loadSales(fetch, await parcel('33063000KJ0033', parcelBordeaux))

    // Apartments sold alone within 500 m, in €/m² built:
    // 117 000 / 36 = 3 250 ; 287 400 / 80 = 3 592.5 ; 182 838 / 45 ≈ 4 063 ; 330 000 / 80 = 4 125 ;
    // 257 000 / 52 ≈ 4 942 ; 138 000 / 23 = 6 000 ; 127 000 / 20 = 6 350 → median 4 125.
    expect(sales.medians.apartment).toEqual({ pricePerSqm: 4125, salesCount: 7 })
  })

  it('gives no median price when too few simple sales are kept, but says how many', async () => {
    const sales = await loadSales(fakeFetch(ceremaBordeaux), await parcel('33063000KJ0033', parcelBordeaux))

    // Four houses sold alone within 500 m: below the threshold of five.
    expect(sales.medians.house).toEqual({ pricePerSqm: null, salesCount: 4 })
  })

  it('asks Cerema for a square of about 1 km over five years, and follows the pages in https', async () => {
    const fetch = fakeFetch(ceremaBordeaux)

    await loadSales(fetch, await parcel('33063000KJ0033', parcelBordeaux))

    const page = (n: number) =>
      `https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/?anneemut_min=2021&in_bbox=-0.580041%2C44.835945%2C-0.567372%2C44.844928&page=${n}&page_size=500`
    expect(fetch.calls).toEqual([
      'https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/?in_bbox=-0.580041%2C44.835945%2C-0.567372%2C44.844928&anneemut_min=2021&page_size=500',
      page(2),
      page(3),
      page(4),
      page(5),
    ])
  })

  it('lists all the neighborhood sales, from the most recent to the oldest, excluding the land and the commercial premises from the median', async () => {
    const sales = await loadSales(fakeFetch(ceremaBordeaux), await parcel('33063000KJ0033', parcelBordeaux))

    expect(sales.source).toBe('cerema')
    expect(sales.since).toBe(2021)
    expect(
      sales.sales.map(({ date, type, price, builtArea, landArea, pricePerSqm, exclusion }) => ({
        date,
        type,
        price,
        builtArea,
        landArea,
        pricePerSqm: pricePerSqm && Math.round(pricePerSqm),
        exclusion,
      })),
    ).toEqual([
      { date: '2025-09-26', type: 'house', price: 632380, builtArea: 86, landArea: 56, pricePerSqm: 7353, exclusion: null },
      { date: '2025-09-10', type: 'apartment', price: 138000, builtArea: 23, landArea: null, pricePerSqm: 6000, exclusion: null },
      { date: '2023-10-13', type: 'apartment', price: 257000, builtArea: 52, landArea: null, pricePerSqm: 4942, exclusion: null },
      { date: '2023-09-21', type: 'apartment', price: 182838, builtArea: 45, landArea: null, pricePerSqm: 4063, exclusion: null },
      { date: '2023-05-25', type: 'house', price: 638840, builtArea: 86, landArea: 56, pricePerSqm: 7428, exclusion: null },
      { date: '2023-04-03', type: 'house', price: 720000, builtArea: 80, landArea: 39, pricePerSqm: 9000, exclusion: null },
      { date: '2023-03-21', type: 'land', price: 850000, builtArea: null, landArea: 68, pricePerSqm: null, exclusion: 'land' },
      { date: '2022-06-15', type: 'apartment', price: 287400, builtArea: 80, landArea: null, pricePerSqm: 3593, exclusion: null },
      { date: '2022-05-02', type: 'house', price: 652850, builtArea: 128, landArea: 50, pricePerSqm: 5100, exclusion: null },
      { date: '2021-11-23', type: 'apartment', price: 127000, builtArea: 20, landArea: null, pricePerSqm: 6350, exclusion: null },
      { date: '2021-09-02', type: 'commercial', price: 1000000, builtArea: 170, landArea: null, pricePerSqm: 5882, exclusion: 'commercial-premises' },
      { date: '2021-07-13', type: 'apartment', price: 117000, builtArea: 36, landArea: null, pricePerSqm: 3250, exclusion: null },
      { date: '2021-06-14', type: 'apartment', price: 330000, builtArea: 80, landArea: null, pricePerSqm: 4125, exclusion: null },
    ])
  })

  it('keeps only the sales within 500 m of the parcel center', async () => {
    const sales = await loadSales(fakeFetch(ceremaBordeaux), await parcel('33063000KJ0033', parcelBordeaux))

    // The requested square also contains a house at 503 m and an apartment at 516 m.
    expect(sales.sales.map(({ id }) => id)).not.toContain('e82053c80cdce800c131d79f822d1b07')
    expect(sales.sales.map(({ id }) => id)).not.toContain('52437a051095bfbd15829d8611b2fa2a')
    expect(Math.max(...sales.sales.map(({ distance }) => distance))).toBeLessThanOrEqual(500)
    expect(sales.radius).toBe(500)
  })

  it('drops a mutation whose parcels are far away, and excludes the sale of several houses from the median', async () => {
    const fetch = fakeFetch([{ match: 'apidf-preprod.cerema.fr', body: ceremaAiguesJuntes }])

    const sales = await loadSales(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes))

    // The API also returns a house whose two parcels are more than 20 km away.
    expect(sales.sales.map(({ date, type, exclusion }) => ({ date, type, exclusion }))).toEqual([
      { date: '2025-05-05', type: 'house', exclusion: null },
      { date: '2024-12-23', type: 'land', exclusion: 'land' },
      { date: '2024-11-29', type: 'houses', exclusion: 'bulk-sale' },
    ])
    expect(sales.medians).toEqual({
      house: { pricePerSqm: null, salesCount: 1 },
      apartment: { pricePerSqm: null, salesCount: 0 },
    })
  })

  describe('when the Cerema API does not answer', () => {
    /** Cerema refuses, the cadastre gives two neighborhood sections, one of which has no sale at all. */
    const fallbackParis: FakeRoute[] = [
      { match: 'apidf-preprod.cerema.fr', status: 403, body: ceremaRefusal },
      { match: 'apicarto.ign.fr/api/cadastre/division?', body: divisionParis },
      { match: 'dvf-api.data.gouv.fr/dvf/csv/?section=75107000BQ', body: dvfParisBQ },
      { match: 'dvf-api.data.gouv.fr/dvf/csv/?section=75115000CX', body: dvfParisCX },
    ]

    it('falls back to dvf-api.data.gouv, queried section by section with the district code', async () => {
      const fetch = fakeFetch(fallbackParis)

      const sales = await loadSales(fetch, await parcel('75107000BQ0003', parcelParis))

      expect(sales.source).toBe('datagouv')
      expect(fetch.calls.slice(1, 2)).toEqual([expect.stringMatching(/^https:\/\/apicarto\.ign\.fr\/api\/cadastre\/division\?geom=/)])
      expect(fetch.calls.slice(2)).toEqual([
        'https://dvf-api.data.gouv.fr/dvf/csv/?section=75107000BQ',
        'https://dvf-api.data.gouv.fr/dvf/csv/?section=75115000CX',
      ])
    })

    it('normalizes the CSV sales: a bulk sale of 3 apartments and 2 outbuildings, a commercial premises and outbuildings alone are excluded', async () => {
      const sales = await loadSales(fakeFetch(fallbackParis), await parcel('75107000BQ0003', parcelParis))

      expect(
        sales.sales.map(({ id, date, type, price, builtArea, landArea, pricePerSqm, exclusion }) => ({
          id,
          date,
          type,
          price,
          builtArea,
          landArea,
          pricePerSqm: pricePerSqm && Math.round(pricePerSqm),
          exclusion,
        })),
      ).toEqual([
        { id: '2023-1345647', date: '2023-03-23', type: 'apartment', price: 635000, builtArea: 57, landArea: null, pricePerSqm: 11140, exclusion: null },
        // Lots 19, 20 and 21: 28 + 32 + 37 m² of apartments, and two outbuildings.
        { id: '2023-1343823', date: '2023-02-28', type: 'apartments', price: 860000, builtArea: 97, landArea: null, pricePerSqm: 8866, exclusion: 'bulk-sale' },
        { id: '2022-1686198', date: '2022-11-17', type: 'commercial', price: 448000, builtArea: 55, landArea: null, pricePerSqm: 8145, exclusion: 'commercial-premises' },
        { id: '2022-1682236', date: '2022-09-27', type: 'outbuilding', price: 221680, builtArea: null, landArea: null, pricePerSqm: null, exclusion: 'outbuilding' },
      ])
      expect(sales.medians.apartment).toEqual({ pricePerSqm: null, salesCount: 1 })
    })

    it('describes the same sales as Cerema, counting once the premises or land use the CSV repeats', async () => {
      const ruralParcel = await parcel('09001000ZC0148', parcelAiguesJuntes)
      const summary = ({ sales }: SalesBlock) =>
        sales.map(({ date, type, price, builtArea, landArea, exclusion }) => ({
          date,
          type,
          price,
          builtArea,
          landArea,
          exclusion,
        }))

      const main = await loadSales(fakeFetch([{ match: 'apidf-preprod.cerema.fr', body: ceremaAiguesJuntes }]), ruralParcel)
      const fallback = await loadSales(
        fakeFetch([
          { match: 'apidf-preprod.cerema.fr', status: 403, body: ceremaRefusal },
          { match: 'apicarto.ign.fr/api/cadastre/division?', body: divisionAiguesJuntes },
          { match: 'dvf-api.data.gouv.fr/dvf/csv/?section=09001000ZC', body: dvfAiguesJuntesZC },
        ]),
        ruralParcel,
      )

      expect(fallback.source).toBe('datagouv')
      // The two houses of 71 and 114 m² repeat the 138 m² "sols" land use of their parcel.
      expect(summary(fallback)).toEqual([
        { date: '2025-05-05', type: 'house', price: 158000, builtArea: 153, landArea: 894, exclusion: null },
        { date: '2024-12-23', type: 'land', price: 5000, builtArea: null, landArea: 55, exclusion: 'land' },
        { date: '2024-11-29', type: 'houses', price: 169000, builtArea: 185, landArea: 2920, exclusion: 'bulk-sale' },
      ])
      expect(summary(fallback)).toEqual(summary(main))
    })

    it('fails with the main source error if the fallback fails too', async () => {
      const fetch = fakeFetch([
        { match: 'apidf-preprod.cerema.fr', status: 403, body: ceremaRefusal },
        { match: 'apicarto.ign.fr/api/cadastre/division?', body: divisionParis },
        { match: 'dvf-api.data.gouv.fr', status: 502, body: '<html><body>502 Bad Gateway</body></html>' },
      ])

      const loading = loadSales(fetch, await parcel('75107000BQ0003', parcelParis))

      await expect(loading).rejects.toMatchObject({ name: 'ApiError', kind: 'http', status: 403 })
    })
  })
})
