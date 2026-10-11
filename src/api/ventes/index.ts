import { centroideOf, type LonLat } from '@/lib/geo'
import {
  ANNEES_DE_VENTES,
  medianesOf,
  RAYON_VOISINAGE,
  ventesDuVoisinage,
  type Medianes,
  type Mutation,
  type Vente,
} from '@/lib/ventes'
import type { Fetch } from '../fetch-json'
import type { BlocLoader, LoadOptions } from '../loader'
import { cerema } from './cerema'
import type { SourceVentesId, VentesSource, Voisinage } from './source'

/** Modèle du bloc Ventes. */
export interface VentesBloc {
  /** La source qui a répondu : la principale, ou celle de secours. */
  source: SourceVentesId
  /** Centre du cercle du voisinage : le centroïde de la parcelle. */
  centre: LonLat
  /** Rayon du voisinage, en mètres. */
  rayon: number
  /** Première année retenue. */
  depuis: number
  /** Les ventes du voisinage, de la plus récente à la plus ancienne, exclues comprises. */
  ventes: Vente[]
  medianes: Medianes
}

/** Sources dans l'ordre où on les essaie : la suivante ne sert que si la précédente échoue. */
const SOURCES: readonly VentesSource[] = [cerema]

/** Chargeur du bloc Ventes : les ventes DVF du voisinage de la parcelle et leur prix médian au m². */
export const loadVentes: BlocLoader<VentesBloc> = async (fetch, parcelle, { signal } = {}) => {
  const [lon, lat] = centroideOf(parcelle.geometrie)
  const voisinage: Voisinage = {
    centre: { lon, lat },
    rayon: RAYON_VOISINAGE,
    depuis: new Date().getFullYear() - ANNEES_DE_VENTES,
  }
  const { source, mutations } = await chargerMutations(fetch, voisinage, { signal })
  const ventes = ventesDuVoisinage(mutations, voisinage.centre, voisinage.rayon, voisinage.depuis)
  return { source, ...voisinage, ventes, medianes: medianesOf(ventes) }
}

async function chargerMutations(
  fetch: Fetch,
  voisinage: Voisinage,
  { signal }: LoadOptions,
): Promise<{ source: SourceVentesId; mutations: Mutation[] }> {
  let premiereErreur: unknown
  for (const source of SOURCES) {
    try {
      return { source: source.id, mutations: await source.charger(fetch, voisinage, { signal }) }
    } catch (error) {
      if (signal?.aborted) throw error
      premiereErreur ??= error
    }
  }
  // La panne de la source principale explique mieux l'échec que celle du secours.
  throw premiereErreur
}
