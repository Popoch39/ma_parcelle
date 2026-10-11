/** La fonction `fetch` injectée : c'est la seule seam de test des chargeurs. */
export type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export type ApiErrorKind = 'http' | 'timeout' | 'aborted' | 'network' | 'invalid-json'

// Au-delà, mieux vaut afficher l'erreur du bloc et son lien vers la source que de laisser
// un squelette indéfiniment sur une API publique lente.
const DEFAULT_TIMEOUT_MS = 15_000

export interface FetchJsonOptions {
  /** Annulation par l'appelant, typiquement le `signal` fourni par TanStack Query. */
  signal?: AbortSignal
  timeoutMs?: number
}

/** Échec d'appel à une API publique, typé pour que chaque bloc choisisse son message. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly url: string
  /** Statut HTTP, seulement pour `kind: 'http'`. */
  readonly status?: number

  constructor(kind: ApiErrorKind, url: string, options: { status?: number; cause?: unknown } = {}) {
    super(`${kind}${options.status ? ` ${options.status}` : ''} sur ${url}`, { cause: options.cause })
    this.name = 'ApiError'
    this.kind = kind
    this.url = url
    this.status = options.status
  }
}

/**
 * GET d'une URL d'API publique et lecture de son corps JSON.
 * `T` décrit la forme brute attendue de la réponse ; elle n'est pas validée à l'exécution.
 */
export function fetchJson<T>(fetch: Fetch, url: string, options: FetchJsonOptions = {}): Promise<T> {
  return fetchBody(fetch, url, options, (response) => response.json())
}

/**
 * Comme `fetchJson`, pour une API qui répond 200 avec un corps vide quand elle n'a rien à
 * dire (Géorisques `rga`) : renvoie alors `null`.
 */
export function fetchJsonOuVide<T>(fetch: Fetch, url: string, options: FetchJsonOptions = {}): Promise<T | null> {
  return fetchBody(fetch, url, options, async (response) => {
    const text = await response.text()
    return text.trim() === '' ? null : JSON.parse(text)
  })
}

async function fetchBody<T>(
  fetch: Fetch,
  url: string,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: FetchJsonOptions,
  read: (response: Response) => Promise<T>,
): Promise<T> {
  const timeout = AbortSignal.timeout(timeoutMs)
  // L'annulation interrompt aussi bien l'attente des en-têtes que la lecture du corps.
  const failure = (cause: unknown, kind: ApiErrorKind) => {
    if (signal?.aborted) return new ApiError('aborted', url, { cause })
    if (timeout.aborted) return new ApiError('timeout', url, { cause })
    return new ApiError(kind, url, { cause })
  }

  let response: Response
  try {
    response = await fetch(url, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (cause) {
    // fetch ne distingue pas hors ligne, DNS et refus CORS : tous lèvent un TypeError.
    throw failure(cause, 'network')
  }
  if (!response.ok) throw new ApiError('http', url, { status: response.status })
  try {
    return await read(response)
  } catch (cause) {
    // Une connexion coupée pendant la lecture du corps lève un TypeError, pas un SyntaxError.
    throw failure(cause, cause instanceof SyntaxError ? 'invalid-json' : 'network')
  }
}
