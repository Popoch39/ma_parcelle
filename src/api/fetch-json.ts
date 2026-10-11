/** The injected `fetch` function: the loaders' only test seam. */
export type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export type ApiErrorKind = 'http' | 'timeout' | 'aborted' | 'network' | 'invalid-json'

// Beyond this, better to show the block's error and its link to the source than to leave
// a skeleton forever on a slow public API.
const DEFAULT_TIMEOUT_MS = 15_000

export interface FetchJsonOptions {
  /** Cancellation by the caller, typically the `signal` provided by TanStack Query. */
  signal?: AbortSignal
  timeoutMs?: number
}

/** Failed call to a public API, typed so that each block picks its own message. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly url: string
  /** HTTP status, only for `kind: 'http'`. */
  readonly status?: number

  constructor(kind: ApiErrorKind, url: string, options: { status?: number; cause?: unknown } = {}) {
    super(`${kind}${options.status ? ` ${options.status}` : ''} on ${url}`, { cause: options.cause })
    this.name = 'ApiError'
    this.kind = kind
    this.url = url
    this.status = options.status
  }
}

/**
 * GET a public API URL and read its JSON body.
 * `T` describes the expected raw shape of the response; it is not validated at runtime.
 */
export async function fetchJson<T>(fetch: Fetch, url: string, options: FetchJsonOptions = {}): Promise<T> {
  return fetchBody(fetch, url, (response) => response.json(), options)
}

/** GET a public API URL and read its body as text (CSV…), same errors as `fetchJson`. */
export async function fetchText(fetch: Fetch, url: string, options: FetchJsonOptions = {}): Promise<string> {
  return fetchBody(fetch, url, (response) => response.text(), options)
}

/**
 * Like `fetchJson`, for an API that responds 200 with an empty body when it has nothing to
 * say (Géorisques `rga`): then returns `null`.
 */
export async function fetchJsonOrEmpty<T>(fetch: Fetch, url: string, options: FetchJsonOptions = {}): Promise<T | null> {
  return fetchBody(
    fetch,
    url,
    async (response) => {
      const text = await response.text()
      return text.trim() === '' ? null : JSON.parse(text)
    },
    options,
  )
}

async function fetchBody<T>(
  fetch: Fetch,
  url: string,
  read: (response: Response) => Promise<T>,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: FetchJsonOptions,
): Promise<T> {
  const timeout = AbortSignal.timeout(timeoutMs)
  // Cancellation interrupts both waiting for the headers and reading the body.
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
    // fetch does not tell offline, DNS and CORS refusal apart: all of them throw a TypeError.
    throw failure(cause, 'network')
  }
  if (!response.ok) throw new ApiError('http', url, { status: response.status })
  try {
    return await read(response)
  } catch (cause) {
    // A connection dropped while reading the body throws a TypeError, not a SyntaxError.
    throw failure(cause, cause instanceof SyntaxError ? 'invalid-json' : 'network')
  }
}
