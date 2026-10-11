import type { MultiPolygon } from 'geojson'
import { centroideOf, distanceBetween, empriseOf, squareAround, type LonLat } from '@/lib/geo'
import type { Mutation, TypeBien } from '@/lib/ventes'
import { fetchJson } from '../fetch-json'
import type { VentesSource } from './source'

const GEOMUTATIONS = 'https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/'

// À froid, la première page d'un quartier dense a mis 32 s à venir ; les suivantes, 1 à 3 s.
const TIMEOUT_MS = 45_000

/** Réponse brute de `geomutations`, réduite aux champs lus. */
interface GeomutationsCerema {
  /** Page suivante, en `http://`. */
  next: string | null
  features: Array<{
    /** Parcelles de la mutation. */
    geometry: MultiPolygon
    properties: {
      idmutinvar: string
      datemut: string
      libnatmut: string
      /** Décimal en chaîne, ex. « 330000.00 ». */
      valeurfonc: string | null
      sbati: string
      sterr: string
      /** Typologie des biens du Cerema, ex. « 121 » (UN APPARTEMENT). */
      codtypbien: string
    }
  }>
}

/**
 * Source principale : l'API « DVF open data » du Cerema, interrogée sur un carré qui contient
 * le cercle du voisinage.
 */
export const cerema: VentesSource = {
  id: 'cerema',
  charger: async (fetch, { centre, rayon, depuis }, { signal } = {}) => {
    // L'API refuse une emprise de plus de 0,02° de côté : un carré de 1 km y tient partout en France.
    const emprise = empriseOf(squareAround(centre, rayon))
    const params = new URLSearchParams({
      in_bbox: emprise.map((degres) => degres.toFixed(6)).join(','),
      anneemut_min: String(depuis),
      page_size: '500',
    })
    const mutations: Mutation[] = []
    let url: string | null = `${GEOMUTATIONS}?${params}`
    while (url) {
      const page: GeomutationsCerema = await fetchJson<GeomutationsCerema>(fetch, url, {
        signal,
        timeoutMs: TIMEOUT_MS,
      })
      mutations.push(...page.features.map((feature) => mutationOf(feature, centre)))
      // Suivi tel quel, le lien en http serait bloqué par le navigateur (contenu mixte).
      url = page.next?.replace(/^http:/, 'https:') ?? null
    }
    return mutations
  },
}

function mutationOf({ geometry, properties }: GeomutationsCerema['features'][number], centre: LonLat): Mutation {
  return {
    id: properties.idmutinvar,
    date: properties.datemut,
    nature: properties.libnatmut,
    type: typeOf(properties.codtypbien),
    prix: properties.valeurfonc === null ? null : Number(properties.valeurfonc),
    surfaceBatie: Number(properties.sbati) || null,
    surfaceTerrain: Number(properties.sterr) || null,
    position: positionOf(geometry, centre),
  }
}

/** Typologie du Cerema (1 bâti, 11 maison, 12 appartement, 13 dépendance, 14 activité, 15 mixte, 2 non bâti). */
function typeOf(codtypbien: string): TypeBien {
  if (codtypbien === '111') return 'maison'
  if (codtypbien === '121') return 'appartement'
  if (codtypbien.startsWith('11')) return 'maisons'
  // 122 « DEUX APPARTEMENTS », 120 « APPARTEMENT INDETERMINE » : trois appartements ou plus.
  if (codtypbien.startsWith('12')) return 'appartements'
  if (codtypbien.startsWith('13')) return 'dependance'
  if (codtypbien.startsWith('14')) return 'local'
  if (codtypbien === '151') return 'logements'
  if (codtypbien.startsWith('15')) return 'mixte'
  if (codtypbien.startsWith('2')) return 'terrain'
  return 'indetermine'
}

/**
 * Centroïde de la parcelle de la mutation la plus proche du centre. Une mutation peut réunir des
 * parcelles éloignées les unes des autres (une maison et un bois à 20 km) : leur centroïde
 * commun ne tomberait sur aucune d'elles.
 */
function positionOf(geometrie: MultiPolygon, centre: LonLat): LonLat {
  const points = geometrie.coordinates.map((coordinates) => {
    const [lon, lat] = centroideOf({ type: 'Polygon', coordinates })
    return { lon, lat }
  })
  return points.reduce((plusProche, point) =>
    distanceBetween(centre, point) < distanceBetween(centre, plusProche) ? point : plusProche,
  )
}
