import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BlocId } from '@/components/fiche/blocs'
import type { Cran } from '@/lib/bottom-sheet'
import { colorSchemeOf, persistedTheme, type Theme } from './theme'

export type ColorScheme = 'light' | 'dark'

interface UiState {
  /** Thème du système, suivi en direct. */
  systemColorScheme: ColorScheme
  /** Thème choisi par l'utilisateur, mémorisé dans le navigateur. */
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Hauteur du bottom sheet de la fiche sur mobile. */
  sheetCran: Cran
  setSheetCran: (cran: Cran) => void
  /** Blocs de la fiche repliés par l'utilisateur ; les autres sont dépliés. Gardés d'une fiche à l'autre. */
  blocsReplies: BlocId[]
  basculerBloc: (bloc: BlocId) => void
  /**
   * Impression de la fiche en cours, de sa préparation à la fermeture de la fenêtre
   * d'impression : la carte passe en clair et la fiche imprimée se monte, listes dépliées.
   */
  impression: Impression | null
  setImpression: (impression: Impression | null) => void
}

export interface Impression {
  date: Date
  /** Image de la carte, ou null tant qu'elle n'est pas capturée ou si elle n'a pas pu l'être. */
  carte: CarteImprimee | null
}

export interface CarteImprimee {
  /** Image en data URL. */
  image: string
  /** Mentions des fonds et calques de la carte, dues avec l'image. */
  attribution: string
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')
const schemeOf = (query: MediaQueryList): ColorScheme => (query.matches ? 'dark' : 'light')

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      systemColorScheme: schemeOf(darkQuery()),
      theme: 'auto',
      setTheme: (theme) => set({ theme }),
      sheetCran: 'apercu',
      setSheetCran: (sheetCran) => set({ sheetCran }),
      blocsReplies: [],
      basculerBloc: (bloc) =>
        set(({ blocsReplies }) => ({
          blocsReplies: blocsReplies.includes(bloc)
            ? blocsReplies.filter((replie) => replie !== bloc)
            : [...blocsReplies, bloc],
        })),
      impression: null,
      setImpression: (impression) => set({ impression }),
    }),
    {
      name: 'ma-parcelle:interface',
      // Seul le thème se mémorise : le thème système se relit à chaque visite, et chaque fiche
      // s'ouvre au cran par défaut.
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

/**
 * Thème effectivement affiché : c'est lui que suivent le fond de carte et les couleurs des calques.
 * Le reste de l'interface passe en clair à l'impression par la feuille de style.
 */
export const useColorScheme = () =>
  useUiStore((state) =>
    colorSchemeOf(state.theme, state.systemColorScheme, { impression: state.impression !== null }),
  )

/** Vrai pendant une impression : les blocs déplient alors leurs listes. */
export const useImpressionEnCours = () => useUiStore((state) => state.impression !== null)

/** Vrai si le bloc est replié à l'écran ; tout bloc est déplié à l'impression, comme ce qui n'est pas un bloc. */
export const useBlocReplie = (bloc: BlocId | undefined) =>
  useUiStore((state) => bloc !== undefined && state.impression === null && state.blocsReplies.includes(bloc))
