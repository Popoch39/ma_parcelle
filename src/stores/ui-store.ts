import { create } from 'zustand'
import type { Cran } from '@/lib/bottom-sheet'

export type ColorScheme = 'light' | 'dark'

interface UiState {
  /** Thème du système, suivi en direct. */
  systemColorScheme: ColorScheme
  /** Hauteur du bottom sheet de la fiche sur mobile. */
  sheetCran: Cran
  setSheetCran: (cran: Cran) => void
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')
const schemeOf = (query: MediaQueryList): ColorScheme => (query.matches ? 'dark' : 'light')

export const useUiStore = create<UiState>()((set) => ({
  systemColorScheme: schemeOf(darkQuery()),
  sheetCran: 'apercu',
  setSheetCran: (sheetCran) => set({ sheetCran }),
}))

/** Met le store à jour quand le système change de thème. Renvoie la fonction qui arrête le suivi. */
export function followSystemColorScheme(): () => void {
  const query = darkQuery()
  const onChange = () => useUiStore.setState({ systemColorScheme: schemeOf(query) })
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Thème effectivement affiché : c'est lui que suivent le fond de carte et les couleurs des calques. */
export const useColorScheme = () => useUiStore((state) => state.systemColorScheme)
