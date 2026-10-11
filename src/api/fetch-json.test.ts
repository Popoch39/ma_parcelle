import { describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { ApiError, fetchJson, type Fetch } from './fetch-json'
import codeInseeInvalide from './__fixtures__/cadastre/parcelle-code-insee-invalide-400.json'
import segur from './__fixtures__/geocodage/search-20-avenue-de-segur.json'

const GEOCODAGE = 'https://data.geopf.fr/geocodage/search?q=20%20avenue%20de%20S%C3%A9gur%20Paris&limit=1'

describe('fetchJson', () => {
  it('renvoie le corps JSON de la réponse', async () => {
    const fetch = fakeFetch([{ match: 'geocodage/search', body: segur }])

    const body = await fetchJson<typeof segur>(fetch, GEOCODAGE)

    expect(body.features[0].properties.label).toBe('20 Avenue de Ségur 75007 Paris')
    expect(fetch.calls).toEqual([GEOCODAGE])
  })

  it('rejette une réponse HTTP en erreur avec une ApiError « http » portant le statut', async () => {
    const url = 'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=abc'
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: codeInseeInvalide, status: 400 }])

    const error = await fetchJson(fetch, url).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'http', status: 400, url })
  })

  it('abandonne la requête après le délai et rejette avec une ApiError « timeout »', async () => {
    const error = await fetchJson(silentFetch, GEOCODAGE, { timeoutMs: 10 }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'timeout', url: GEOCODAGE })
  })

  it("s'arrête quand l'appelant annule et rejette avec une ApiError « aborted »", async () => {
    const controller = new AbortController()

    const pending = fetchJson(silentFetch, GEOCODAGE, { signal: controller.signal }).catch((e: unknown) => e)
    controller.abort()
    const error = await pending

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'aborted', url: GEOCODAGE })
  })

  it('rejette un échec réseau (hors ligne, refus CORS) avec une ApiError « network »', async () => {
    const offlineFetch: Fetch = async () => {
      throw new TypeError('Failed to fetch')
    }

    const error = await fetchJson(offlineFetch, GEOCODAGE).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'network', url: GEOCODAGE })
  })

  it('rejette un corps qui n’est pas du JSON (page de maintenance) avec une ApiError « invalid-json »', async () => {
    const maintenanceFetch: Fetch = async () =>
      new Response('<!doctype html><title>Maintenance</title>', { headers: { 'content-type': 'text/html' } })

    const error = await fetchJson(maintenanceFetch, GEOCODAGE).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'invalid-json', url: GEOCODAGE })
  })
})

/** API qui ne répond jamais : la requête ne se termine que si on l'annule. */
const silentFetch: Fetch = (_input, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
  })
