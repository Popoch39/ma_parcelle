import { queryOptions, useQuery } from '@tanstack/react-query'
import { loadParcel } from '@/api/cadastre'

export const parcelQuery = (idu: string) =>
  queryOptions({
    queryKey: ['parcel', idu],
    queryFn: ({ signal }) => loadParcel(fetch, idu, { signal }),
  })

/** The selected parcel: it is the Cadastre block's data and the starting point of the other blocks. */
export const useParcel = (idu: string) => useQuery(parcelQuery(idu))
