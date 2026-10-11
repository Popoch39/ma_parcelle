import type { Prescription } from '@/api/gpu'
import { UnavailablePart } from '@/components/common/UnavailablePart'
import { PLANNING_GEOPORTAL } from './source'

/** Prescriptions of the planning document that touch the parcel, or null if their service did not respond. */
export function PrescriptionList({ prescriptions }: { prescriptions: Prescription[] | null }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="text-xs font-medium text-muted-foreground">Prescriptions</h3>
      {prescriptions === null ? (
        <UnavailablePart service="le Géoportail de l’urbanisme" href={PLANNING_GEOPORTAL} />
      ) : prescriptions.length === 0 ? (
        <p className="text-muted-foreground">Aucune prescription ne touche la parcelle.</p>
      ) : (
        <ul className="flex flex-col">
          {prescriptions.map(({ label, text }) => (
            <li
              key={`${label}\n${text}`}
              className="border-b border-border/60 py-1.5 first-letter:uppercase last:border-b-0"
            >
              {label}
              {text && <span className="text-muted-foreground"> : {text}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
