import { useQueries, useQueryClient } from '@tanstack/react-query'
import { CONTRIBUTIONS } from '@/lib/synthese/contributions'
import { assemblerSynthese } from '@/lib/synthese/synthese'
import { parcelleBlocQuery } from './bloc'

/**
 * Synthèse de la fiche. Elle suit les queries des blocs (mêmes clés que leurs sections, donc
 * aucun appel de plus) et se recompose à chaque bloc chargé, en erreur ou relancé.
 */
export function useSynthese(idu: string) {
  const queryClient = useQueryClient()
  return useQueries({
    queries: CONTRIBUTIONS.map((contribution) => ({
      ...parcelleBlocQuery(queryClient, contribution.bloc, idu, contribution.charger),
      // Une contribution qui lève ne fait échouer que l'observateur de la synthèse : le bloc
      // disparaît de la synthèse, sa section n'en sait rien.
      select: (donnees: unknown) => contribution.faits(donnees),
    })),
    combine: assemblerSynthese,
  })
}
