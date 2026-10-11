import { X } from 'lucide-react'
import { PrintButton } from '@/components/print/PrintButton'
import { Button } from '@/components/ui/button'

interface ReportHeaderProps {
  idu: string
  onClose: () => void
}

/** Header of the report: the designated parcel, a way to print it and a way to close it. */
export function ReportHeader({ idu, onClose }: ReportHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Parcelle</p>
        <h1 className="truncate font-mono text-sm font-semibold">{idu}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <PrintButton idu={idu} />
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer la fiche">
          <X aria-hidden />
        </Button>
      </div>
    </header>
  )
}
