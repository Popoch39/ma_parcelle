import type { MultiPolygon } from 'geojson'
import { centroidOf, distanceBetween, bboxOf, squareAround, type LonLat } from '@/lib/geo'
import type { Mutation, PropertyType } from '@/lib/sales'
import { fetchJson } from '../fetch-json'
import type { SalesSource } from './source'

const GEOMUTATIONS = 'https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/'

// Cold, the first page of a dense neighborhood took 32 s to come; the next ones, 1 to 3 s.
const TIMEOUT_MS = 45_000

/** Raw response of `geomutations`, reduced to the fields read. */
interface CeremaGeomutations {
  /** Next page, in `http://`. */
  next: string | null
  features: Array<{
    /** Parcels of the mutation. */
    geometry: MultiPolygon
    properties: {
      idmutinvar: string
      datemut: string
      libnatmut: string
      /** Decimal as a string, e.g. "330000.00". */
      valeurfonc: string | null
      sbati: string
      sterr: string
      /** Cerema property typology, e.g. "121" (UN APPARTEMENT). */
      codtypbien: string
    }
  }>
}

/**
 * Main source: the Cerema "DVF open data" API, queried on a square containing
 * the neighborhood circle.
 */
export const cerema: SalesSource = {
  id: 'cerema',
  load: async (fetch, { center, radius, since }, { signal } = {}) => {
    // The API refuses a bbox wider than 0.02° per side: a 1 km square fits everywhere in France.
    const bbox = bboxOf(squareAround(center, radius))
    const params = new URLSearchParams({
      in_bbox: bbox.map((degrees) => degrees.toFixed(6)).join(','),
      anneemut_min: String(since),
      page_size: '500',
    })
    const mutations: Mutation[] = []
    let url: string | null = `${GEOMUTATIONS}?${params}`
    while (url) {
      const page: CeremaGeomutations = await fetchJson<CeremaGeomutations>(fetch, url, {
        signal,
        timeoutMs: TIMEOUT_MS,
      })
      mutations.push(...page.features.map((feature) => mutationOf(feature, center)))
      // Followed as is, the http link would be blocked by the browser (mixed content).
      url = page.next?.replace(/^http:/, 'https:') ?? null
    }
    return mutations
  },
}

function mutationOf({ geometry, properties }: CeremaGeomutations['features'][number], center: LonLat): Mutation {
  return {
    id: properties.idmutinvar,
    date: properties.datemut,
    nature: properties.libnatmut,
    type: typeOf(properties.codtypbien),
    price: properties.valeurfonc === null ? null : Number(properties.valeurfonc),
    builtArea: Number(properties.sbati) || null,
    landArea: Number(properties.sterr) || null,
    position: positionOf(geometry, center),
  }
}

/** Cerema typology (1 built, 11 house, 12 apartment, 13 outbuilding, 14 business, 15 mixed, 2 unbuilt). */
function typeOf(codtypbien: string): PropertyType {
  if (codtypbien === '111') return 'house'
  if (codtypbien === '121') return 'apartment'
  if (codtypbien.startsWith('11')) return 'houses'
  // 122 "DEUX APPARTEMENTS", 120 "APPARTEMENT INDETERMINE": three apartments or more.
  if (codtypbien.startsWith('12')) return 'apartments'
  if (codtypbien.startsWith('13')) return 'outbuilding'
  if (codtypbien.startsWith('14')) return 'commercial'
  if (codtypbien === '151') return 'dwellings'
  if (codtypbien.startsWith('15')) return 'mixed'
  if (codtypbien.startsWith('2')) return 'land'
  return 'unknown'
}

/**
 * Centroid of the mutation parcel closest to the center. A mutation can group parcels far
 * from one another (a house and a wood 20 km away): their common centroid would fall on
 * none of them.
 */
function positionOf(geometry: MultiPolygon, center: LonLat): LonLat {
  const points = geometry.coordinates.map((coordinates) => centroidOf({ type: 'Polygon', coordinates }))
  return points.reduce((closest, point) =>
    distanceBetween(center, point) < distanceBetween(center, closest) ? point : closest,
  )
}
