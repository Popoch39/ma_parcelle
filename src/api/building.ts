import { centroidOf } from '@/lib/geo'
import { loadAltitude } from './elevation'
import { fetchJson } from './fetch-json'
import type { BlockLoader } from './loader'

const BDNB = 'https://api.bdnb.io/v1/bdnb'

/** BDNB building group touching the parcel. */
export interface Building {
  id: string
  address: string | null
  constructionYear: number | null
  /** In meters. */
  meanHeight: number | null
  /** Class A to G of the DPE the BDNB retains for the building. */
  dpeClass: string | null
}

/** Model of the Building block. */
export interface BuildingBlock {
  buildings: Building[]
  /** BDNB vintage, e.g. "2026-02.a". */
  bdnbVintage: string | null
  /** Ground altitude at the parcel centroid, in meters. */
  altitude: number | null
}

/** Raw row of `batiment_groupe_complet/parcelle`, reduced to the requested columns. */
interface BdnbBuildingGroup {
  batiment_groupe_id: string
  libelle_adr_principale_ban: string | null
  annee_construction: number | null
  hauteur_mean: number | null
  classe_bilan_dpe: string | null
}

/** Raw row of `metadonnees/info`. */
interface BdnbInfo {
  publication_schema: string
}

// Without `select`, each row weighs 11 KB (139 columns, including the geometry).
const COLUMNS = [
  'batiment_groupe_id',
  'libelle_adr_principale_ban',
  'annee_construction',
  'hauteur_mean',
  'classe_bilan_dpe',
].join(',')

/** Loader of the Building block: the parcel's buildings according to the BDNB, and its altitude. */
export const loadBuilding: BlockLoader<BuildingBlock> = async (fetch, parcel, { signal } = {}) => {
  const params = new URLSearchParams({ parcelle_id: `eq.${parcel.idu}`, select: COLUMNS })
  const [groups, info, altitude] = await Promise.all([
    fetchJson<BdnbBuildingGroup[]>(fetch, `${BDNB}/donnees/batiment_groupe_complet/parcelle?${params}`, { signal }),
    fetchJson<BdnbInfo[]>(fetch, `${BDNB}/metadonnees/info`, { signal }),
    // The altitude is only a complement: its failure (quota of 5 requests/s quickly reached)
    // must not deprive the block of the building data.
    loadAltitude(fetch, centroidOf(parcel.geometry), { signal }).catch(() => null),
  ])
  return {
    buildings: groups.map((group) => ({
      id: group.batiment_groupe_id,
      address: group.libelle_adr_principale_ban,
      constructionYear: group.annee_construction,
      meanHeight: group.hauteur_mean,
      dpeClass: group.classe_bilan_dpe,
    })),
    bdnbVintage: vintageOf(info),
    altitude,
  }
}

/** "api_bdnb_v1_202602a_1" → "2026-02.a". */
function vintageOf(info: BdnbInfo[]): string | null {
  const match = info[0]?.publication_schema.match(/_(\d{4})(\d{2})([a-z])_/)
  return match ? `${match[1]}-${match[2]}.${match[3]}` : null
}
