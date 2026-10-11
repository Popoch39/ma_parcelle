import type { Parcelle } from './cadastre'
import type { Fetch } from './fetch-json'

export interface LoadOptions {
  /** Le `signal` de TanStack Query, à transmettre à `fetchJson`. */
  signal?: AbortSignal
}

/**
 * Chargeur d'un bloc de la fiche : il reçoit le `fetch` injecté (la seam de test) et la
 * parcelle déjà chargée par le bloc Cadastre, et renvoie le modèle du bloc. Il encapsule les
 * URL, les appels, la normalisation et les secours : le reste de l'app ne voit jamais les
 * formats bruts des API.
 */
export type BlocLoader<Model> = (fetch: Fetch, parcelle: Parcelle, options?: LoadOptions) => Promise<Model>
