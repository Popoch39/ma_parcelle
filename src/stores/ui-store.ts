import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { colorSchemeOf, persistedTheme, type Theme } from './theme'

export type ColorScheme = 'light' | 'dark'

interface UiState {
  /** Thème du système, suivi en direct. */
  systemColorScheme: ColorScheme
  /** Thème choisi par l'utilisateur, mémorisé dans le navigateur. */
  theme: Theme
  setTheme: (theme: Theme) => void
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')
const schemeOf = (query: MediaQueryList): ColorScheme => (query.matches ? 'dark' : 'light')

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      systemColorScheme: schemeOf(darkQuery()),
      theme: 'auto',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ma-parcelle:interface',
      // Seul le choix de l'utilisateur se mémorise ; le thème système se relit à chaque visite.
      partialize: ({ theme }) => ({ theme }),
      merge: (persisted, current) => ({ ...current, theme: persistedTheme(persisted) }),
    },
  ),
)

/** Met le store à jour quand le système change de thème. Renvoie la fonction qui arrête le suivi. */
export function followSystemColorScheme(): () => void {
  const query = darkQuery()
  const onChange = () => useUiStore.setState({ systemColorScheme: schemeOf(query) })
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Force sur `<html>` le thème choisi (classe `light` ou `dark`, lue par le CSS) ; en `auto`,
 * aucune classe : le CSS suit le système de lui-même. Renvoie la fonction qui arrête le suivi.
 */
export function applyThemeToDocument(): () => void {
  const apply = ({ theme }: UiState) => {
    const root = document.documentElement
    root.classList.toggle('light', theme === 'clair')
    root.classList.toggle('dark', theme === 'sombre')
  }
  apply(useUiStore.getState())
  return useUiStore.subscribe(apply)
}

/** Thème effectivement affiché : c'est lui que suivent le fond de carte et les couleurs des calques. */
export const useColorScheme = () => useUiStore((state) => colorSchemeOf(state.theme, state.systemColorScheme))
