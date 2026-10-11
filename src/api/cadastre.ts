import type { MultiPolygon } from 'geojson'
import { bboxOf, type BBox } from '@/lib/geo'
import { districtOf, formatCadastralReference, parseIdu } from '@/lib/idu'
import { fetchJson, type Fetch } from './fetch-json'
import type { LoadOptions } from './loader'

const API_CARTO_PARCEL = 'https://apicarto.ign.fr/api/cadastre/parcelle'

/** Parcel as the cadastre describes it: this is the Cadastre block's model. */
export interface Parcel {
  idu: string
  /** Designation used in deeds, e.g. « 33063 KJ 33 ». */
  cadastralReference: string
  /** Cadastral area, in m². */
  area: number
  municipality: { name: string; inseeCode: string }
  /** Only in Paris, Lyon and Marseille. */
  district: { name: string; inseeCode: string } | null
  prefix: string
  section: string
  sheet: number
  number: string
  geometry: MultiPolygon
  bbox: BBox
}

export type ParcelErrorKind = 'invalid-idu' | 'not-found'

/** Parcel that cannot be designated. The message is shown as is in the report. */
export class ParcelError extends Error {
  readonly kind: ParcelErrorKind
  readonly idu: string

  constructor(kind: ParcelErrorKind, idu: string) {
    super(
      kind === 'invalid-idu'
        ? `« ${idu} » n’est pas un IDU valide (14 caractères, ex. 75107000BQ0003).`
        : `Le cadastre ne connaît aucune parcelle ${idu}.`,
    )
    this.name = 'ParcelError'
    this.kind = kind
    this.idu = idu
  }
}

/** Raw response of API Carto `cadastre/parcelle`. */
interface ParcelApiCarto {
  features: Array<{
    geometry: MultiPolygon
    properties: {
      idu: string
      nom_com: string
      code_insee: string
      com_abs: string
      section: string
      feuille: number
      numero: string
      contenance: number
    }
  }>
}

/**
 * Loader of the Cadastre block: the parcel designated by its IDU. The other blocks start from
 * the parcel it returns (see `BlockLoader`).
 */
export async function loadParcel(fetch: Fetch, idu: string, { signal }: LoadOptions = {}): Promise<Parcel> {
  const parts = parseIdu(idu)
  if (!parts) throw new ParcelError('invalid-idu', idu)
  const parcels = await findParcels(fetch, referenceParams(parts), { signal })
  const parcel = parcels.find((candidate) => candidate.idu === idu)
  if (!parcel) throw new ParcelError('not-found', idu)
  return parcel
}

/**
 * API Carto parameters of a cadastral reference. An absorbed municipality may reuse the
 * same section and the same number: without a prefix, all those of the municipality respond.
 */
export function referenceParams({ inseeCode, prefix, section, number }: {
  inseeCode: string
  prefix: string | null
  section: string
  number: string
}): URLSearchParams {
  const district = districtOf(inseeCode)
  const params = new URLSearchParams(
    district
      ? { code_insee: district.municipalityCode, code_arr: district.districtCode }
      : { code_insee: inseeCode },
  )
  if (prefix) params.set('com_abs', prefix)
  params.set('section', section)
  params.set('numero', number)
  return params
}

/**
 * Parcels that API Carto returns for these parameters: by reference (`code_insee`,
 * `code_arr`, `com_abs`, `section`, `numero`) or by geometry (`geom`).
 */
export async function findParcels(
  fetch: Fetch,
  params: URLSearchParams,
  { signal }: LoadOptions = {},
): Promise<Parcel[]> {
  const body = await fetchJson<ParcelApiCarto>(fetch, `${API_CARTO_PARCEL}?${params}`, { signal })
  return body.features.map(parcelOf)
}

function parcelOf(feature: ParcelApiCarto['features'][number]): Parcel {
  const { properties } = feature
  const parts = parseIdu(properties.idu)
  if (!parts) throw new ParcelError('invalid-idu', properties.idu)
  const district = districtOf(parts.inseeCode)
  return {
    idu: properties.idu,
    cadastralReference: formatCadastralReference(parts),
    area: properties.contenance,
    municipality: { name: properties.nom_com, inseeCode: properties.code_insee },
    district: district && {
      name: `${properties.nom_com} ${district.number}${district.number === 1 ? 'er' : 'e'} arrondissement`,
      inseeCode: district.inseeCode,
    },
    prefix: properties.com_abs,
    section: properties.section,
    sheet: properties.feuille,
    number: properties.numero,
    geometry: feature.geometry,
    bbox: bboxOf(feature.geometry),
  }
}
