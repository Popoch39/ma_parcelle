import type { Parcel } from './cadastre'
import type { Fetch } from './fetch-json'

export interface LoadOptions {
  /** TanStack Query's `signal`, to pass on to `fetchJson`. */
  signal?: AbortSignal
}

/**
 * Loader of a report block: it receives the injected `fetch` (the test seam) and the
 * parcel already loaded by the Cadastre block, and returns the block's model. It encapsulates
 * the URLs, the calls, the normalization and the fallbacks: the rest of the app never sees the
 * raw API formats.
 */
export type BlockLoader<Model> = (fetch: Fetch, parcel: Parcel, options?: LoadOptions) => Promise<Model>
