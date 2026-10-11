import { useSelectionStore } from './selection-store'

const PARAM = 'parcelle'

function iduFromUrl(): string | null {
  // A URL retyped by hand may be lowercase or keep spaces.
  return new URLSearchParams(window.location.search).get(PARAM)?.trim().toUpperCase() || null
}

/** Address that opens this parcel's report, on the same app as `base` (by default, the current page). */
export function reportUrl(idu: string, base = window.location.href): string {
  const url = new URL('?', base)
  url.searchParams.set(PARAM, idu)
  return url.href
}

/**
 * Syncs the selection store with `?parcelle=<IDU>`, without a router: the URL opens the report,
 * each new selection creates a history entry, back and forward replay it.
 * Returns the function that stops the sync.
 */
export function syncSelectionWithUrl(): () => void {
  const { select, clear } = useSelectionStore.getState()
  const applyUrl = () => {
    const idu = iduFromUrl()
    if (idu) select(idu, { reframe: true })
    else clear()
  }
  applyUrl()

  const unsubscribe = useSelectionStore.subscribe(({ idu }) => {
    // Already in the URL: the selection comes from the URL itself (load or history).
    if (idu === iduFromUrl()) return
    const url = new URL(window.location.href)
    if (idu) url.searchParams.set(PARAM, idu)
    else url.searchParams.delete(PARAM)
    window.history.pushState(null, '', url)
  })
  window.addEventListener('popstate', applyUrl)

  return () => {
    unsubscribe()
    window.removeEventListener('popstate', applyUrl)
  }
}
