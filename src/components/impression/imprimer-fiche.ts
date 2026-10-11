import type { QueryClient } from '@tanstack/react-query'
import { flushSync } from 'react-dom'
import { cadrerPourImpression, capturerCarte, carteStabilisee } from '@/map/capture-carte'
import { parcelleQuery } from '@/queries/parcelle'
import { queryClient } from '@/queries/query-client'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useUiStore } from '@/stores/ui-store'

// Au-delà, on imprime la carte et les blocs tels qu'ils sont : mieux vaut une fiche incomplète
// qu'un bouton qui ne répond plus (une source lente peut mettre 45 s à échouer).
const ATTENTE_MAX = 30_000

/**
 * Prépare la fiche à l'impression puis ouvre l'impression du navigateur : carte passée en clair,
 * centrée sur la parcelle et capturée en image, blocs chargés, listes dépliées. La vue de la carte
 * revient aussitôt la capture faite ; le reste, à la fermeture de la fenêtre d'impression.
 */
export async function imprimerFiche(idu: string): Promise<void> {
  const { impression, setImpression } = useUiStore.getState()
  if (impression) return
  const { map } = useMapStore.getState()
  const parcelle = queryClient.getQueryData(parcelleQuery(idu).queryKey)

  const date = new Date()
  setImpression({ date, carte: null })
  try {
    const signal = AbortSignal.timeout(ATTENTE_MAX)
    // Laisse React monter la fiche imprimée et passer la carte en clair avant d'attendre qu'elle se stabilise.
    await new Promise((resolve) => setTimeout(resolve))
    const revenir = map && parcelle ? cadrerPourImpression(map, parcelle.emprise) : null
    await Promise.all([map && carteStabilisee(map, signal), chargementsTermines(queryClient, signal)])
    const carte = map && capturerCarte(map)
    revenir?.()
    // L'image décodée d'avance est prête quand le navigateur fige la page à imprimer ; le rendu
    // synchrone l'y a posée avant l'appel à `print`.
    if (carte) await imageDecodee(carte.image)
    flushSync(() => setImpression({ date, carte }))
    window.print()
  } catch (error) {
    setImpression(null)
    throw error
  }
}

/**
 * Suit les impressions lancées par le navigateur (Ctrl+P, menu) et la fin de toute impression.
 * Sans le bouton, pas le temps de préparer la carte : elle est imprimée telle qu'à l'écran.
 * Renvoie la fonction qui arrête le suivi.
 */
export function suivreImpressions(): () => void {
  const avant = () => {
    const { impression, setImpression } = useUiStore.getState()
    if (impression || !useSelectionStore.getState().idu) return
    const { map } = useMapStore.getState()
    flushSync(() => setImpression({ date: new Date(), carte: map && capturerCarte(map) }))
  }
  const apres = () => useUiStore.getState().setImpression(null)
  window.addEventListener('beforeprint', avant)
  window.addEventListener('afterprint', apres)
  return () => {
    window.removeEventListener('beforeprint', avant)
    window.removeEventListener('afterprint', apres)
  }
}

/** Attend qu'aucun bloc ne soit plus en chargement, ou que `signal` abandonne. */
function chargementsTermines(client: QueryClient, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const fin = () => {
      desabonner()
      signal.removeEventListener('abort', fin)
      resolve()
    }
    const desabonner = client.getQueryCache().subscribe(() => {
      if (client.isFetching() === 0) fin()
    })
    signal.addEventListener('abort', fin)
    if (client.isFetching() === 0) fin()
  })
}

function imageDecodee(src: string): Promise<void> {
  const image = new Image()
  image.src = src
  return image.decode()
}
