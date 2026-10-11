import type { LonLat } from '@/lib/geo'
import { fetchJson, type Fetch } from './fetch-json'
import type { LoadOptions } from './loader'

const ELEVATION = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json'

// Value returned outside the DTM coverage, at sea for instance.
const NO_DATA = -99999

/** Raw response of the IGN elevation service with `zonly=true`. */
interface IgnElevation {
  elevations: number[]
}

/** Ground altitude at a point, in meters, according to RGE ALTI; null outside coverage. */
export async function loadAltitude(
  fetch: Fetch,
  { lon, lat }: LonLat,
  { signal }: LoadOptions = {},
): Promise<number | null> {
  const params = new URLSearchParams({
    // Beyond 7 decimals (1 cm), the precision would be illusory.
    lon: lon.toFixed(7),
    lat: lat.toFixed(7),
    // Without a resource, the API answers 405.
    resource: 'ign_rge_alti_wld',
    zonly: 'true',
  })
  const { elevations } = await fetchJson<IgnElevation>(fetch, `${ELEVATION}?${params}`, { signal })
  const z = elevations[0]
  return z === undefined || z === NO_DATA ? null : z
}
