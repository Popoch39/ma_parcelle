import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/fetch-json'

const HOUR = 60 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ces données changent au mieux chaque semaine, et plusieurs API ont des quotas non
      // documentés : on ne redemande pas une fiche déjà vue pendant la session.
      staleTime: 12 * HOUR,
      gcTime: 12 * HOUR,
      refetchOnWindowFocus: false,
      // Seules les pannes passagères méritent un nouvel essai, pas une donnée introuvable.
      retry: (failureCount, error) => failureCount < 2 && isTransient(error),
    },
  },
})

function isTransient(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false
  if (error.kind === 'timeout' || error.kind === 'network') return true
  return error.kind === 'http' && error.status !== undefined && (error.status >= 500 || error.status === 429)
}
