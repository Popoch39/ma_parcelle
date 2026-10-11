// A name starting with a vowel or a mute h elides « de » (d’Ajaccio). An h is left alone:
// telling a mute one (d’Hyères) from an aspirated one (de Haguenau) takes a dictionary.
const VOWEL = /^[aeiouyàâäéèêëîïôöùûüœæ]/i

/** « de » before a place name, contracted with its article: du Havre, des Abymes, d’Ajaccio, de La Rochelle. */
export function ofPlace(name: string): string {
  if (name.startsWith('Le ')) return `du ${name.slice(3)}`
  if (name.startsWith('Les ')) return `des ${name.slice(4)}`
  if (VOWEL.test(name)) return `d’${name}`
  return `de ${name}`
}

/** « à » before a place name, contracted with its article: au Havre, aux Abymes, à La Rochelle. */
export function inPlace(name: string): string {
  if (name.startsWith('Le ')) return `au ${name.slice(3)}`
  if (name.startsWith('Les ')) return `aux ${name.slice(4)}`
  return `à ${name}`
}

const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export const formatInteger = (value: number) => integer.format(value)

export const formatDecimal = (value: number) => decimal.format(value)

/** « 850 m » under a kilometre, « 4,2 km » beyond. */
export const formatDistance = (metres: number) =>
  metres < 1000 ? `${integer.format(Math.round(metres / 50) * 50)} m` : `${decimal.format(metres / 1000)} km`
