import type { LonLat } from './geo'
import { parseIdu } from './idu'

/** What the user typed in the search bar, once its kind is recognized. */
export type SearchQuery =
  | { kind: 'idu'; idu: string }
  | {
      kind: 'reference'
      /** The input as is, to quote it if it designates nothing. */
      text: string
      /** The municipality by its INSEE code (that of the district in Paris, Lyon and Marseille) or by its name. */
      municipality: { inseeCode: string } | { name: string }
      /** Prefix of an absorbed municipality, if given (e.g. « 804 » in Marseille). */
      prefix: string | null
      /** On 2 characters, as the cadastre expects it (« A » → « 0A »). */
      section: string
      /** On 4 digits (« 33 » → « 0033 »). */
      number: string
    }
  | { kind: 'coordinates'; point: LonLat }
  | { kind: 'address'; text: string }
  /** Too little to search for anything: the geocoder rejects fewer than 3 characters. */
  | { kind: 'incomplete' }

// « latitude, longitude », separated by a comma, a semicolon or a space, the French decimal
// comma accepted. Mandatory decimals avoid taking « 75 12 » for a point.
const COORDINATES = /^(-?\d{1,2}[.,]\d+) ?(?:[;,] ?| )(-?\d{1,3}[.,]\d+)$/
// municipality + optional prefix + section (one or two letters) + number, e.g. « 13201 804 B 401 »
const REFERENCE = /^(.+?) (?:(\d{3}) )?(0?[A-Z]|[A-Z]{2}) (\d{1,4})$/i
const INSEE_CODE = /^(?:\d{5}|2[AB]\d{3})$/i
// A municipality name starts with a letter: « 12 rue de Paris B 3 » stays an address.
const MUNICIPALITY_NAME = /^\p{L}/u
// The geocoder answers 400 to fewer than 3 characters or to a text that does not start with a
// letter or a digit.
const ADDRESS = /^[\p{L}\d].{2,}$/u

/** Recognizes the kind of input, without any network call. */
export function parseSearchQuery(input: string): SearchQuery {
  const text = input.trim().replace(/\s+/g, ' ')
  const idu = parseIdu(text.toUpperCase())
  if (idu) return { kind: 'idu', idu: idu.idu }

  const coordinates = COORDINATES.exec(text)
  if (coordinates) {
    const [lat, lon] = coordinates.slice(1).map((value) => Number(value.replace(',', '.')))
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { kind: 'coordinates', point: { lon, lat } }
  }

  const reference = REFERENCE.exec(text)
  if (reference) {
    const [, municipality, prefix, section, number] = reference
    const query = {
      kind: 'reference' as const,
      text,
      prefix: prefix ?? null,
      section: section.toUpperCase().padStart(2, '0'),
      number: number.padStart(4, '0'),
    }
    if (INSEE_CODE.test(municipality)) return { ...query, municipality: { inseeCode: municipality.toUpperCase() } }
    if (MUNICIPALITY_NAME.test(municipality)) return { ...query, municipality: { name: municipality } }
  }

  return ADDRESS.test(text) ? { kind: 'address', text } : { kind: 'incomplete' }
}
