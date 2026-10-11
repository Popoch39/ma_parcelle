import { Info } from 'lucide-react'
import { RAYON_VOISINAGE, type DpeBloc } from '@/api/ademe'

const entier = new Intl.NumberFormat('fr-FR')

/**
 * D'où viennent les DPE affichés : la parcelle, ou son voisinage, présenté comme tel. Signale
 * aussi la limite de lecture atteinte.
 */
export function DpePortee({ bloc }: { bloc: DpeBloc }) {
  const { portee, dpe, limite } = bloc
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="font-medium">
        {portee === 'parcelle' ? 'DPE de la parcelle' : `DPE à moins de ${RAYON_VOISINAGE} m (voisinage)`}
      </h3>
      {portee === 'voisinage' && (
        <p className="text-muted-foreground">
          {dpe.length === 0
            ? `Aucun DPE de logement n’est localisé sur la parcelle ni à moins de ${RAYON_VOISINAGE} m.`
            : `Aucun DPE n’est localisé sur la parcelle. Voici ceux des logements situés à moins de ${RAYON_VOISINAGE} m de son centre : ils renseignent sur le voisinage, pas sur la parcelle.`}
        </p>
      )}
      {limite && (
        <p className="flex gap-2 rounded-lg border bg-muted/40 p-2 text-xs text-muted-foreground">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary" />
          Limite atteinte : {entier.format(limite.lues)} DPE lus
          {limite.total !== null && ` sur ${entier.format(limite.total)}`},{' '}
          {portee === 'parcelle' ? 'les plus récents de l’emprise de la parcelle' : 'les plus proches'}.
        </p>
      )}
    </div>
  )
}
