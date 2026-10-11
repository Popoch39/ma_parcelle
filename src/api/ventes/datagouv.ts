import { circleAround, distanceBetween, type LonLat } from '@/lib/geo'
import { parseCsv } from '@/lib/csv'
import type { Mutation, TypeBien } from '@/lib/ventes'
import { fetchJson, fetchText } from '../fetch-json'
import type { VentesSource } from './source'

const API_CARTO_DIVISION = 'https://apicarto.ign.fr/api/cadastre/division'
const DVF_CSV = 'https://dvf-api.data.gouv.fr/dvf/csv/'

// Le service traite les sections l'une après l'autre : les 28 sections d'un quartier parisien
// ont mis 46 s à toutes répondre.
const TIMEOUT_MS = 60_000

/** Réponse brute d'API Carto `cadastre/division` : une feuille cadastrale par objet. */
interface DivisionApiCarto {
  features: Array<{
    properties: {
      code_insee: string
      /** « 000 » hors de Paris, Lyon et Marseille. */
      code_arr: string
      com_abs: string
      section: string
    }
  }>
}

/** Une ligne du CSV DVF : un local, ou une nature de culture, d'une mutation. */
type LigneDvf = Record<string, string>

/**
 * Source de secours : dvf-api.data.gouv.fr, qui ne se consulte que section par section. On
 * demande au cadastre les sections qui touchent le voisinage, puis les ventes de chacune.
 */
export const datagouv: VentesSource = {
  id: 'datagouv',
  charger: async (fetch, { centre, rayon, depuis }, { signal } = {}) => {
    const cercle = circleAround(centre, rayon)
    const geom = {
      type: 'Polygon',
      // Au-delà de six décimales (10 cm), les chiffres ne font qu'allonger l'URL.
      coordinates: cercle.coordinates.map((anneau) => anneau.map((point) => point.map((degres) => Number(degres.toFixed(6))))),
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
    // Une ligne par local ou par culture : les lignes d'une même mutation se regroupent par son
    // identifiant, y compris d'une section à l'autre.
    const mutations = new Map<string, LigneDvf[]>()
    for (const ligne of csvs.flatMap(parseCsv)) {
      if (ligne.date_mutation < `${depuis}-01-01`) continue
      mutations.set(ligne.id_mutation, [...(mutations.get(ligne.id_mutation) ?? []), ligne])
    }
    return [...mutations.values()].flatMap((lignes) => {
      const mutation = mutationOf(lignes, centre)
      return mutation ? [mutation] : []
    })
  },
}

/** Clé de section du service : code INSEE (de l'arrondissement à Paris, Lyon, Marseille), préfixe, section. */
function sectionOf({ code_insee, code_arr, com_abs, section }: DivisionApiCarto['features'][number]['properties']) {
  const commune = code_arr === '000' ? code_insee : `${code_insee.slice(0, 2)}${code_arr}`
  return `${commune}${com_abs}${section}`
}

/**
 * Le CSV croise les locaux et les natures de culture d'une même parcelle : un local se répète
 * sur chaque culture, une culture sur chaque local. On les compte chacun une fois.
 */
function uniques(lignes: LigneDvf[], cle: (ligne: LigneDvf) => string[]): LigneDvf[] {
  return [...new Map(lignes.map((ligne) => [cle(ligne).join('|'), ligne])).values()]
}

/** La mutation décrite par ses lignes, ou `null` si aucune n'est géolocalisée. */
function mutationOf(lignes: LigneDvf[], centre: LonLat): Mutation | null {
  const positions = lignes
    .filter((ligne) => ligne.longitude && ligne.latitude)
    .map((ligne) => ({ lon: Number(ligne.longitude), lat: Number(ligne.latitude) }))
  if (positions.length === 0) return null
  const locaux = uniques(
    lignes.filter((ligne) => ligne.type_local),
    (ligne) => [ligne.id_parcelle, ligne.type_local, ligne.lot1_numero, ligne.surface_reelle_bati, ligne.nombre_pieces_principales],
  )
  const cultures = uniques(
    lignes.filter((ligne) => ligne.surface_terrain),
    (ligne) => [ligne.id_parcelle, ligne.code_nature_culture, ligne.surface_terrain],
  )
  const [premiere] = lignes
  return {
    id: premiere.id_mutation,
    date: premiere.date_mutation,
    nature: premiere.nature_mutation,
    type: typeOf(locaux, cultures.length > 0),
    prix: premiere.valeur_fonciere ? Number(premiere.valeur_fonciere) : null,
    surfaceBatie: somme(locaux.map((local) => local.surface_reelle_bati)),
    surfaceTerrain: somme(cultures.map((culture) => culture.surface_terrain)),
    position: positions.reduce((plusProche, point) =>
      distanceBetween(centre, point) < distanceBetween(centre, plusProche) ? point : plusProche,
    ),
  }
}

function typeOf(locaux: LigneDvf[], terrain: boolean): TypeBien {
  const nombre = (type: string) => locaux.filter((local) => local.type_local === type).length
  const maisons = nombre('Maison')
  const appartements = nombre('Appartement')
  const professionnels = locaux.length - maisons - appartements - nombre('Dépendance')
  const logements = maisons + appartements
  if (professionnels > 0) return logements > 0 ? 'mixte' : 'local'
  if (logements === 1) return maisons ? 'maison' : 'appartement'
  if (logements > 1) return !appartements ? 'maisons' : !maisons ? 'appartements' : 'logements'
  if (locaux.length > 0) return 'dependance'
  return terrain ? 'terrain' : 'indetermine'
}

/** Somme des surfaces renseignées, `null` si aucune ne l'est. */
function somme(surfaces: string[]): number | null {
  const total = surfaces.reduce((cumul, surface) => cumul + (Number(surface) || 0), 0)
  return total || null
}
