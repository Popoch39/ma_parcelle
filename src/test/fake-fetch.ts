import type { Fetch } from '@/api/fetch-json'

/**
 * Réponse rejouée par le faux `fetch`. `body` est une fixture JSON réelle, enregistrée telle
 * quelle (et tronquée au strict nécessaire) depuis la vraie API, rangée dans
 * `src/api/__fixtures__/<source>/<cas>.json`.
 */
export interface FakeRoute {
  /** Sous-chaîne ou motif de l'URL demandée. La première route qui correspond répond. */
  match: string | RegExp
  /** Corps JSON, ignoré quand `text` est fourni. */
  body?: unknown
  /** Corps brut, pour une réponse qui n'est pas du JSON (corps vide, CSV…). */
  text?: string
  status?: number
}

export interface FakeFetch extends Fetch {
  /** URL demandées, dans l'ordre : on peut les vérifier quand elles font partie du contrat. */
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
    // Une URL inattendue doit faire échouer le test bruyamment, comme une panne réseau.
    if (!route) throw new TypeError(`Aucune fixture pour ${url}`)
    if (route.text !== undefined) return new Response(route.text, { status: route.status ?? 200 })
    return new Response(JSON.stringify(route.body), {
      status: route.status ?? 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return Object.assign(fetch, { calls })
}
