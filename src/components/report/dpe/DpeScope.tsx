import { Info } from 'lucide-react'
import { NEIGHBORHOOD_RADIUS, type DpeBlock } from '@/api/ademe'

const integer = new Intl.NumberFormat('fr-FR')

/**
 * Where the displayed DPEs come from: the parcel, or its neighborhood, presented as such. Also
 * flags when the read limit was reached.
 */
export function DpeScope({ block }: { block: DpeBlock }) {
  const { scope, dpes, limit } = block
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="font-medium">
        {scope === 'parcel' ? 'DPE de la parcelle' : `DPE à moins de ${NEIGHBORHOOD_RADIUS} m (voisinage)`}
      </h3>
      {scope === 'neighborhood' && (
        <p className="text-muted-foreground">
          {dpes.length === 0
            ? `Aucun DPE de logement n’est localisé sur la parcelle ni à moins de ${NEIGHBORHOOD_RADIUS} m.`
            : `Aucun DPE n’est localisé sur la parcelle. Voici ceux des logements situés à moins de ${NEIGHBORHOOD_RADIUS} m de son centre : ils renseignent sur le voisinage, pas sur la parcelle.`}
        </p>
      )}
      {limit && (
        <p className="flex gap-2 rounded-lg border bg-muted/40 p-2 text-xs text-muted-foreground">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary" />
          Limite atteinte : {integer.format(limit.read)} DPE lus
          {limit.total !== null && ` sur ${integer.format(limit.total)}`},{' '}
          {scope === 'parcel' ? 'les plus récents de l’emprise de la parcelle' : 'les plus proches'}.
        </p>
      )}
    </div>
  )
}
