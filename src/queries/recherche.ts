import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Adresse } from '@/api/geocodage'
import { resolveAdresse, resolveSearch, suggestAdresses } from '@/api/recherche'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { parcelleQuery } from './parcelle'

// Le géocodeur limite l'autocomplétion à 10 requêtes par seconde : on attend une pause dans la frappe.
const DEBOUNCE_MS = 250

/**
 * Adresses à suggérer pour la saisie en cours. Une requête devenue obsolète est annulée :
 * TanStack Query abandonne son `signal` dès que la clé change.
 */
export function useAdresseSuggestions(saisie: string) {
  const debounced = useDebouncedValue(saisie.trim(), DEBOUNCE_MS)
  return useQuery({
    queryKey: ['suggestions', debounced],
    queryFn: ({ signal }) => suggestAdresses(fetch, debounced, { signal }),
    // Garde la liste affichée pendant que la suivante arrive, sans clignoter à chaque touche.
    placeholderData: keepPreviousData,
    // Le temps de réessayer, l'utilisateur a déjà tapé autre chose.
    retry: false,
  })
}

/** Ce que l'utilisateur valide : une suggestion d'adresse ou sa saisie libre. */
export type SearchTarget = { adresse: Adresse } | { saisie: string }

/**
 * Trouve la parcelle désignée par la recherche et la met en cache, pour que la fiche et le
 * cadrage la trouvent sans redemander le cadastre.
 */
export function useResolveSearch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (target: SearchTarget) =>
      'adresse' in target ? resolveAdresse(fetch, target.adresse.point) : resolveSearch(fetch, target.saisie),
    onSuccess: (parcelle) => queryClient.setQueryData(parcelleQuery(parcelle.idu).queryKey, parcelle),
  })
}
