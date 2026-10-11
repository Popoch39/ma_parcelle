import type { SourceSpecification } from 'maplibre-gl'

/** Vector tiles of the IGN cadastral plan (PCI), shared by the Parcels and Selection layers. */
export const PCI_SOURCE_ID = 'pci'

/** Tile layer carrying the parcels and their attributes (`idu`, `section`, `contenance`…). */
export const PCI_PARCEL_LAYER = 'parcelle'

/** Lowest layer of the Parcels layers: an overlay that must stay below the parcels is placed under it. */
export const PARCELS_HIT_LAYER = 'parcels-click'

/** Zoom from which parcels exist, and so the selection is highlighted. */
export const PCI_ZOOM_MIN = 15

export const PCI_SOURCES: Record<string, SourceSpecification> = {
  [PCI_SOURCE_ID]: {
    type: 'vector',
    tiles: ['https://data.geopf.fr/tms/1.0.0/PCI/{z}/{x}/{y}.pbf'],
    // The server answers 404 beyond 19.
    minzoom: PCI_ZOOM_MIN,
    maxzoom: 19,
    // Tile features have no identifier: the IDU stands in for it.
    promoteId: { [PCI_PARCEL_LAYER]: 'idu' },
    attribution: '© IGN – Plan cadastral',
  },
}
