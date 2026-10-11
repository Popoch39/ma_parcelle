import type { SourceSpecification } from 'maplibre-gl'

/** Zones des documents d'urbanisme, dessinées par le WMS du Géoportail de l'Urbanisme. */
export const ZONAGE_SOURCE_ID = 'zonage'

// Des images de 512 px divisent par quatre les requêtes (le WMS plafonne à 50 par seconde) et
// coupent moins souvent les étiquettes des zones, que le serveur dessine dans chaque image.
const TILE_SIZE = 512

export const ZONAGE_SOURCES: Record<string, SourceSpecification> = {
  [ZONAGE_SOURCE_ID]: {
    type: 'raster',
    tiles: [
      `https://data.geopf.fr/wms-v/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=zone_secteur&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=${TILE_SIZE}&HEIGHT=${TILE_SIZE}&FORMAT=image/png&TRANSPARENT=true`,
    ],
    tileSize: TILE_SIZE,
    attribution: '© Géoportail de l’Urbanisme',
  },
}
