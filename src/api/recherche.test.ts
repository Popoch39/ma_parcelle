import { describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { resolveAdresse, resolveSearch, SearchError, suggestAdresses } from './recherche'
import bordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import introuvable from './__fixtures__/cadastre/parcelle-introuvable.json'
import lyon from './__fixtures__/cadastre/parcelle-lyon-69382-ab-62.json'
import marseilleSansPrefixe from './__fixtures__/cadastre/parcelle-marseille-13201-0b-100-sans-prefixe.json'
import marseille804 from './__fixtures__/cadastre/parcelle-marseille-13201-804-0b-100.json'
import paris from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'
import communeBordeaux from './__fixtures__/geocodage/commune-bordeaux.json'
import communeIntrouvable from './__fixtures__/geocodage/commune-introuvable.json'
import communeParis7e from './__fixtures__/geocodage/commune-paris-7e.json'
import pointKj33 from './__fixtures__/cadastre/point-bordeaux-33063-kj-33.json'
import pointSegur from './__fixtures__/cadastre/point-paris-75107-bq-3.json'
import adresseSegur from './__fixtures__/geocodage/search-20-avenue-de-segur.json'
import adresseSainteCatherine from './__fixtures__/geocodage/search-12-rue-sainte-catherine-bordeaux.json'
import pointVoirie from './__fixtures__/cadastre/point-voirie-sainte-catherine.json'
import carreVoirie from './__fixtures__/cadastre/carre-voirie-sainte-catherine.json'
import autocompleteSegur from './__fixtures__/geocodage/autocomplete-20-avenue-de-segur.json'
import adresseIntrouvable from'./__fixtures__/geocodage/search-introuvable.json'
import pointOcean from './__fixtures__/cadastre/point-ocean.json'
import carreOcean from './__fixtures__/cadastre/carre-ocean.json'

/** La géométrie envoyée à API Carto, décodée : longitude d'abord, comme en GeoJSON. */
const geomOf = (url: string): unknown => JSON.parse(new URL(url).searchParams.get('geom') ?? 'null')

describe('suggestAdresses', () => {
  it('propose les adresses du géocodeur au fil de la frappe', async () => {
    const fetch = fakeFetch([{ match: 'geocodage/search', body: autocompleteSegur }])

    const suggestions = await suggestAdresses(fetch, '20 avenue de ségur')

    expect(fetch.calls).toEqual([
      'https://data.geopf.fr/geocodage/search?q=20+avenue+de+s%C3%A9gur&autocomplete=1&limit=5',
    ])
    expect(suggestions).toEqual([
      {
        id: '75107_8909_00020',
        label: '20 Avenue de Ségur 75007 Paris',
        contexte: '75, Paris, Île-de-France',
        point: { lon: 2.308628, lat: 48.850699 },
      },
      {
        id: '19121_0099_00020',
        label: '20 Avenue de Ségur 19210 Lubersac',
        contexte: '19, Corrèze, Nouvelle-Aquitaine',
        point: { lon: 1.382978, lat: 45.444566 },
      },
      {
        id: '75115_8909',
        label: 'Avenue de Ségur 75015 Paris',
        contexte: '75, Paris, Île-de-France',
        point: { lon: 2.305635, lat: 48.847421 },
      },
    ])
  })

  it.each(['33063 KJ 33', 'Bordeaux KJ 33', '33063000KJ0033', '44.8405, -0.5737', 'ab'])(
    'ne suggère rien pour « %s », qui n’est pas une adresse',
    async (saisie) => {
      const fetch = fakeFetch([])

      expect(await suggestAdresses(fetch, saisie)).toEqual([])
      expect(fetch.calls).toEqual([])
    },
  )
})

describe('resolveSearch', () => {
  it('reconnaît un IDU, même en minuscules, et renvoie sa parcelle', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: bordeaux }])

    const parcelle = await resolveSearch(fetch, ' 33063000kj0033 ')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=33063&com_abs=000&section=KJ&numero=0033',
    ])
    expect(parcelle).toMatchObject({ idu: '33063000KJ0033', referenceCadastrale: '33063 KJ 33' })
  })

  it('reconnaît une référence cadastrale par code INSEE et complète section et numéro', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: bordeaux }])

    const parcelle = await resolveSearch(fetch, '33063 kj 33')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=33063&section=KJ&numero=0033',
    ])
    expect(parcelle).toMatchObject({
      idu: '33063000KJ0033',
      contenance: 131,
      commune: { nom: 'Bordeaux', codeInsee: '33063' },
    })
    expect(parcelle.emprise).toEqual([-0.57376242, 44.84035853, -0.57365078, 44.84051416])
  })

  it('reconnaît une référence cadastrale par nom de commune et trouve son code INSEE', async () => {
    const fetch = fakeFetch([
      { match: 'geocodage/search', body: communeBordeaux },
      { match: 'cadastre/parcelle', body: bordeaux },
    ])

    const parcelle = await resolveSearch(fetch, 'Bordeaux KJ 33')

    expect(fetch.calls).toEqual([
      'https://data.geopf.fr/geocodage/search?q=Bordeaux&type=municipality&limit=1',
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=33063&section=KJ&numero=0033',
    ])
    expect(parcelle.idu).toBe('33063000KJ0033')
  })

  it.each(['44.8405, -0.5737', '44,8405 -0,5737', '44.8405;-0.5737'])(
    'reconnaît les coordonnées « latitude, longitude » « %s » et renvoie la parcelle qui contient le point',
    async (saisie) => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle?geom=', body: pointKj33 }])

      const parcelle = await resolveSearch(fetch, saisie)

      expect(fetch.calls.map(geomOf)).toEqual([{ type: 'Point', coordinates: [-0.5737, 44.8405] }])
      expect(parcelle.idu).toBe('33063000KJ0033')
    },
  )

  it('géocode une adresse et renvoie la parcelle qui contient son point, pas celle au centroïde le plus proche', async () => {
    const fetch = fakeFetch([
      { match: 'geocodage/search', body: adresseSegur },
      { match: 'cadastre/parcelle?geom=', body: pointSegur },
    ])

    const parcelle = await resolveSearch(fetch, '20 avenue de Ségur Paris')

    expect(fetch.calls[0]).toBe('https://data.geopf.fr/geocodage/search?q=20+avenue+de+S%C3%A9gur+Paris&limit=1')
    expect(geomOf(fetch.calls[1])).toEqual({ type: 'Point', coordinates: [2.308628, 48.850699] })
    expect(parcelle).toMatchObject({ idu: '75107000BQ0003', contenance: 8215 })
  })

  it('se rabat sur la parcelle la plus proche quand le point de l’adresse tombe sur la voirie', async () => {
    const fetch = fakeFetch([
      { match: 'geocodage/search', body: adresseSainteCatherine },
      { match: /geom=.*Point/, body: pointVoirie },
      { match: /geom=.*Polygon/, body: carreVoirie },
    ])

    const parcelle = await resolveSearch(fetch, '12 rue Sainte-Catherine Bordeaux')

    // Le carré de recherche reste petit (40 m de côté) et centré sur le point de l'adresse.
    const carre = geomOf(fetch.calls[2]) as { type: string; coordinates: number[][][] }
    expect(carre.type).toBe('Polygon')
    const [ouest, sud] = carre.coordinates[0][0]
    const [est, nord] = carre.coordinates[0][2]
    expect((ouest + est) / 2).toBeCloseTo(-0.574364, 6)
    expect((sud + nord) / 2).toBeCloseTo(44.841405, 6)
    expect((nord - sud) * 111_320).toBeCloseTo(40, 0)
    // Parmi les 4 parcelles du carré, KM 275 borde le point (à moins d'1 m), KN 162 est à 8,5 m.
    expect(parcelle.idu).toBe('33063000KM0275')
  })

  describe('saisie qui ne désigne aucune parcelle', () => {
    it('signale une référence cadastrale inconnue du cadastre', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: introuvable }])

      const error = await resolveSearch(fetch, '33063 KJ 9999').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({ message: 'Le cadastre ne connaît aucune parcelle « 33063 KJ 9999 ».' })
    })

    it('signale une commune introuvable sans interroger le cadastre', async () => {
      const fetch = fakeFetch([{ match: 'geocodage/search', body: communeIntrouvable }])

      const error = await resolveSearch(fetch, 'Zzyzxqw AB 12').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({ message: 'Aucune commune ne s’appelle « Zzyzxqw ».' })
      expect(fetch.calls).toHaveLength(1)
    })

    it('signale une adresse que le géocodeur ne connaît pas', async () => {
      const fetch = fakeFetch([{ match: 'geocodage/search', body: adresseIntrouvable }])

      const error = await resolveSearch(fetch, 'Xqzwv kjhgf').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({ message: 'Aucune adresse ne correspond à « Xqzwv kjhgf ».' })
      expect(fetch.calls).toHaveLength(1)
    })

    it('signale des coordonnées qu’aucune parcelle ne contient, sans chercher de parcelle voisine', async () => {
      const fetch = fakeFetch([
        { match: /geom=.*Point/, body: pointVoirie },
        { match: /geom=.*Polygon/, body: carreVoirie },
      ])

      // Le point de l'adresse du 12 rue Sainte-Catherine, sur la voirie, saisi en coordonnées.
      const error = await resolveSearch(fetch, '44.841405, -0.574364').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({
        message:
          'Aucune parcelle ne contient ce point : voirie, cours d’eau ou hors du cadastre. Vérifiez les coordonnées, ou choisissez la parcelle sur la carte.',
      })
      expect(fetch.calls.map(geomOf)).toEqual([{ type: 'Point', coordinates: [-0.574364, 44.841405] }])
    })

    it('signale une adresse dont aucune parcelle n’entoure le point, même aux abords', async () => {
      const fetch = fakeFetch([
        { match: /geom=.*Point/, body: pointOcean },
        { match: /geom=.*Polygon/, body: carreOcean },
      ])

      const error = await resolveAdresse(fetch, { lon: -30, lat: 45 }).catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({ message: 'Aucune parcelle cadastrée à cet endroit.' })
    })

    it.each(['', '  ', 'ab', '-- '])('refuse la saisie trop courte « %s » sans appel réseau', async (saisie) => {
      const fetch = fakeFetch([])

      const error = await resolveSearch(fetch, saisie).catch((e: unknown) => e)

      expect(error).toBeInstanceOf(SearchError)
      expect(error).toMatchObject({
        message: 'Saisissez une adresse, une référence cadastrale (33063 AB 123), un IDU ou des coordonnées.',
      })
      expect(fetch.calls).toEqual([])
    })

    it('signale un IDU inconnu du cadastre', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: introuvable }])

      const error = await resolveSearch(fetch, '33063000KJ9999').catch((e: unknown) => e)

      expect(error).toMatchObject({ message: 'Le cadastre ne connaît aucune parcelle 33063000KJ9999.' })
    })
  })

  describe('à Paris, Lyon et Marseille', () => {
    it('interroge Paris par code commune et code d’arrondissement, l’arrondissement étant donné par son nom', async () => {
      const fetch = fakeFetch([
        { match: 'geocodage/search', body: communeParis7e },
        { match: 'cadastre/parcelle', body: paris },
      ])

      const parcelle = await resolveSearch(fetch, 'Paris 7e BQ 3')

      expect(fetch.calls).toEqual([
        'https://data.geopf.fr/geocodage/search?q=Paris+7e&type=municipality&limit=1',
        'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=75056&code_arr=107&section=BQ&numero=0003',
      ])
      expect(parcelle).toMatchObject({
        idu: '75107000BQ0003',
        arrondissement: { nom: 'Paris 7e arrondissement', codeInsee: '75107' },
      })
    })

    it('interroge Lyon par code commune et code d’arrondissement', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: lyon }])

      const parcelle = await resolveSearch(fetch, '69382 AB 62')

      expect(fetch.calls).toEqual([
        'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=69123&code_arr=382&section=AB&numero=0062',
      ])
      expect(parcelle.idu).toBe('69382000AB0062')
    })

    it('interroge Marseille avec le préfixe de quartier saisi et complète la section à une lettre', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: marseille804 }])

      const parcelle = await resolveSearch(fetch, '13201 804 B 100')

      expect(fetch.calls).toEqual([
        'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=13055&code_arr=201&com_abs=804&section=0B&numero=0100',
      ])
      expect(parcelle).toMatchObject({ idu: '132018040B0100', referenceCadastrale: '13201 804 0B 100' })
    })

    it('demande le préfixe quand plusieurs quartiers de Marseille ont la même section et le même numéro', async () => {
      const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: marseilleSansPrefixe }])

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
