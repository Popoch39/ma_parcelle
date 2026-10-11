import type { LonLat } from '@/lib/geo'
import { fetchJson, type Fetch } from './fetch-json'
import type { LoadOptions } from './loader'

const ELEVATION = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json'

// Valeur renvoyée hors de la couverture du MNT, en mer par exemple.
const SANS_DONNEE = -99999

/** Réponse brute de l'altimétrie IGN avec `zonly=true`. */
interface ElevationIgn {
  elevations: number[]
}

/** Altitude du sol en un point, en mètres, d'après le RGE ALTI ; null hors couverture. */
export async function loadAltitude(
  fetch: Fetch,
  { lon, lat }: LonLat,
  { signal }: LoadOptions = {},
): Promise<number | null> {
  const params = new URLSearchParams({
    // Au-delà de 7 décimales (1 cm), la précision serait illusoire.
    lon: lon.toFixed(7),
    lat: lat.toFixed(7),
    // Sans ressource, l'API répond 405.
    resource: 'ign_rge_alti_wld',
    zonly: 'true',
  })
  const { elevations } = await fetchJson<ElevationIgn>(fetch, `${ELEVATION}?${params}`, { signal })
  const z = elevations[0]
  return z === undefined || z === SANS_DONNEE ? null : z
}
