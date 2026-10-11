import type { QueryClient } from '@tanstack/react-query'
import { flushSync } from 'react-dom'
import { captureMap, frameForPrint, mapSettled } from '@/map/map-capture'
import { parcelQuery } from '@/queries/parcel'
import { queryClient } from '@/queries/query-client'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useUiStore } from '@/stores/ui-store'

// Beyond this, the map and blocks are printed as they are: better an incomplete report than
// a button that no longer responds (a slow source can take 45 s to fail).
const MAX_WAIT = 30_000

/**
 * Prepares the report for printing then opens the browser's print dialog: map switched to light,
 * reframed on the parcel only if it is not visible, and captured as an image, blocks loaded,
 * lists expanded. The map view comes back as soon as the capture is done; the rest, when the
 * print dialog closes.
 */
export async function printReport(idu: string): Promise<void> {
  const { printJob, setPrintJob } = useUiStore.getState()
  if (printJob) return
  const { map } = useMapStore.getState()
  const parcel = queryClient.getQueryData(parcelQuery(idu).queryKey)

  const date = new Date()
  setPrintJob({ date, map: null })
  try {
    const signal = AbortSignal.timeout(MAX_WAIT)
    // Lets React mount the printed report and switch the map to light before waiting for it to settle.
    await new Promise((resolve) => setTimeout(resolve))
    const restore = map && parcel ? frameForPrint(map, parcel.bbox) : null
    await Promise.all([map && mapSettled(map, signal), loadingsDone(queryClient, signal)])
    const printedMap = map && captureMap(map)
    restore?.()
    // The image decoded ahead of time is ready when the browser freezes the page to print; the
    // synchronous render has put it there before the call to `print`.
    if (printedMap) await decodedImage(printedMap.image)
    flushSync(() => setPrintJob({ date, map: printedMap }))
    window.print()
  } catch (error) {
    setPrintJob(null)
    throw error
  }
}

/**
 * Tracks prints started by the browser (Ctrl+P, menu) and the end of any print.
 * Without the button, there is no time to prepare the map: it is printed as on screen.
 * Returns the function that stops tracking.
 */
export function trackPrints(): () => void {
  const before = () => {
    const { printJob, setPrintJob } = useUiStore.getState()
    if (printJob || !useSelectionStore.getState().idu) return
    const { map } = useMapStore.getState()
    flushSync(() => setPrintJob({ date: new Date(), map: map && captureMap(map) }))
  }
  const after = () => useUiStore.getState().setPrintJob(null)
  window.addEventListener('beforeprint', before)
  window.addEventListener('afterprint', after)
  return () => {
    window.removeEventListener('beforeprint', before)
    window.removeEventListener('afterprint', after)
  }
}

/** Waits until no block is loading anymore, or until `signal` aborts. */
function loadingsDone(client: QueryClient, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      unsubscribe()
      signal.removeEventListener('abort', done)
      resolve()
    }
    const unsubscribe = client.getQueryCache().subscribe(() => {
      if (client.isFetching() === 0) done()
    })
    signal.addEventListener('abort', done)
    if (client.isFetching() === 0) done()
  })
}

function decodedImage(src: string): Promise<void> {
  const image = new Image()
  image.src = src
  return image.decode()
}
