import { queryOptions, useQuery } from '@tanstack/react-query'
import { loadParcelle } from '@/api/cadastre'

export const parcelleQuery = (idu: string) =>
  queryOptions({
    queryKey: ['parcelle', idu],
    queryFn: ({ signal }) => loadParcelle(fetch, idu, { signal }),
  })

/** La parcelle sélectionnée : c'est la donnée du bloc Cadastre et le point de départ des autres blocs. */
export const useParcelle = (idu: string) => useQuery(parcelleQuery(idu))
