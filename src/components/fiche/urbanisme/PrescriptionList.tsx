import type { Prescription } from '@/api/gpu'

/** Prescriptions du document d'urbanisme qui touchent la parcelle. */
export function PrescriptionList({ prescriptions }: { prescriptions: Prescription[] }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="text-xs font-medium text-muted-foreground">Prescriptions</h3>
      {prescriptions.length === 0 ? (
        <p className="text-muted-foreground">Aucune prescription ne touche la parcelle.</p>
      ) : (
        <ul className="flex flex-col">
          {prescriptions.map(({ libelle, texte }) => (
            <li
              key={`${libelle}\n${texte}`}
              className="border-b border-border/60 py-1.5 first-letter:uppercase last:border-b-0"
            >
              {libelle}
              {texte && <span className="text-muted-foreground"> : {texte}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
