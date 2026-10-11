import { describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { loadParcelle, ParcelleError } from './cadastre'
import bordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import introuvable from './__fixtures__/cadastre/parcelle-introuvable.json'
import lyon from './__fixtures__/cadastre/parcelle-lyon-69382-ab-62.json'
import marseille from './__fixtures__/cadastre/parcelle-marseille-13201-804-0b-401.json'
import paris from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'

describe('loadParcelle', () => {
  it('décode l’IDU, interroge le cadastre et renvoie la fiche cadastrale de la parcelle', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: bordeaux }])

    const parcelle = await loadParcelle(fetch, '33063000KJ0033')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=33063&com_abs=000&section=KJ&numero=0033',
    ])
    expect(parcelle).toMatchObject({
      idu: '33063000KJ0033',
      referenceCadastrale: '33063 KJ 33',
      contenance: 131,
      commune: { nom: 'Bordeaux', codeInsee: '33063' },
      arrondissement: null,
      prefixe: '000',
      section: 'KJ',
      feuille: 1,
      numero: '0033',
    })
  })

  it('renvoie la géométrie de la parcelle et son emprise [ouest, sud, est, nord]', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: bordeaux }])

    const parcelle = await loadParcelle(fetch, '33063000KJ0033')

    expect(parcelle.geometrie).toEqual(bordeaux.features[0].geometry)
    expect(parcelle.emprise).toEqual([-0.57376242, 44.84035853, -0.57365078, 44.84051416])
  })

  it('interroge Paris par code commune et code d’arrondissement, et nomme l’arrondissement', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: paris }])

    const parcelle = await loadParcelle(fetch, '75107000BQ0003')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=75056&code_arr=107&com_abs=000&section=BQ&numero=0003',
    ])
    expect(parcelle).toMatchObject({
      idu: '75107000BQ0003',
      referenceCadastrale: '75107 BQ 3',
      contenance: 8215,
      commune: { nom: 'Paris', codeInsee: '75056' },
      arrondissement: { nom: 'Paris 7e arrondissement', codeInsee: '75107' },
    })
  })

  it('interroge Lyon par code commune et code d’arrondissement', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: lyon }])

    const parcelle = await loadParcelle(fetch, '69382000AB0062')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=69123&code_arr=382&com_abs=000&section=AB&numero=0062',
    ])
    expect(parcelle).toMatchObject({
      commune: { nom: 'Lyon', codeInsee: '69123' },
      arrondissement: { nom: 'Lyon 2e arrondissement', codeInsee: '69382' },
    })
  })

  it('interroge Marseille avec le préfixe d’une commune absorbée et le reporte dans la référence', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: marseille }])

    const parcelle = await loadParcelle(fetch, '132018040B0401')

    expect(fetch.calls).toEqual([
      'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=13055&code_arr=201&com_abs=804&section=0B&numero=0401',
    ])
    expect(parcelle).toMatchObject({
      referenceCadastrale: '13201 804 0B 401',
      commune: { nom: 'Marseille', codeInsee: '13055' },
      arrondissement: { nom: 'Marseille 1er arrondissement', codeInsee: '13201' },
      prefixe: '804',
      section: '0B',
      numero: '0401',
    })
  })

  it.each(['', '75107000BQ003', '75107000BQ00030', '75107000bq0003', '75107 000 BQ 0003'])(
    'rejette l’IDU mal formé « %s » sans interroger le cadastre',
    async (idu) => {
      const fetch = fakeFetch([])

      const error = await loadParcelle(fetch, idu).catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ParcelleError)
      expect(error).toMatchObject({ kind: 'idu-invalide', idu })
      expect(fetch.calls).toEqual([])
    },
  )

  it('signale une parcelle que le cadastre ne connaît pas', async () => {
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: introuvable }])

    const error = await loadParcelle(fetch, '33063000KJ9999').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ParcelleError)
    expect(error).toMatchObject({ kind: 'introuvable', idu: '33063000KJ9999' })
  })
})
