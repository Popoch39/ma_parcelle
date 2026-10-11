import type { PorteeRisque, Risque } from '@/api/georisques'
import { RisqueItem } from './RisqueItem'

const PORTEES: ReadonlyArray<{ portee: PorteeRisque; titre: string }> = [
  { portee: 'emplacement', titre: 'À l’emplacement de la parcelle et autour' },
  { portee: 'commune', titre: 'Dans la commune' },
]

/** Risques du bloc, ceux de l'emplacement de la parcelle puis ceux de sa commune. */
export function RisqueList({ risques }: { risques: Risque[] }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      {PORTEES.map(({ portee, titre }) => {
        const groupe = risques.filter((risque) => risque.portee === portee)
        if (groupe.length === 0) return null
        return (
          <div key={portee} className="flex flex-col gap-1.5">
            <h3 className="text-xs font-medium text-muted-foreground">{titre}</h3>
            <ul className="flex flex-col">
              {groupe.map((risque) => (
                <RisqueItem key={risque.id} risque={risque} />
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
