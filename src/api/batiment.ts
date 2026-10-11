import { centroideOf } from '@/lib/geo'
import { loadAltitude } from './altimetrie'
import { fetchJson } from './fetch-json'
import type { BlocLoader } from './loader'

const BDNB = 'https://api.bdnb.io/v1/bdnb'

/** Groupe de bâtiments de la BDNB qui touche la parcelle. */
export interface Batiment {
  id: string
  adresse: string | null
  anneeConstruction: number | null
  /** En mètres. */
  hauteurMoyenne: number | null
  /** Classe A à G du DPE retenu par la BDNB pour le bâtiment. */
  classeDpe: string | null
}

/** Modèle du bloc Bâtiment. */
export interface BatimentBloc {
  batiments: Batiment[]
  /** Millésime de la BDNB, ex. « 2026-02.a ». */
  millesimeBdnb: string | null
  /** Altitude du sol au centroïde de la parcelle, en mètres. */
  altitude: number | null
}

/** Ligne brute de `batiment_groupe_complet/parcelle`, réduite aux colonnes demandées. */
interface BatimentGroupeBdnb {
  batiment_groupe_id: string
  libelle_adr_principale_ban: string | null
  annee_construction: number | null
  hauteur_mean: number | null
  classe_bilan_dpe: string | null
}

/** Ligne brute de `metadonnees/info`. */
interface InfoBdnb {
  publication_schema: string
}

// Sans `select`, chaque ligne pèse 11 Ko (139 colonnes, dont la géométrie).
const COLONNES = [
  'batiment_groupe_id',
  'libelle_adr_principale_ban',
  'annee_construction',
  'hauteur_mean',
  'classe_bilan_dpe',
].join(',')

/** Chargeur du bloc Bâtiment : le bâti de la parcelle selon la BDNB, et son altitude. */
export const loadBatiment: BlocLoader<BatimentBloc> = async (fetch, parcelle, { signal } = {}) => {
  const params = new URLSearchParams({ parcelle_id: `eq.${parcelle.idu}`, select: COLONNES })
  const [groupes, info, altitude] = await Promise.all([
    fetchJson<BatimentGroupeBdnb[]>(fetch, `${BDNB}/donnees/batiment_groupe_complet/parcelle?${params}`, { signal }),
    fetchJson<InfoBdnb[]>(fetch, `${BDNB}/metadonnees/info`, { signal }),
    // L'altitude n'est qu'un complément : son échec (quota de 5 requêtes/s vite atteint)
    // ne doit pas priver le bloc des données du bâtiment.
    loadAltitude(fetch, centroideOf(parcelle.geometrie), { signal }).catch(() => null),
  ])
  return {
    batiments: groupes.map((groupe) => ({
      id: groupe.batiment_groupe_id,
      adresse: groupe.libelle_adr_principale_ban,
      anneeConstruction: groupe.annee_construction,
      hauteurMoyenne: groupe.hauteur_mean,
      classeDpe: groupe.classe_bilan_dpe,
    })),
    millesimeBdnb: millesimeOf(info),
    altitude,
  }
}

/** « api_bdnb_v1_202602a_1 » → « 2026-02.a ». */
function millesimeOf(info: InfoBdnb[]): string | null {
  const match = info[0]?.publication_schema.match(/_(\d{4})(\d{2})([a-z])_/)
  return match ? `${match[1]}-${match[2]}.${match[3]}` : null
}
