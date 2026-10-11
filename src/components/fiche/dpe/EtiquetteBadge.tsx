import { cn } from 'cn'
import type { Etiquette } from '@/api/ademe'
import { COULEURS_ETIQUETTE, NOM_ETIQUETTE, type TypeEtiquette } from './etiquettes'

interface EtiquetteBadgeProps {
  etiquette: Etiquette | null
  type: TypeEtiquette
}

/** Lettre d'une étiquette du DPE sur sa couleur réglementaire ; son type est dit aux lecteurs d'écran. */
export function EtiquetteBadge({ etiquette, type }: EtiquetteBadgeProps) {
  const couleur = etiquette && COULEURS_ETIQUETTE[type][etiquette]
  return (
    <span
      title={`Étiquette ${NOM_ETIQUETTE[type]}`}
      // Le liseré garde la pastille visible quand sa couleur se fond dans le fond sombre.
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded text-xs font-bold ring-1 ring-border ring-inset',
        couleur ? couleur.texte : 'text-muted-foreground',
      )}
      style={couleur ? { backgroundColor: couleur.fond } : undefined}
    >
      <span className="sr-only">Étiquette {NOM_ETIQUETTE[type]} </span>
      {etiquette ?? '?'}
    </span>
  )
}
