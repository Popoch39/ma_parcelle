import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BlockId } from '@/components/report/blocks'
import type { Snap } from '@/lib/bottom-sheet'
import { DESKTOP } from '@/lib/layout'
import { colorSchemeOf, persistedTheme, type Theme } from './theme'

export type ColorScheme = 'light' | 'dark'

interface UiState {
  /** System theme, tracked live. */
  systemColorScheme: ColorScheme
  /** Desktop screen (side panel) rather than mobile (bottom sheet), tracked live: rotation, resizing. */
  desktop: boolean
  /** Theme chosen by the user, remembered in the browser. */
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Height of the report's bottom sheet on mobile. */
  sheetSnap: Snap
  setSheetSnap: (snap: Snap) => void
  /** Report blocks collapsed by the user; the others are expanded. Kept from one report to the next. */
  collapsedBlocks: BlockId[]
  toggleBlock: (block: BlockId) => void
  /**
   * Report print in progress, from its preparation to the closing of the print dialog:
   * the map switches to light and the printed report mounts, lists expanded.
   */
  printJob: PrintJob | null
  setPrintJob: (printJob: PrintJob | null) => void
}

export interface PrintJob {
  date: Date
  /** Map image, or null until it is captured or if it could not be. */
  map: PrintedMap | null
}

export interface PrintedMap {
  /** Image as a data URL. */
  image: string
  /** Credits of the map's basemaps and overlays, owed with the image. */
  attribution: string
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')
const schemeOf = (query: MediaQueryList): ColorScheme => (query.matches ? 'dark' : 'light')
const desktopQuery = () => window.matchMedia(DESKTOP)

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      systemColorScheme: schemeOf(darkQuery()),
      desktop: desktopQuery().matches,
      theme: 'auto',
      setTheme: (theme) => set({ theme }),
      sheetSnap: 'peek',
      setSheetSnap: (sheetSnap) => set({ sheetSnap }),
      collapsedBlocks: [],
      toggleBlock: (block) =>
        set(({ collapsedBlocks }) => ({
          collapsedBlocks: collapsedBlocks.includes(block)
            ? collapsedBlocks.filter((collapsed) => collapsed !== block)
            : [...collapsedBlocks, block],
        })),
      printJob: null,
      setPrintJob: (printJob) => set({ printJob }),
    }),
    {
      name: 'ma-parcelle:ui',
      // Only the theme is remembered: the system theme and the screen are read again on each visit,
      // and each report opens at the default snap.
      partialize: ({ theme }) => ({ theme }),
      merge: (persisted, current) => ({ ...current, theme: persistedTheme(persisted) }),
    },
  ),
)

/** Updates the store when the system changes theme. Returns the function that stops tracking. */
export function followSystemColorScheme(): () => void {
  const query = darkQuery()
  const onChange = () => useUiStore.setState({ systemColorScheme: schemeOf(query) })
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Updates the store when the screen switches from mobile to desktop or back. Returns the function that stops tracking. */
export function followDesktopLayout(): () => void {
  const query = desktopQuery()
  const onChange = () => useUiStore.setState({ desktop: query.matches })
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Forces the chosen theme on `<html>` (`light` or `dark` class, read by the CSS); in `auto`,
 * no class: the CSS follows the system by itself. Returns the function that stops tracking.
 */
export function applyThemeToDocument(): () => void {
  const apply = ({ theme }: UiState) => {
    const root = document.documentElement
    root.classList.toggle('light', theme === 'light')
    root.classList.toggle('dark', theme === 'dark')
  }
  apply(useUiStore.getState())
  return useUiStore.subscribe(apply)
}

/**
 * Theme actually displayed: it is what the basemap and the overlay colors follow.
 * The rest of the interface switches to light when printing through the stylesheet.
 */
export const useColorScheme = () =>
  useUiStore((state) =>
    colorSchemeOf(state.theme, state.systemColorScheme, { printing: state.printJob !== null }),
  )

/** True while printing: blocks then expand their lists. */
export const useIsPrinting = () => useUiStore((state) => state.printJob !== null)

/** True if the block is collapsed on screen; every block is expanded when printing, like whatever is not a block. */
export const useBlockCollapsed = (block: BlockId | undefined) =>
  useUiStore((state) => block !== undefined && state.printJob === null && state.collapsedBlocks.includes(block))
