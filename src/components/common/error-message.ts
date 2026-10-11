import { ApiError } from '@/api/fetch-json'

/**
 * Displayable message for the failure of a block. Domain errors of the loaders (e.g.
 * `ParcelError`) already carry a French message; API failures are translated here.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'timeout':
        return 'Le service met trop de temps à répondre.'
      case 'network':
        return 'Service injoignable : vérifiez la connexion.'
      case 'invalid-json':
        return 'Le service a renvoyé une réponse illisible (maintenance ?).'
      case 'aborted':
        return 'Chargement interrompu.'
      case 'http':
        return error.status === 429
          ? 'Le service est saturé de demandes : réessayez dans un instant.'
          : `Le service a répondu par une erreur (${error.status}).`
    }
  }
  return error instanceof Error ? error.message : 'Erreur inattendue.'
}
