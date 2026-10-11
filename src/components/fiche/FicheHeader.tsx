import { X } from 'lucide-react'
import { ImprimerButton } from '@/components/impression/ImprimerButton'
import { Button } from '@/components/ui/button'

interface FicheHeaderProps {
  idu: string
  onClose: () => void
}

/** En-tête de la fiche : la parcelle désignée, de quoi l'imprimer et de quoi fermer. */
export function FicheHeader({ idu, onClose }: FicheHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Parcelle</p>
        <h1 className="truncate font-mono text-sm font-semibold">{idu}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ImprimerButton idu={idu} />
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer la fiche">
          <X aria-hidden />
        </Button>
      </div>
    </header>
  )
}
