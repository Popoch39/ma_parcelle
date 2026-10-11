import type { Vente } from './ventes'

/** Nombre de classes de prix, donc de teintes du dégradé : les quartiles du voisinage. */
export const NB_CLASSES = 4

/** Une classe de prix au m², telle que la légende la montre. */
export interface ClassePrixM2 {
  /** Position de sa teinte dans le dégradé, de 0 (le moins cher) à `NB_CLASSES - 1`. */
  rang: number
  libelle: string
}

/** Classes de prix au m² des ventes simples du voisinage, pour colorer leurs points sur la carte. */
export interface EchellePrixM2 {
  /** Du moins cher au plus cher, chacune habitée par au moins une vente. */
  classes: ClassePrixM2[]
  /** Rang de la teinte d'un prix au m². */
  rangDe: (prixM2: number) => number
}

const euros = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

/**
 * Échelle relative au voisinage : les prix au m² varient d'un facteur dix entre une campagne et
 * Paris, une échelle fixe mettrait tous les points d'un quartier dans la même teinte. Seules les
 * ventes simples y comptent, comme pour le prix médian ; `null` s'il n'y en a aucune.
 */
export function echellePrixM2(ventes: Vente[]): EchellePrixM2 | null {
  const prix = ventes
    .flatMap(({ exclusion, prixM2 }) => (exclusion === null && prixM2 !== null ? [prixM2] : []))
    .toSorted((a, b) => a - b)
  if (prix.length === 0) return null
  const bornes = bornesDe(prix)
  // Avec moins de quatre classes, leurs teintes s'écartent jusqu'aux deux bouts du dégradé,
  // pour rester distinctes ; une classe seule prend une teinte du milieu.
  const rangDeClasse = (classe: number) =>
    Math.round(bornes.length === 1 ? (NB_CLASSES - 1) / 2 : (classe * (NB_CLASSES - 1)) / (bornes.length - 1))
  return {
    classes: bornes.map(([de, a], classe) => ({ rang: rangDeClasse(classe), libelle: libelleDe(de, a, prix) })),
    rangDe: (prixM2) => rangDeClasse(bornes.filter(([de]) => de !== null && de <= prixM2).length),
  }
}

/** Intervalles [de, à[ des classes ; `null` = ouvert de ce côté. */
function bornesDe(prix: number[]): [number | null, number | null][] {
  // Arrondies avant de classer : un point doit tomber dans la classe que la légende affiche.
  const quartiles = Array.from({ length: NB_CLASSES - 1 }, (_, k) =>
    arrondi(prix[Math.floor((prix.length * (k + 1)) / NB_CLASSES)]),
  )
  // Avec peu de ventes, des quartiles se confondent ou laissent une classe sans vente : la
  // légende ne doit montrer que des teintes présentes sur la carte.
  const seuils: number[] = []
  for (const seuil of new Set(quartiles)) {
    const precedent = seuils.at(-1) ?? -Infinity
    if (prix.some((p) => p >= precedent && p < seuil)) seuils.push(seuil)
  }
  while (seuils.length > 0 && !prix.some((p) => p >= (seuils.at(-1) ?? Infinity))) seuils.pop()
  return [null, ...seuils].map((de, k) => [de, seuils[k] ?? null])
}

/** À la centaine d'euros : une légende se lit d'un coup d'œil, un écart de 50 €/m² n'y change rien. */
function arrondi(prixM2: number): number {
  return Math.round(prixM2 / 100) * 100
}

function libelleDe(de: number | null, a: number | null, prix: number[]): string {
  if (de === null) {
    if (a !== null) return `moins de ${euros.format(a)} €/m²`
    // Classe seule : la légende dit l'étendue des prix plutôt qu'un intervalle ouvert des deux côtés.
    const [min, max] = [arrondi(prix[0]), arrondi(prix[prix.length - 1])]
    return min === max ? `environ ${euros.format(min)} €/m²` : `${euros.format(min)} à ${euros.format(max)} €/m²`
  }
  if (a === null) return `${euros.format(de)} €/m² et plus`
  return `${euros.format(de)} à ${euros.format(a)} €/m²`
}
