import { useSelectionStore } from './selection-store'

const PARAM = 'parcelle'

function iduFromUrl(): string | null {
  // Une URL retapée à la main peut être en minuscules ou garder des espaces.
  return new URLSearchParams(window.location.search).get(PARAM)?.trim().toUpperCase() || null
}

/**
 * Synchronise le store sélection avec `?parcelle=<IDU>`, sans router : l'URL ouvre la fiche,
 * chaque nouvelle sélection crée une entrée d'historique, précédent et suivant la rejouent.
 * Renvoie la fonction qui arrête la synchronisation.
 */
export function syncSelectionWithUrl(): () => void {
  const { select, clear } = useSelectionStore.getState()
  const applyUrl = () => {
    const idu = iduFromUrl()
    if (idu) select(idu, { reframe: true })
    else clear()
  }
  applyUrl()

  const unsubscribe = useSelectionStore.subscribe(({ idu }) => {
    // Déjà dans l'URL : la sélection vient de l'URL elle-même (chargement ou historique).
    if (idu === iduFromUrl()) return
    const url = new URL(window.location.href)
    if (idu) url.searchParams.set(PARAM, idu)
    else url.searchParams.delete(PARAM)
    window.history.pushState(null, '', url)
  })
  window.addEventListener('popstate', applyUrl)

  return () => {
    unsubscribe()
    window.removeEventListener('popstate', applyUrl)
  }
}
