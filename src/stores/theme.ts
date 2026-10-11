import type { ColorScheme } from './ui-store'

/** Theme chosen by the user; `auto` follows the system. */
export type Theme = 'auto' | 'light' | 'dark'

const THEMES: readonly Theme[] = ['auto', 'light', 'dark']

/**
 * Theme actually displayed for a user choice and a system theme. A report always prints
 * in light: a dark background on paper is unreadable and drains the ink.
 */
export function colorSchemeOf(theme: Theme, system: ColorScheme, { printing = false } = {}): ColorScheme {
  if (printing || theme === 'light') return 'light'
  if (theme === 'dark') return 'dark'
  return system
}

const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme === value)

/**
 * Theme remembered by the UI store during a previous visit. Browser storage may contain
 * anything (older version, hand edit): anything that is not a known theme falls back to
 * following the system.
 */
export function persistedTheme(persisted: unknown): Theme {
  if (typeof persisted !== 'object' || persisted === null || !('theme' in persisted)) return 'auto'
  return isTheme(persisted.theme) ? persisted.theme : 'auto'
}
