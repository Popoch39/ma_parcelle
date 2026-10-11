import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Address } from '@/api/geocoding'
import { resolveAddress, resolveSearch, suggestAddresses } from '@/api/search'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { parcelQuery } from './parcel'

// The geocoder limits autocompletion to 10 requests per second: wait for a pause in typing.
const DEBOUNCE_MS = 250

/**
 * Addresses to suggest for the current input. A request that has become stale is cancelled:
 * TanStack Query aborts its `signal` as soon as the key changes.
 */
export function useAddressSuggestions(input: string) {
  const debounced = useDebouncedValue(input.trim(), DEBOUNCE_MS)
  return useQuery({
    queryKey: ['suggestions', debounced],
    queryFn: ({ signal }) => suggestAddresses(fetch, debounced, { signal }),
    // Keeps the list displayed while the next one arrives, without flickering on every key.
    placeholderData: keepPreviousData,
    // By the time of a retry, the user has already typed something else.
    retry: false,
  })
}

/** What the user submits: an address suggestion or their free input. */
export type SearchTarget = { address: Address } | { input: string }

/**
 * Finds the parcel designated by the search and caches it, so that the report and the
 * framing find it without asking the cadastre again.
 */
export function useResolveSearch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (target: SearchTarget) =>
      'address' in target ? resolveAddress(fetch, target.address.point) : resolveSearch(fetch, target.input),
    onSuccess: (parcel) => queryClient.setQueryData(parcelQuery(parcel.idu).queryKey, parcel),
  })
}
