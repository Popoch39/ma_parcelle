import { LoaderCircle, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { printReport } from '@/stores/print-report'
import { useIsPrinting } from '@/stores/ui-store'

/** Opens the browser's print dialog (paper or PDF) once the report is prepared. */
export function PrintButton({ idu }: { idu: string }) {
  const printing = useIsPrinting()
  return (
    <Button variant="ghost" size="sm" onClick={() => void printReport(idu)} disabled={printing} aria-busy={printing}>
      {printing ? <LoaderCircle aria-hidden className="animate-spin" /> : <Printer aria-hidden />}
      {printing ? 'Préparation…' : 'Imprimer / PDF'}
    </Button>
  )
}
