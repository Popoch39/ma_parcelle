import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { BlocLoader } from '@/api/loader'
import type { BlocId } from '@/components/fiche/blocs'
import { parcelleQuery } from './parcelle'

/**
 * Query d'un bloc qui part de la parcelle (urbanisme, risques, ventes…), clé `[bloc, idu]`.
 * La parcelle vient du cache du bloc Cadastre ; si elle échoue, le bloc échoue avec la même
 * erreur, si bien que chaque section n'a qu'une query à suivre.
 */
export const parcelleBlocQuery = <Model>(queryClient: QueryClient, bloc: BlocId, idu: string, load: BlocLoader<Model>) =>
  queryOptions({
    queryKey: [bloc, idu],
    queryFn: async ({ signal }) => load(fetch, await queryClient.fetchQuery(parcelleQuery(idu)), { signal }),
  })

/**
 * Données d'un bloc, pour sa section.
 *
 * ```ts
 * export const useUrbanisme = (idu: string) => useParcelleBloc('urbanisme', idu, loadUrbanisme)
 * ```
 */
export function useParcelleBloc<Model>(bloc: BlocId, idu: string, load: BlocLoader<Model>) {
  const queryClient = useQueryClient()
  return useQuery(parcelleBlocQuery(queryClient, bloc, idu, load))
}
