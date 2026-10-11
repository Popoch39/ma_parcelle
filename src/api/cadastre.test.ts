import { describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { loadParcel, ParcelError } from './cadastre'
import bordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import notFound from './__fixtures__/cadastre/parcelle-not-found.json'
import lyon from './__fixtures__/cadastre/parcelle-lyon-69382-ab-62.json'
import marseille from './__fixtures__/cadastre/parcelle-marseille-13201-804-0b-401.json'
import paris from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'

describe('loadParcel', () => {
  it('decodes the IDU, queries the cadastre and returns the cadastral record of the parcel', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: bordeaux }])

    const parcel = await loadParcel(fetch, '33063000KJ0033')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=33063&com_abs=000&section=KJ&numero=0033',
    ])
    expect(parcel).toMatchObject({
      idu: '33063000KJ0033',
      cadastralReference: '33063 KJ 33',
      area: 131,
      municipality: { name: 'Bordeaux', inseeCode: '33063' },
      district: null,
      prefix: '000',
      section: 'KJ',
      sheet: 1,
      number: '0033',
    })
  })

  it('returns the geometry of the parcel and its bbox [west, south, east, north]', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: bordeaux }])

    const parcel = await loadParcel(fetch, '33063000KJ0033')

    expect(parcel.geometry).toEqual(bordeaux.features[0].geometry)
    expect(parcel.bbox).toEqual([-0.57376242, 44.84035853, -0.57365078, 44.84051416])
  })

  it('queries Paris by municipality code and district code, and names the district', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: paris }])

    const parcel = await loadParcel(fetch, '75107000BQ0003')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=75056&code_arr=107&com_abs=000&section=BQ&numero=0003',
    ])
    expect(parcel).toMatchObject({
      idu: '75107000BQ0003',
      cadastralReference: '75107 BQ 3',
      area: 8215,
      municipality: { name: 'Paris', inseeCode: '75056' },
      district: { name: 'Paris 7e arrondissement', inseeCode: '75107' },
    })
  })

  it('queries Lyon by municipality code and district code', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: lyon }])

    const parcel = await loadParcel(fetch, '69382000AB0062')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=69123&code_arr=382&com_abs=000&section=AB&numero=0062',
    ])
    expect(parcel).toMatchObject({
      municipality: { name: 'Lyon', inseeCode: '69123' },
      district: { name: 'Lyon 2e arrondissement', inseeCode: '69382' },
    })
  })

  it('queries Marseille with the prefix of an absorbed municipality and carries it into the reference', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: marseille }])

    const parcel = await loadParcel(fetch, '132018040B0401')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=13055&code_arr=201&com_abs=804&section=0B&numero=0401',
    ])
    expect(parcel).toMatchObject({
      cadastralReference: '13201 804 0B 401',
      municipality: { name: 'Marseille', inseeCode: '13055' },
      district: { name: 'Marseille 1er arrondissement', inseeCode: '13201' },
      prefix: '804',
      section: '0B',
      number: '0401',
    })
  })

  it.each(['', '75107000BQ003', '75107000BQ00030', '75107000bq0003', '75107 000 BQ 0003'])(
    'rejects the malformed IDU "%s" without querying the cadastre',
    async (idu) => {
      const fetch = fakeFetch([])

      const error = await loadParcel(fetch, idu).catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ParcelError)
      expect(error).toMatchObject({ kind: 'invalid-idu', idu })
      expect(fetch.calls).toEqual([])
    },
  )

  it('reports a parcel the cadastre does not know', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: notFound }])

    const error = await loadParcel(fetch, '33063000KJ9999').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ParcelError)
    expect(error).toMatchObject({ kind: 'not-found', idu: '33063000KJ9999' })
  })
})
