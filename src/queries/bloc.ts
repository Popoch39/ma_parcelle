import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { BlocLoader } from '@/api/loader'
import { parcelleQuery } from './parcelle'

/**
 * Données d'un bloc qui part de la parcelle (urbanisme, risques, ventes…), clé `[bloc, idu]`.
 * La parcelle vient du cache du bloc Cadastre ; si elle échoue, le bloc échoue avec la même
 * erreur, si bien que chaque section n'a qu'une query à suivre.
 *
 * ```ts
 * export const useUrbanisme = (idu: string) => useParcelleBloc('urbanisme', idu, loadUrbanisme)
 * ```
 */
export function useParcelleBloc<Model>(bloc: string, idu: string, load: BlocLoader<Model>) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: [bloc, idu],
    queryFn: async ({ signal }) => load(fetch, await queryClient.fetchQuery(parcelleQuery(idu)), { signal }),
  })
}
