import { useSyncExternalStore } from 'react'

/** Vrai tant que la media query correspond, mis à jour en direct (rotation, redimensionnement). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
