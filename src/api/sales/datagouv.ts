import { circleAround, distanceBetween, type LonLat } from '@/lib/geo'
import { parseCsv } from '@/lib/csv'
import type { Mutation, PropertyType } from '@/lib/sales'
import { fetchJson, fetchText } from '../fetch-json'
import type { SalesSource } from './source'

const API_CARTO_DIVISION = 'https://apicarto.ign.fr/api/cadastre/division'
const DVF_CSV = 'https://dvf-api.data.gouv.fr/dvf/csv/'

// The service handles the sections one after the other: the 28 sections of a Paris neighborhood
// took 46 s to all answer.
const TIMEOUT_MS = 60_000

/** Raw response of API Carto `cadastre/division`: one cadastral sheet per feature. */
interface DivisionApiCarto {
  features: Array<{
    properties: {
      code_insee: string
      /** "000" outside Paris, Lyon and Marseille. */
      code_arr: string
      com_abs: string
      section: string
    }
  }>
}

/** A row of the DVF CSV: one premises, or one land-use type, of a mutation. */
type DvfRow = Record<string, string>

/**
 * Fallback source: dvf-api.data.gouv.fr, which can only be queried section by section. We
 * ask the cadastre for the sections touching the neighborhood, then the sales of each.
 */
export const datagouv: SalesSource = {
  id: 'datagouv',
  load: async (fetch, { center, radius, since }, { signal } = {}) => {
    const circle = circleAround(center, radius)
    const geom = {
      type: 'Polygon',
      // Beyond six decimals (10 cm), the digits only lengthen the URL.
      coordinates: circle.coordinates.map((ring) => ring.map((point) => point.map((degrees) => Number(degrees.toFixed(6))))),
    }
    const division = await fetchJson<DivisionApiCarto>(
      fetch,
      `${API_CARTO_DIVISION}?${new URLSearchParams({ geom: JSON.stringify(geom) })}`,
      { signal },
    )
    const sections = new Set(division.features.map(({ properties }) => sectionOf(properties)))
    const csvs = await Promise.all(
      [...sections].map((section) =>
        fetchText(fetch, `${DVF_CSV}?${new URLSearchParams({ section })}`, { signal, timeoutMs: TIMEOUT_MS }),
      ),
    )
    // One row per premises or per land use: the rows of a same mutation are grouped by its
    // identifier, including across sections.
    const mutations = new Map<string, DvfRow[]>()
    for (const row of csvs.flatMap(parseCsv)) {
      if (row.date_mutation < `${since}-01-01`) continue
      mutations.set(row.id_mutation, [...(mutations.get(row.id_mutation) ?? []), row])
    }
    return [...mutations.values()].flatMap((rows) => {
      const mutation = mutationOf(rows, center)
      return mutation ? [mutation] : []
    })
  },
}

/** Section key of the service: INSEE code (of the district in Paris, Lyon, Marseille), prefix, section. */
function sectionOf({ code_insee, code_arr, com_abs, section }: DivisionApiCarto['features'][number]['properties']) {
  const municipality = code_arr === '000' ? code_insee : `${code_insee.slice(0, 2)}${code_arr}`
  return `${municipality}${com_abs}${section}`
}

/**
 * The CSV crosses the premises and the land-use types of a same parcel: a premises repeats
 * on each land use, a land use on each premises. We count each of them once.
 */
function unique(rows: DvfRow[], key: (row: DvfRow) => string[]): DvfRow[] {
  return [...new Map(rows.map((row) => [key(row).join('|'), row])).values()]
}

/** The mutation described by its rows, or `null` if none is geolocated. */
function mutationOf(rows: DvfRow[], center: LonLat): Mutation | null {
  const positions = rows
    .filter((row) => row.longitude && row.latitude)
    .map((row) => ({ lon: Number(row.longitude), lat: Number(row.latitude) }))
  if (positions.length === 0) return null
  const premises = unique(
    rows.filter((row) => row.type_local),
    (row) => [row.id_parcelle, row.type_local, row.lot1_numero, row.surface_reelle_bati, row.nombre_pieces_principales],
  )
  const landUses = unique(
    rows.filter((row) => row.surface_terrain),
    (row) => [row.id_parcelle, row.code_nature_culture, row.surface_terrain],
  )
  const [first] = rows
  return {
    id: first.id_mutation,
    date: first.date_mutation,
    nature: first.nature_mutation,
    type: typeOf(premises, landUses.length > 0),
    price: first.valeur_fonciere ? Number(first.valeur_fonciere) : null,
    builtArea: sum(premises.map((item) => item.surface_reelle_bati)),
    landArea: sum(landUses.map((landUse) => landUse.surface_terrain)),
    position: positions.reduce((closest, point) =>
      distanceBetween(center, point) < distanceBetween(center, closest) ? point : closest,
    ),
  }
}

function typeOf(premises: DvfRow[], land: boolean): PropertyType {
  const count = (type: string) => premises.filter((item) => item.type_local === type).length
  const houses = count('Maison')
  const apartments = count('Appartement')
  const commercial = premises.length - houses - apartments - count('Dépendance')
  const dwellings = houses + apartments
  if (commercial > 0) return dwellings > 0 ? 'mixed' : 'commercial'
  if (dwellings === 1) return houses ? 'house' : 'apartment'
  if (dwellings > 1) return !apartments ? 'houses' : !houses ? 'apartments' : 'dwellings'
  if (premises.length > 0) return 'outbuilding'
  return land ? 'land' : 'unknown'
}

/** Sum of the filled-in areas, `null` if none is. */
function sum(areas: string[]): number | null {
  const total = areas.reduce((acc, area) => acc + (Number(area) || 0), 0)
  return total || null
}
