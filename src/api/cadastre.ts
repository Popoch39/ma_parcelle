import type { MultiPolygon } from 'geojson'
import { empriseOf, type Emprise } from '@/lib/geo'
import { arrondissementOf, formatReferenceCadastrale, parseIdu } from '@/lib/idu'
import { fetchJson, type Fetch } from './fetch-json'
import type { LoadOptions } from './loader'

const API_CARTO_PARCELLE = 'https://apicarto.ign.fr/api/cadastre/parcelle'

/** Parcelle telle que le cadastre la décrit : c'est le modèle du bloc Cadastre. */
export interface Parcelle {
  idu: string
  /** Désignation des actes, ex. « 33063 KJ 33 ». */
  referenceCadastrale: string
  /** Surface cadastrale, en m². */
  contenance: number
  commune: { nom: string; codeInsee: string }
  /** Seulement à Paris, Lyon et Marseille. */
  arrondissement: { nom: string; codeInsee: string } | null
  prefixe: string
  section: string
  feuille: number
  numero: string
  geometrie: MultiPolygon
  emprise: Emprise
}

export type ParcelleErrorKind = 'idu-invalide' | 'introuvable'

/** Parcelle impossible à désigner. Le message s'affiche tel quel dans la fiche. */
export class ParcelleError extends Error {
  readonly kind: ParcelleErrorKind
  readonly idu: string

  constructor(kind: ParcelleErrorKind, idu: string) {
    super(
      kind === 'idu-invalide'
        ? `« ${idu} » n’est pas un IDU valide (14 caractères, ex. 75107000BQ0003).`
        : `Le cadastre ne connaît aucune parcelle ${idu}.`,
    )
    this.name = 'ParcelleError'
    this.kind = kind
    this.idu = idu
  }
}

/** Réponse brute d'API Carto `cadastre/parcelle`. */
interface ParcelleApiCarto {
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
 * Chargeur du bloc Cadastre : la parcelle désignée par son IDU. Les autres blocs partent de
 * la parcelle qu'il renvoie (voir `BlocLoader`).
 */
export async function loadParcelle(fetch: Fetch, idu: string, { signal }: LoadOptions = {}): Promise<Parcelle> {
  const parts = parseIdu(idu)
  if (!parts) throw new ParcelleError('idu-invalide', idu)
  const arrondissement = arrondissementOf(parts.codeInsee)
  const params = new URLSearchParams(
    arrondissement
      ? { code_insee: arrondissement.codeCommune, code_arr: arrondissement.codeArr }
      : { code_insee: parts.codeInsee },
  )
  // Une commune absorbée peut réutiliser la même section et le même numéro : le préfixe
  // les distingue.
  params.set('com_abs', parts.prefixe)
  params.set('section', parts.section)
  params.set('numero', parts.numero)
  const body = await fetchJson<ParcelleApiCarto>(fetch, `${API_CARTO_PARCELLE}?${params}`, { signal })
  const feature = body.features.find(({ properties }) => properties.idu === idu)
  if (!feature) throw new ParcelleError('introuvable', idu)
  const { properties } = feature
  return {
    idu: properties.idu,
    referenceCadastrale: formatReferenceCadastrale(parts),
    contenance: properties.contenance,
    commune: { nom: properties.nom_com, codeInsee: properties.code_insee },
    arrondissement: arrondissement && {
      nom: `${properties.nom_com} ${arrondissement.rang}${arrondissement.rang === 1 ? 'er' : 'e'} arrondissement`,
      codeInsee: arrondissement.codeInsee,
    },
    prefixe: properties.com_abs,
    section: properties.section,
    feuille: properties.feuille,
    numero: properties.numero,
    geometrie: feature.geometry,
    emprise: empriseOf(feature.geometry),
  }
}
