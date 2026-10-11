import type { Sale } from './sales'

/** Count of price classes, hence of gradient hues: the neighborhood quartiles. */
export const CLASS_COUNT = 4

/** A price-per-m² class, as the legend shows it. */
export interface PricePerSqmClass {
  /** Position of its hue in the gradient, from 0 (cheapest) to `CLASS_COUNT - 1`. */
  rank: number
  label: string
}

/** Price-per-m² classes of the neighborhood's simple sales, to color their points on the map. */
export interface PricePerSqmScale {
  /** From cheapest to most expensive, each holding at least one sale. */
  classes: PricePerSqmClass[]
  /** Hue rank of a price per m². */
  rankOf: (pricePerSqm: number) => number
}

const euros = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

/**
 * Scale relative to the neighborhood: prices per m² vary tenfold between the countryside and
 * Paris, a fixed scale would put all points of a neighborhood in the same hue. Only simple
 * sales count, as for the median price; `null` if there are none.
 */
export function pricePerSqmScale(sales: Sale[]): PricePerSqmScale | null {
  const prices = sales
    .flatMap(({ exclusion, pricePerSqm }) => (exclusion === null && pricePerSqm !== null ? [pricePerSqm] : []))
    .toSorted((a, b) => a - b)
  if (prices.length === 0) return null
  const bounds = boundsOf(prices)
  // With fewer than four classes, their hues spread to both ends of the gradient, to stay
  // distinct; a single class takes a middle hue.
  const classRank = (index: number) =>
    Math.round(bounds.length === 1 ? (CLASS_COUNT - 1) / 2 : (index * (CLASS_COUNT - 1)) / (bounds.length - 1))
  return {
    classes: bounds.map(([from, to], index) => ({ rank: classRank(index), label: labelOf(from, to, prices) })),
    rankOf: (pricePerSqm) => classRank(bounds.filter(([from]) => from !== null && from <= pricePerSqm).length),
  }
}

/** Intervals [from, to[ of the classes; `null` = open on that side. */
function boundsOf(prices: number[]): [number | null, number | null][] {
  // Rounded before classifying: a point must fall in the class the legend displays.
  const quartiles = Array.from({ length: CLASS_COUNT - 1 }, (_, k) =>
    rounded(prices[Math.floor((prices.length * (k + 1)) / CLASS_COUNT)]),
  )
  // With few sales, quartiles merge or leave a class without any sale: the legend must only
  // show hues present on the map.
  const thresholds: number[] = []
  for (const threshold of new Set(quartiles)) {
    const previous = thresholds.at(-1) ?? -Infinity
    if (prices.some((p) => p >= previous && p < threshold)) thresholds.push(threshold)
  }
  while (thresholds.length > 0 && !prices.some((p) => p >= (thresholds.at(-1) ?? Infinity))) thresholds.pop()
  return [null, ...thresholds].map((from, k) => [from, thresholds[k] ?? null])
}

/** To the nearest hundred euros: a legend is read at a glance, a 50 €/m² gap changes nothing there. */
function rounded(pricePerSqm: number): number {
  return Math.round(pricePerSqm / 100) * 100
}

function labelOf(from: number | null, to: number | null, prices: number[]): string {
  if (from === null) {
    if (to !== null) return `moins de ${euros.format(to)} €/m²`
    // Single class: the legend states the price range rather than an interval open on both sides.
    const [min, max] = [rounded(prices[0]), rounded(prices[prices.length - 1])]
    return min === max ? `environ ${euros.format(min)} €/m²` : `${euros.format(min)} à ${euros.format(max)} €/m²`
  }
  if (to === null) return `${euros.format(from)} €/m² et plus`
  return `${euros.format(from)} à ${euros.format(to)} €/m²`
}
