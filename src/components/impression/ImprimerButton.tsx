import { LoaderCircle, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { imprimerFiche } from '@/stores/imprimer-fiche'
import { useImpressionEnCours } from '@/stores/ui-store'

/** Ouvre l'impression du navigateur (papier ou PDF) une fois la fiche préparée. */
export function ImprimerButton({ idu }: { idu: string }) {
  const enCours = useImpressionEnCours()
  return (
    <Button variant="ghost" size="sm" onClick={() => void imprimerFiche(idu)} disabled={enCours} aria-busy={enCours}>
      {enCours ? <LoaderCircle aria-hidden className="animate-spin" /> : <Printer aria-hidden />}
      {enCours ? 'Préparation…' : 'Imprimer / PDF'}
    </Button>
  )
}
