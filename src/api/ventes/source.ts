import type { LonLat } from '@/lib/geo'
import type { Mutation } from '@/lib/ventes'
import type { Fetch } from '../fetch-json'
import type { LoadOptions } from '../loader'

export type SourceVentesId = 'cerema' | 'datagouv'

/** Le voisinage dont on cherche les ventes. */
export interface Voisinage {
  centre: LonLat
  /** En mètres. */
  rayon: number
  /** Première année retenue. */
  depuis: number
}

/**
 * Une source des ventes DVF. Elle renvoie les mutations normalisées autour du voisinage, sans
 * garantie de rester dans le cercle : le chargeur l'applique ensuite, pour toutes les sources.
 */
export interface VentesSource {
  id: SourceVentesId
  charger: (fetch: Fetch, voisinage: Voisinage, options?: LoadOptions) => Promise<Mutation[]>
}
