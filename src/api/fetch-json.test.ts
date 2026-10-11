import { describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { ApiError, fetchJson, type Fetch } from './fetch-json'
import invalidInseeCode from './__fixtures__/cadastre/parcelle-invalid-insee-code-400.json'
import segur from './__fixtures__/geocoding/search-20-avenue-de-segur.json'

const GEOCODING = 'https://data.geopf.fr/geocodage/search?q=20%20avenue%20de%20S%C3%A9gur%20Paris&limit=1'

describe('fetchJson', () => {
  it('returns the JSON body of the response', async () => {
    const fetch = fakeFetch([{ match: 'geocodage/search', body: segur }])

    const body = await fetchJson<typeof segur>(fetch, GEOCODING)

    expect(body.features[0].properties.label).toBe('20 Avenue de Ségur 75007 Paris')
    expect(fetch.calls).toEqual([GEOCODING])
  })

  it('rejects an HTTP error response with an "http" ApiError carrying the status', async () => {
    const url = 'https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=abc'
    const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: invalidInseeCode, status: 400 }])

    const error = await fetchJson(fetch, url).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'http', status: 400, url })
  })

  it('gives up on the request after the timeout and rejects with a "timeout" ApiError', async () => {
    const error = await fetchJson(silentFetch, GEOCODING, { timeoutMs: 10 }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'timeout', url: GEOCODING })
  })

  it('stops when the caller cancels and rejects with an "aborted" ApiError', async () => {
    const controller = new AbortController()

    const pending = fetchJson(silentFetch, GEOCODING, { signal: controller.signal }).catch((e: unknown) => e)
    controller.abort()
    const error = await pending

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'aborted', url: GEOCODING })
  })

  it('rejects a network failure (offline, CORS refusal) with a "network" ApiError', async () => {
    const offlineFetch: Fetch = async () => {
      throw new TypeError('Failed to fetch')
    }

    const error = await fetchJson(offlineFetch, GEOCODING).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'network', url: GEOCODING })
  })

  it('rejects a body that is not JSON (maintenance page) with an "invalid-json" ApiError', async () => {
    const maintenanceFetch: Fetch = async () =>
      new Response('<!doctype html><title>Maintenance</title>', { headers: { 'content-type': 'text/html' } })

    const error = await fetchJson(maintenanceFetch, GEOCODING).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'invalid-json', url: GEOCODING })
  })
})

/** An API that never responds: the request only ends if it is cancelled. */
const silentFetch: Fetch = (_input, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
  })
