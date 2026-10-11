import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { errorMessage } from './error-message'

interface SectionErrorProps {
  error: unknown
  /** Relance le chargement du bloc, typiquement le `refetch` de sa query. */
  onRetry?: () => void
}

/** État d'échec d'un bloc : le message, et de quoi réessayer. Le lien vers la source reste dans `Section`. */
export function SectionError({ error, onRetry }: SectionErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 text-sm">
      <p className="flex gap-2 text-destructive">
        <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
        {errorMessage(error)}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="print:hidden">
          Réessayer
        </Button>
      )}
    </div>
  )
}
