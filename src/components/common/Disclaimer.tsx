import { Info } from 'lucide-react'

/** Reminds that the report is indicative: only a planning certificate (« certificat d'urbanisme ») binds the administration. */
export function Disclaimer() {
  return (
    <p role="note" className="flex gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Info aria-hidden className="mt-px size-3.5 shrink-0" />
      <span>
        Fiche indicative, établie à partir de données publiques ouvertes. Elle ne remplace pas un
        certificat d’urbanisme, qui se demande à la mairie.
      </span>
    </p>
  )
}
