import { Landmark } from 'lucide-react'
import type { PerimetreAbf } from '@/api/gpu'

/** Alerte d'une parcelle aux abords d'un ou plusieurs monuments historiques, qu'elle nomme. */
export function PerimetreAbfAlert({ perimetreAbf: { monuments } }: { perimetreAbf: PerimetreAbf }) {
  return (
    <aside
      role="note"
      className="flex gap-2.5 rounded-lg border border-vigilance/40 bg-vigilance/10 p-3 text-sm"
    >
      <Landmark aria-hidden className="mt-0.5 size-4 shrink-0 text-vigilance" />
      <div className="flex flex-col gap-1 text-muted-foreground">
        <p className="font-medium text-foreground">Périmètre ABF</p>
        <p>{abordsDe(monuments)}</p>
        {monuments.length > 1 && (
          <ul className="list-disc pl-4">
            {monuments.map((monument) => (
              <li key={monument}>{monument}</li>
            ))}
          </ul>
        )}
        <p>
          Les travaux visibles depuis l’espace public y sont soumis à l’avis de l’architecte des
          bâtiments de France.
        </p>
      </div>
    </aside>
  )
}

function abordsDe(monuments: string[]): string {
  if (monuments.length === 0) return 'La parcelle est aux abords d’un monument historique.'
  if (monuments.length === 1) return `La parcelle est aux abords du monument historique « ${monuments[0]} ».`
  return `La parcelle est aux abords de ${monuments.length} monuments historiques :`
}
