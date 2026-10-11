/** IDU split into its parts, as the cadastre expects them. */
export interface IduParts {
  idu: string
  /** INSEE code carried by the IDU: that of the district in Paris, Lyon and Marseille. */
  inseeCode: string
  /** Section prefix, non-zero for an absorbed municipality (« 000 » otherwise). */
  prefix: string
  section: string
  number: string
}

// department (2 digits or 2A/2B) + municipality (3) + prefix (3) + section (2) + number (4)
const IDU = /^((?:\d{2}|2[AB])\d{3})(\d{3})([0-9A-Z]{2})(\d{4})$/

/**
 * Cadastral reference as used in deeds, e.g. « 33063 KJ 33 ». The prefix of an absorbed
 * municipality goes before the section: « 13201 804 0B 401 ».
 */
export function formatCadastralReference({ inseeCode, prefix, section, number }: IduParts): string {
  return [inseeCode, prefix === '000' ? null : prefix, section, Number(number)]
    .filter((part) => part !== null)
    .join(' ')
}

/** District (« arrondissement ») of Paris, Lyon or Marseille designated by an INSEE code. */
export interface District {
  /** INSEE code of the district, e.g. « 75107 ». */
  inseeCode: string
  /** INSEE code of the municipality, e.g. « 75056 ». */
  municipalityCode: string
  /** The last three digits of the district code, e.g. « 107 ». */
  districtCode: string
  /** Rank of the district within its municipality, e.g. 7. */
  number: number
}

// The cadastre files these parcels under the municipality code, but the IDU carries the
// district's: without this mapping, the request returns nothing.
const PLM = [
  { municipalityCode: '75056', first: 75101, last: 75120 },
  { municipalityCode: '69123', first: 69381, last: 69389 },
  { municipalityCode: '13055', first: 13201, last: 13216 },
]

/** The district designated by this INSEE code, or `null` outside Paris, Lyon and Marseille. */
export function districtOf(inseeCode: string): District | null {
  const code = Number(inseeCode)
  const city = PLM.find(({ first, last }) => code >= first && code <= last)
  if (!city) return null
  return {
    inseeCode,
    municipalityCode: city.municipalityCode,
    districtCode: inseeCode.slice(2),
    number: code - city.first + 1,
  }
}

/** Splits a 14-character IDU, or returns `null` if it is malformed. */
export function parseIdu(idu: string): IduParts | null {
  const match = IDU.exec(idu)
  if (!match) return null
  const [, inseeCode, prefix, section, number] = match
  return { idu, inseeCode, prefix, section, number }
}
