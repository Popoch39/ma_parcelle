import { describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { resolveAddress, resolveSearch, SearchError, suggestAddresses } from './search'
import bordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import notFound from './__fixtures__/cadastre/parcelle-not-found.json'
import lyon from './__fixtures__/cadastre/parcelle-lyon-69382-ab-62.json'
import marseilleNoPrefix from './__fixtures__/cadastre/parcelle-marseille-13201-0b-100-no-prefix.json'
import marseille804 from './__fixtures__/cadastre/parcelle-marseille-13201-804-0b-100.json'
import paris from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'
import municipalityBordeaux from './__fixtures__/geocoding/municipality-bordeaux.json'
import municipalityNotFound from './__fixtures__/geocoding/municipality-not-found.json'
import municipalityParis7e from './__fixtures__/geocoding/municipality-paris-7e.json'
import pointKj33 from './__fixtures__/cadastre/point-bordeaux-33063-kj-33.json'
import pointSegur from './__fixtures__/cadastre/point-paris-75107-bq-3.json'
import addressSegur from './__fixtures__/geocoding/search-20-avenue-de-segur.json'
import addressSainteCatherine from './__fixtures__/geocoding/search-12-rue-sainte-catherine-bordeaux.json'
import pointRoad from './__fixtures__/cadastre/point-road-sainte-catherine.json'
import squareRoad from './__fixtures__/cadastre/square-road-sainte-catherine.json'
import autocompleteSegur from './__fixtures__/geocoding/autocomplete-20-avenue-de-segur.json'
import addressNotFound from'./__fixtures__/geocoding/search-not-found.json'
import pointOcean from './__fixtures__/cadastre/point-ocean.json'
import squareOcean from './__fixtures__/cadastre/square-ocean.json'

/** The geometry sent to API Carto, decoded: longitude first, as in GeoJSON. */
const geomOf = (url: string): unknown => JSON.parse(new URL(url).searchParams.get('geom') ?? 'null')

describe('suggestAddresses', () => {
  it('suggests the geocoder addresses while typing', async () => {
    const fetch = fakeFetch([{ match: 'geocodage/search', body: autocompleteSegur }])

    const suggestions = await suggestAddresses(fetch, '20 avenue de ségur')

    expect(fetch.calls).toEqual([
      'https://data.geopf.fr/geocodage/search?q=20+avenue+de+s%C3%A9gur&autocomplete=1&limit=5',
    ])
    expect(suggestions).toEqual([
      {
        id: '75107_8909_00020',
        label: '20 Avenue de Ségur 75007 Paris',
        context: '75, Paris, Île-de-France',
        point: { lon: 2.308628, lat: 48.850699 },
      },
      {
        id: '19121_0099_00020',
        label: '20 Avenue de Ségur 19210 Lubersac',
        context: '19, Corrèze, Nouvelle-Aquitaine',
        point: { lon: 1.382978, lat: 45.444566 },
      },
      {
        id: '75115_8909',
        label: 'Avenue de Ségur 75015 Paris',
        context: '75, Paris, Île-de-France',
        point: { lon: 2.305635, lat: 48.847421 },
      },
    ])
  })

  it.each(['33063 KJ 33', 'Bordeaux KJ 33', '33063000KJ0033', '44.8405, -0.5737', 'ab'])(
    'suggests nothing for "%s", which is not an address',
    async (input) => {
      const fetch = fakeFetch([])

      expect(await suggestAddresses(fetch, input)).toEqual([])
      expect(fetch.calls).toEqual([])
    },
  )
})

describe('resolveSearch', () => {
  it('recognizes an IDU, even in lowercase, and returns its parcel', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: bordeaux }])

    const parcel = await resolveSearch(fetch, ' 33063000kj0033 ')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=33063&com_abs=000&section=KJ&numero=0033',
    ])
    expect(parcel).toMatchObject({ idu: '33063000KJ0033', cadastralReference: '33063 KJ 33' })
  })

  it('recognizes a cadastral reference by INSEE code and pads section and number', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: bordeaux }])

    const parcel = await resolveSearch(fetch, '33063 kj 33')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=33063&section=KJ&numero=0033',
    ])
    expect(parcel).toMatchObject({
      idu: '33063000KJ0033',
      area: 131,
      municipality: { name: 'Bordeaux', inseeCode: '33063' },
    })
    expect(parcel.bbox).toEqual([-0.57376242, 44.84035853, -0.57365078, 44.84051416])
  })

  it('recognizes a cadastral reference by municipality name and finds its INSEE code', async () => {
    const fetch = fakeFetch([
      { match: 'geocodage/search', body: municipalityBordeaux },
      { match: 'cadastre/parcelle', body: bordeaux },
    ])

    const parcel = await resolveSearch(fetch, 'Bordeaux KJ 33')

    expect(fetch.calls).toEqual([
      'https://data.geopf.fr/geocodage/search?q=Bordeaux&type=municipality&limit=1',
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=33063&section=KJ&numero=0033',
    ])
    expect(parcel.idu).toBe('33063000KJ0033')
  })

  it.each(['44.8405, -0.5737', '44,8405 -0,5737', '44.8405;-0.5737'])(
    'recognizes the "latitude, longitude" coordinates "%s" and returns the parcel containing the point',
    async (input) => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle?geom=', body: pointKj33 }])

      const parcel = await resolveSearch(fetch, input)

      expect(fetch.calls.map(geomOf)).toEqual([{ type: 'Point', coordinates: [-0.5737, 44.8405] }])
      expect(parcel.idu).toBe('33063000KJ0033')
    },
  )

  it('geocodes an address and returns the parcel containing its point, not the one with the closest centroid', async () => {
    const fetch = fakeFetch([
      { match: 'geocodage/search', body: addressSegur },
      { match: 'cadastre/parcelle?geom=', body: pointSegur },
    ])

    const parcel = await resolveSearch(fetch, '20 avenue de Ségur Paris')

    expect(fetch.calls[0]).toBe('https://data.geopf.fr/geocodage/search?q=20+avenue+de+S%C3%A9gur+Paris&limit=1')
    expect(geomOf(fetch.calls[1])).toEqual({ type: 'Point', coordinates: [2.308628, 48.850699] })
    expect(parcel).toMatchObject({ idu: '75107000BQ0003', area: 8215 })
  })

  it('falls back to the closest parcel when the address point falls on the road', async () => {
    const fetch = fakeFetch([
      { match: 'geocodage/search', body: addressSainteCatherine },
      { match: /geom=.*Point/, body: pointRoad },
      { match: /geom=.*Polygon/, body: squareRoad },
    ])

    const parcel = await resolveSearch(fetch, '12 rue Sainte-Catherine Bordeaux')

    // The search square stays small (40 m side) and centered on the address point.
    const square = geomOf(fetch.calls[2]) as { type: string; coordinates: number[][][] }
    expect(square.type).toBe('Polygon')
    const [west, south] = square.coordinates[0][0]
    const [east, north] = square.coordinates[0][2]
    expect((west + east) / 2).toBeCloseTo(-0.574364, 6)
    expect((south + north) / 2).toBeCloseTo(44.841405, 6)
    expect((north - south) * 111_320).toBeCloseTo(40, 0)
    // Among the 4 parcels of the square, KM 275 borders the point (less than 1 m), KN 162 is 8.5 m away.
    expect(parcel.idu).toBe('33063000KM0275')
  })

  describe('input that designates no parcel', () => {
    it('reports a cadastral reference unknown to the cadastre', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: notFound }])

      const error = await resolveSearch(fetch, '33063 KJ 9999').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({ message: 'Le cadastre ne connaît aucune parcelle « 33063 KJ 9999 ».' })
    })

    it('reports a municipality not found without querying the cadastre', async () => {
      const fetch = fakeFetch([{ match: 'geocodage/search', body: municipalityNotFound }])

      const error = await resolveSearch(fetch, 'Zzyzxqw AB 12').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({ message: 'Aucune commune ne s’appelle « Zzyzxqw ».' })
      expect(fetch.calls).toHaveLength(1)
    })

    it('reports an address the geocoder does not know', async () => {
      const fetch = fakeFetch([{ match: 'geocodage/search', body: addressNotFound }])

      const error = await resolveSearch(fetch, 'Xqzwv kjhgf').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({ message: 'Aucune adresse ne correspond à « Xqzwv kjhgf ».' })
      expect(fetch.calls).toHaveLength(1)
    })

    it('reports coordinates no parcel contains, without looking for a neighboring parcel', async () => {
      const fetch = fakeFetch([
        { match: /geom=.*Point/, body: pointRoad },
        { match: /geom=.*Polygon/, body: squareRoad },
      ])

      // The address point of 12 rue Sainte-Catherine, on the road, typed as coordinates.
      const error = await resolveSearch(fetch, '44.841405, -0.574364').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({
        message:
          'Aucune parcelle ne contient ce point : voirie, cours d’eau ou hors du cadastre. Vérifiez les coordonnées, ou choisissez la parcelle sur la carte.',
      })
      expect(fetch.calls.map(geomOf)).toEqual([{ type: 'Point', coordinates: [-0.574364, 44.841405] }])
    })

    it('reports an address whose point no parcel surrounds, even nearby', async () => {
      const fetch = fakeFetch([
        { match: /geom=.*Point/, body: pointOcean },
        { match: /geom=.*Polygon/, body: squareOcean },
      ])

      const error = await resolveAddress(fetch, { lon: -30, lat: 45 }).catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({ message: 'Aucune parcelle cadastrée à cet endroit.' })
    })

    it.each(['', '  ', 'ab', '-- '])('rejects the too short input "%s" without a network call', async (input) => {
      const fetch = fakeFetch([])

      const error = await resolveSearch(fetch, input).catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({
        message: 'Saisissez une adresse, une référence cadastrale (33063 AB 123), un IDU ou des coordonnées.',
      })
      expect(fetch.calls).toEqual([])
    })

    it('reports an IDU unknown to the cadastre', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: notFound }])

      const error = await resolveSearch(fetch, '33063000KJ9999').catch((e: unknown) => e)

      expect(error).toMatchObject({ message: 'Le cadastre ne connaît aucune parcelle 33063000KJ9999.' })
    })
  })

  describe('in Paris, Lyon and Marseille', () => {
    it('queries Paris by municipality code and district code, the district being given by its name', async () => {
      const fetch = fakeFetch([
        { match: 'geocodage/search', body: municipalityParis7e },
        { match: 'cadastre/parcelle', body: paris },
      ])

      const parcel = await resolveSearch(fetch, 'Paris 7e BQ 3')

      expect(fetch.calls).toEqual([
        'https://data.geopf.fr/geocodage/search?q=Paris+7e&type=municipality&limit=1',
        'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=75056&code_arr=107&section=BQ&numero=0003',
      ])
      expect(parcel).toMatchObject({
        idu: '75107000BQ0003',
        district: { name: 'Paris 7e arrondissement', inseeCode: '75107' },
      })
    })

    it('queries Lyon by municipality code and district code', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: lyon }])

      const parcel = await resolveSearch(fetch, '69382 AB 62')

      expect(fetch.calls).toEqual([
        'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=69123&code_arr=382&section=AB&numero=0062',
      ])
      expect(parcel.idu).toBe('69382000AB0062')
    })

    it('queries Marseille with the typed quarter prefix and pads the one-letter section', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: marseille804 }])

      const parcel = await resolveSearch(fetch, '13201 804 B 100')

      expect(fetch.calls).toEqual([
        'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=13055&code_arr=201&com_abs=804&section=0B&numero=0100',
      ])
      expect(parcel).toMatchObject({ idu: '132018040B0100', cadastralReference: '13201 804 0B 100' })
    })

    it('asks for the prefix when several Marseille quarters have the same section and number', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: marseilleNoPrefix }])

      const error = await resolveSearch(fetch, '13201 0B 100').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({
        message:
          'Plusieurs parcelles correspondent : 13201 801 0B 100, 13201 802 0B 100, 13201 803 0B 100, ' +
          '13201 804 0B 100, 13201 806 0B 100. Précisez le préfixe ou l’arrondissement.',
      })
    })
  })
})
