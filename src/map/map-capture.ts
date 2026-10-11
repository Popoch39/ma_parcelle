import type { Map as MapLibreMap } from 'maplibre-gl'
import type { BBox } from '@/lib/geo'
import { captureFrame, keepCurrentView, printZoom } from '@/lib/print'
import type { PrintedMap } from '@/stores/ui-store'
import { PCI_ZOOM_MIN } from './layers/pci-source'

/**
 * Aspect ratio of the printed map (width / height): the full width of an A4 page, over a little
 * more than a third of its height, to leave the summary on the first page.
 */
export const MAP_ASPECT_RATIO = 3 / 2

// Gap between the parcel and the image edge when we must zoom out to show it whole.
const MARGIN = 32

/**
 * Keeps the current view if the parcel is highlighted in it and inside the printed image; otherwise,
 * centers the map on it, at the current view zoom as long as it fits whole and highlighted.
 * Returns a way to go back to the previous view.
 */
export function frameForPrint(map: MapLibreMap, bbox: BBox): () => void {
  const before = { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() }
  const { clientWidth, clientHeight } = map.getContainer()
  const frame = captureFrame({ width: clientWidth, height: clientHeight }, MAP_ASPECT_RATIO)
  const parcelCenter = map.project([(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2])
  if (keepCurrentView({ zoom: before.zoom, highlightZoom: PCI_ZOOM_MIN, parcelCenter, frame })) return () => {}
  const camera = map.cameraForBounds(bbox, {
    padding: { top: frame.y + MARGIN, bottom: frame.y + MARGIN, left: frame.x + MARGIN, right: frame.x + MARGIN },
    bearing: before.bearing,
  })
  // Without a camera (screen smaller than the margins), we keep the current zoom.
  const wholeParcel = camera?.zoom ?? before.zoom
  map.jumpTo({
    center: camera?.center ?? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
    zoom: printZoom({ current: before.zoom, wholeParcel, highlightZoom: PCI_ZOOM_MIN }),
  })
  return () => map.jumpTo(before)
}

/**
 * Waits until the map has finished loading its style and tiles, or until `signal` aborts:
 * the map is then captured as it is.
 */
export function mapSettled(map: MapLibreMap, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      map.off('idle', done)
      signal.removeEventListener('abort', done)
      resolve()
    }
    map.on('idle', done)
    signal.addEventListener('abort', done)
    // An already settled map no longer redraws and would never emit `idle` again.
    map.triggerRepaint()
  })
}

/**
 * Image of the central part of the map, in the print aspect ratio, with its attributions. Null if
 * the browser refuses to copy it.
 */
export function captureMap(map: MapLibreMap): PrintedMap | null {
  // Without `preserveDrawingBuffer`, the WebGL image is only readable right after drawing it.
  map.redraw()
  const source = map.getCanvas()
  const frame = captureFrame({ width: source.width, height: source.height }, MAP_ASPECT_RATIO)
  const copy = document.createElement('canvas')
  copy.width = frame.width
  copy.height = frame.height
  const context = copy.getContext('2d')
  if (!context) return null
  context.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height)
  return {
    image: copy.toDataURL('image/jpeg', 0.92),
    // The attribution control already keeps the attributions of the displayed sources up to date, as text.
    attribution: map.getContainer().querySelector('.maplibregl-ctrl-attrib-inner')?.textContent?.trim() ?? '',
  }
}
