import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Vente } from '@/lib/ventes'
import { VenteRow } from './VenteRow'

// Un quartier dense compte plus d'un millier de ventes en cinq ans : on les déroule par paquets.
const PAR_PAQUET = 20

interface VenteListProps {
  ventes: Vente[]
  /** Vente mise en évidence (son `id`), depuis la liste ou depuis la carte. */
  survolee: string | null
  /** Vente sous le pointeur ou le focus (son `id`), ou null quand ils la quittent. */
  onSurvol: (id: string | null) => void
  /** Montre une vente sur la carte. */
  onOuvrir: (vente: Vente) => void
}

/** Toutes les ventes du voisinage, de la plus récente à la plus ancienne, exclues comprises. */
export function VenteList({ ventes, survolee, onSurvol, onOuvrir }: VenteListProps) {
  const [affichees, setAffichees] = useState(PAR_PAQUET)
  const restantes = ventes.length - affichees
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="text-xs font-medium text-muted-foreground">
        {ventes.length === 1 ? '1 vente dans le voisinage' : `${ventes.length} ventes dans le voisinage`}
      </h3>
      {ventes.length === 0 ? (
        <p className="text-muted-foreground">Aucune vente publiée dans le voisinage sur la période.</p>
      ) : (
        <ul className="flex flex-col">
          {ventes.slice(0, affichees).map((vente) => (
            <VenteRow
              key={vente.id}
              vente={vente}
              survolee={vente.id === survolee}
              onSurvol={(survol) => onSurvol(survol ? vente.id : null)}
              onOuvrir={() => onOuvrir(vente)}
            />
          ))}
        </ul>
      )}
      {restantes > 0 && (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setAffichees(affichees + PAR_PAQUET)}>
          Afficher {Math.min(restantes, PAR_PAQUET)} ventes de plus
        </Button>
      )}
    </div>
  )
}
