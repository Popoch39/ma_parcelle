import type { ColorScheme } from './ui-store'

/** Thème choisi par l'utilisateur ; `auto` suit le système. */
export type Theme = 'auto' | 'clair' | 'sombre'

const THEMES: readonly Theme[] = ['auto', 'clair', 'sombre']

/**
 * Thème effectivement affiché pour un choix de l'utilisateur et un thème système. Une fiche
 * s'imprime toujours en clair : un fond sombre sur papier est illisible et vide l'encre.
 */
export function colorSchemeOf(theme: Theme, system: ColorScheme, { impression = false } = {}): ColorScheme {
  if (impression || theme === 'clair') return 'light'
  if (theme === 'sombre') return 'dark'
  return system
}

const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme === value)

/**
 * Thème mémorisé par le store interface lors d'une visite précédente. Le stockage navigateur
 * peut contenir n'importe quoi (ancienne version, édition à la main) : tout ce qui n'est pas
 * un thème connu revient à suivre le système.
 */
export function persistedTheme(persisted: unknown): Theme {
  if (typeof persisted !== 'object' || persisted === null || !('theme' in persisted)) return 'auto'
  return isTheme(persisted.theme) ? persisted.theme : 'auto'
}
