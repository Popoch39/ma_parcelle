import type { LonLat } from './geo'
import { parseIdu } from './idu'

/** Ce que l'utilisateur a tapé dans la barre de recherche, une fois son type reconnu. */
export type SearchQuery =
  | { kind: 'idu'; idu: string }
  | {
      kind: 'reference'
      /** La saisie telle quelle, pour la citer si elle ne désigne rien. */
      texte: string
      /** La commune par son code INSEE (celui de l'arrondissement à Paris, Lyon et Marseille) ou par son nom. */
      commune: { codeInsee: string } | { nom: string }
      /** Préfixe d'une commune absorbée, s'il est précisé (ex. « 804 » à Marseille). */
      prefixe: string | null
      /** Sur 2 caractères, comme l'attend le cadastre (« A » → « 0A »). */
      section: string
      /** Sur 4 chiffres (« 33 » → « 0033 »). */
      numero: string
    }
  | { kind: 'coordonnees'; point: LonLat }
  | { kind: 'adresse'; texte: string }
  /** Trop peu pour chercher quoi que ce soit : le géocodeur refuse moins de 3 caractères. */
  | { kind: 'incomplete' }

// « latitude, longitude », séparés par une virgule, un point-virgule ou une espace, la virgule
// décimale française acceptée. Les décimales obligatoires évitent de prendre « 75 12 » pour un point.
const COORDONNEES = /^(-?\d{1,2}[.,]\d+) ?(?:[;,] ?| )(-?\d{1,3}[.,]\d+)$/
// commune + préfixe facultatif + section (une ou deux lettres) + numéro, ex. « 13201 804 B 401 »
const REFERENCE = /^(.+?) (?:(\d{3}) )?(0?[A-Z]|[A-Z]{2}) (\d{1,4})$/i
const CODE_INSEE = /^(?:\d{5}|2[AB]\d{3})$/i
// Un nom de commune commence par une lettre : « 12 rue de Paris B 3 » reste une adresse.
const NOM_COMMUNE = /^\p{L}/u
// Le géocodeur répond 400 à moins de 3 caractères ou à un texte qui ne commence pas par une
// lettre ou un chiffre.
const ADRESSE = /^[\p{L}\d].{2,}$/u

/** Reconnaît le type de saisie, sans appel réseau. */
export function parseSearchQuery(saisie: string): SearchQuery {
  const texte = saisie.trim().replace(/\s+/g, ' ')
  const idu = parseIdu(texte.toUpperCase())
  if (idu) return { kind: 'idu', idu: idu.idu }

  const coordonnees = COORDONNEES.exec(texte)
  if (coordonnees) {
    const [lat, lon] = coordonnees.slice(1).map((nombre) => Number(nombre.replace(',', '.')))
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { kind: 'coordonnees', point: { lon, lat } }
  }

  const reference = REFERENCE.exec(texte)
  if (reference) {
    const [, commune, prefixe, section, numero] = reference
    const query = {
      kind: 'reference' as const,
      texte,
      prefixe: prefixe ?? null,
      section: section.toUpperCase().padStart(2, '0'),
      numero: numero.padStart(4, '0'),
    }
    if (CODE_INSEE.test(commune)) return { ...query, commune: { codeInsee: commune.toUpperCase() } }
    if (NOM_COMMUNE.test(commune)) return { ...query, commune: { nom: commune } }
  }

  return ADRESSE.test(texte) ? { kind: 'adresse', texte } : { kind: 'incomplete' }
}
