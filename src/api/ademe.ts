import { centroidOf, containsPoint } from '@/lib/geo'
import { fetchJson, type Fetch } from './fetch-json'
import type { BlockLoader } from './loader'

const LINES = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines'

/** Grade of a DPE, from A (efficient) to G. */
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export const GRADES: readonly Grade[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

/** DPE of a dwelling. */
export interface Dpe {
  number: string
  /** Issue date, YYYY-MM-DD. */
  date: string
  /** Energy grade. */
  energyGrade: Grade | null
  /** Climate grade (greenhouse gas emissions). */
  climateGrade: Grade | null
  /** Living area of the dwelling, in m². */
  livingArea: number | null
  address: string | null
  /** Distance to the parcel center in meters, for a neighborhood DPE. */
  distance: number | null
}

/** Model of the DPE block. */
export interface DpeBlock {
  /** The DPEs are those of the parcel or, when the parcel has none, those of its neighborhood. */
  scope: 'parcel' | 'neighborhood'
  dpes: Dpe[]
  /** Count of DPEs per energy grade, from A to G (all seven, even at zero). */
  distribution: Array<{ grade: Grade; count: number }>
  /**
   * Pagination stopped before the end: rows read out of the total announced by ADEME (DPEs of
   * the parcel bbox, or of the neighborhood). Null when everything was read.
   */
  limit: { read: number; total: number | null } | null
}

/** Raw row of `dpe03existant/lines`, reduced to the requested columns. */
interface DpeRow {
  numero_dpe: string
  date_etablissement_dpe: string
  etiquette_dpe?: string
  etiquette_ges?: string
  surface_habitable_logement?: number
  adresse_ban?: string
  /** "lat,lon": latitude first. */
  _geopoint: string
  _geo_distance?: number
}

/** Page of `dpe03existant/lines`. */
interface DpePage {
  /** Row count of the query, only on the first page. */
  total: number | null
  /** Next page, as is (`after` cursor), missing on the last page. */
  next?: string | null
  results: DpeRow[]
}

/** Neighborhood radius, in meters. */
export const NEIGHBORHOOD_RADIUS = 100

const PAGE_SIZE = '100'
// Beyond 300 DPEs, the list teaches nothing more to someone looking at a parcel, and each page
// costs one more request.
const MAX_PAGES = 3

const COLUMNS = [
  'numero_dpe',
  'date_etablissement_dpe',
  'etiquette_dpe',
  'etiquette_ges',
  'surface_habitable_logement',
  'adresse_ban',
  '_geopoint',
].join(',')

/** Loader of the DPE block: the DPEs of the parcel's dwellings, or failing that of its neighborhood, from ADEME. */
export const loadDpe: BlockLoader<DpeBlock> = async (fetch, parcel, { signal } = {}) => {
  const bbox = await rowsOf(
    fetch,
    new URLSearchParams({ bbox: parcel.bbox.join(','), size: PAGE_SIZE, sort: '-date_etablissement_dpe', select: COLUMNS }),
    signal,
  )
  // The bbox overflows the parcel: only the DPEs whose point falls inside count.
  const inParcel = bbox.rows.filter((row) => containsPoint(parcel.geometry, pointOf(row)))
  if (inParcel.length > 0) return blockOf('parcel', inParcel.map(dpeOf), bbox.limit)

  // Sorted by distance by default: if the limit is hit, the farthest ones are missing.
  const { lon, lat } = centroidOf(parcel.geometry)
  const neighborhood = await rowsOf(
    fetch,
    new URLSearchParams({ geo_distance: `${lon},${lat},${NEIGHBORHOOD_RADIUS}m`, size: PAGE_SIZE, select: COLUMNS }),
    signal,
  )
  return blockOf('neighborhood', neighborhood.rows.map(dpeOf), neighborhood.limit)
}

function blockOf(scope: DpeBlock['scope'], dpes: Dpe[], limit: DpeBlock['limit']): DpeBlock {
  const distribution = GRADES.map((grade) => ({
    grade,
    count: dpes.filter(({ energyGrade }) => energyGrade === grade).length,
  }))
  return { scope, dpes, distribution, limit }
}

/** Rows of a query, following the pages up to `MAX_PAGES`. */
async function rowsOf(fetch: Fetch, params: URLSearchParams, signal: AbortSignal | undefined) {
  const first = await fetchJson<DpePage>(fetch, `${LINES}?${params}`, { signal })
  const rows = [...first.results]
  let next = first.next
  for (let pages = 1; next && pages < MAX_PAGES; pages++) {
    const page = await fetchJson<DpePage>(fetch, next, { signal })
    rows.push(...page.results)
    next = page.next
  }
  // `total` is only given on the first page (null afterwards).
  return { rows, limit: next ? { read: rows.length, total: first.total } : null }
}

function pointOf({ _geopoint }: DpeRow) {
  const [lat, lon] = _geopoint.split(',').map(Number)
  return { lon, lat }
}

function dpeOf(row: DpeRow): Dpe {
  return {
    number: row.numero_dpe,
    date: row.date_etablissement_dpe,
    energyGrade: gradeOf(row.etiquette_dpe),
    climateGrade: gradeOf(row.etiquette_ges),
    livingArea: row.surface_habitable_logement ?? null,
    address: row.adresse_ban ?? null,
    distance: row._geo_distance ?? null,
  }
}

function gradeOf(value: string | undefined): Grade | null {
  return GRADES.find((grade) => grade === value) ?? null
}
