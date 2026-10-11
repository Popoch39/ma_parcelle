import type { Fetch } from '@/api/fetch-json'

/**
 * Response replayed by the fake `fetch`. `body` is a real fixture, recorded as is
 * (and trimmed to the bare minimum) from the real API, stored in
 * `src/api/__fixtures__/<source>/<case>.<json|csv>`: an object is served as JSON, a string
 * (CSV imported with `?raw`, error page) as is.
 */
export interface FakeRoute {
  /** Substring or pattern of the requested URL. The first matching route responds. */
  match: string | RegExp
  body: unknown
  status?: number
}

export interface FakeFetch extends Fetch {
  /** Requested URLs, in order: they can be checked when they are part of the contract. */
  calls: string[]
}

export function fakeFetch(routes: FakeRoute[]): FakeFetch {
  const calls: string[] = []
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input)
    calls.push(url)
    init?.signal?.throwIfAborted()
    const route = routes.find(({ match }) =>
      typeof match === 'string' ? url.includes(match) : match.test(url),
    )
    // An unexpected URL must make the test fail loudly, like a network outage.
    if (!route) throw new TypeError(`No fixture for ${url}`)
    if (typeof route.body === 'string') return new Response(route.body, { status: route.status ?? 200 })
    return new Response(JSON.stringify(route.body), {
      status: route.status ?? 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return Object.assign(fetch, { calls })
}
