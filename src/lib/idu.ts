/** IDU découpé en ses parties, telles que le cadastre les attend. */
export interface IduParts {
  idu: string
  /** Code INSEE porté par l'IDU : celui de l'arrondissement à Paris, Lyon et Marseille. */
  codeInsee: string
  /** Préfixe de section, non nul pour une commune absorbée (« 000 » sinon). */
  prefixe: string
  section: string
  numero: string
}

// département (2 chiffres ou 2A/2B) + commune (3) + préfixe (3) + section (2) + numéro (4)
const IDU = /^((?:\d{2}|2[AB])\d{3})(\d{3})([0-9A-Z]{2})(\d{4})$/

/**
 * Référence cadastrale des actes, ex. « 33063 KJ 33 ». Le préfixe d'une commune absorbée
 * s'intercale avant la section : « 13201 804 0B 401 ».
 */
export function formatReferenceCadastrale({ codeInsee, prefixe, section, numero }: IduParts): string {
  return [codeInsee, prefixe === '000' ? null : prefixe, section, Number(numero)]
    .filter((part) => part !== null)
    .join(' ')
}

/** Arrondissement de Paris, Lyon ou Marseille désigné par un code INSEE. */
export interface Arrondissement {
  /** Code INSEE de l'arrondissement, ex. « 75107 ». */
  codeInsee: string
  /** Code INSEE de la commune, ex. « 75056 ». */
  codeCommune: string
  /** Les trois derniers chiffres du code de l'arrondissement, ex. « 107 ». */
  codeArr: string
  /** Rang de l'arrondissement dans sa commune, ex. 7. */
  rang: number
}

// Le cadastre range ces parcelles sous le code de la commune, mais l'IDU porte celui de
// l'arrondissement : sans cette correspondance, la requête ne renvoie rien.
const PLM = [
  { codeCommune: '75056', premier: 75101, dernier: 75120 },
  { codeCommune: '69123', premier: 69381, dernier: 69389 },
  { codeCommune: '13055', premier: 13201, dernier: 13216 },
]

/** L'arrondissement désigné par ce code INSEE, ou `null` hors de Paris, Lyon et Marseille. */
export function arrondissementOf(codeInsee: string): Arrondissement | null {
  const code = Number(codeInsee)
  const ville = PLM.find(({ premier, dernier }) => code >= premier && code <= dernier)
  if (!ville) return null
  return {
    codeInsee,
    codeCommune: ville.codeCommune,
    codeArr: codeInsee.slice(2),
    rang: code - ville.premier + 1,
  }
}

/** Découpe un IDU de 14 caractères, ou renvoie `null` s'il est mal formé. */
export function parseIdu(idu: string): IduParts | null {
  const match = IDU.exec(idu)
  if (!match) return null
  const [, codeInsee, prefixe, section, numero] = match
  return { idu, codeInsee, prefixe, section, numero }
}
