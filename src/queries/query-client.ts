import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/fetch-json'

const HOUR = 60 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // This data changes weekly at best, and several APIs have undocumented quotas: a report
      // already seen during the session is not requested again.
      staleTime: 12 * HOUR,
      gcTime: 12 * HOUR,
      refetchOnWindowFocus: false,
      // Only transient failures deserve a retry, not data that cannot be found.
      retry: (failureCount, error) => failureCount < 2 && isTransient(error),
    },
  },
})

function isTransient(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false
  if (error.kind === 'timeout' || error.kind === 'network') return true
  return error.kind === 'http' && error.status !== undefined && (error.status >= 500 || error.status === 429)
}
