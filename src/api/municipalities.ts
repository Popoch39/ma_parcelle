import type { Point } from 'geojson'
import type { LonLat } from '@/lib/geo'
import { fetchJson, type Fetch } from './fetch-json.ts'
import type { LoadOptions } from './loader.ts'

// Runs at build time too: see the import rule in src/seo/plugin.ts.

const GEO_API_MUNICIPALITIES = 'https://geo.api.gouv.fr/communes'
const FIELDS = 'nom,code,codesPostaux,centre,population,surface,departement,region'

/** Raw item of the geo.api.gouv.fr municipalities list. */
interface GeoApiMunicipality {
  nom: string
  code: string
  codesPostaux: string[]
  centre?: Point
  /** Absent for the uninhabited overseas territories; 0 for the villages destroyed in 1916. */
  population?: number
  /** In hectares. */
  surface?: number
  departement: { code: string; nom: string }
  region: { code: string; nom: string }
}

/** A municipality, or a district of Paris, Lyon or Marseille, as the cadastre knows them. */
export interface Municipality {
  name: string
  /** For a district, its own code (75107), the one its parcels' IDU start with. */
  inseeCode: string
  postalCodes: string[]
  center: LonLat
  population: number
  /** In hectares. */
  area: number
  department: { code: string; name: string }
  region: { code: string; name: string }
  /** For a district, the INSEE code of its municipality; otherwise null. */
  parentInseeCode: string | null
}

// The municipality each department's districts belong to.
const DISTRICT_PARENTS: Record<string, string> = { '75': '75056', '69': '69123', '13': '13055' }

/**
 * Every current municipality and every district of Paris, Lyon and Marseille, from
 * geo.api.gouv.fr (official geography of the INSEE). Those without a population or a center,
 * the uninhabited territories, are left out.
 */
export async function loadMunicipalities(fetch: Fetch, { signal }: LoadOptions = {}): Promise<Municipality[]> {
  const params = new URLSearchParams({ fields: FIELDS, format: 'json' })
  const districtParams = new URLSearchParams({ type: 'arrondissement-municipal', fields: FIELDS, format: 'json' })
  // The full list weighs about 10 MB: far beyond the default timeout of an interactive call.
  const options = { signal, timeoutMs: 120_000 }
  const [municipalities, districts] = await Promise.all([
    fetchJson<GeoApiMunicipality[]>(fetch, `${GEO_API_MUNICIPALITIES}?${params}`, options),
    fetchJson<GeoApiMunicipality[]>(fetch, `${GEO_API_MUNICIPALITIES}?${districtParams}`, options),
  ])
  return [
    ...municipalities.flatMap((item) => toMunicipality(item, null)),
    ...districts.flatMap((item) => toMunicipality(item, DISTRICT_PARENTS[item.departement.code] ?? null)),
  ]
}

function toMunicipality(item: GeoApiMunicipality, parentInseeCode: string | null): Municipality[] {
  const { centre, population, surface } = item
  if (!centre || population === undefined || surface === undefined) return []
  return [
    {
      // geo.api capitalizes « Paris 7e Arrondissement »; French writes it lowercase.
      name: item.nom.replace(/ Arrondissement$/, ' arrondissement'),
      inseeCode: item.code,
      postalCodes: item.codesPostaux,
      center: { lon: centre.coordinates[0], lat: centre.coordinates[1] },
      population,
      area: surface,
      department: { code: item.departement.code, name: item.departement.nom },
      region: { code: item.region.code, name: item.region.nom },
      parentInseeCode,
    },
  ]
}
