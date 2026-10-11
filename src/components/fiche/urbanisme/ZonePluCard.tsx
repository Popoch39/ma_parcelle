import type { Zone } from '@/api/gpu'
import { Fact } from '@/components/common/Fact'
import { ReglementLink } from './ReglementLink'

const pourcentage = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 })

interface ZonePluCardProps {
  zone: Zone
  /** Vrai quand la parcelle est à cheval sur plusieurs zones. */
  montrerPart: boolean
}

/** Une zone du document d'urbanisme (ou un secteur de carte communale) qui couvre la parcelle. */
export function ZonePluCard({ zone, montrerPart }: ZonePluCardProps) {
  return (
    <article className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
      <header>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold">
            {zone.code}
            {zone.famille && <span className="font-normal"> · {zone.famille}</span>}
          </h3>
          {montrerPart && (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {pourcentage.format(zone.part)} de la parcelle
            </span>
          )}
        </div>
        {zone.libelle && <p className="text-sm text-muted-foreground">{zone.libelle}</p>}
      </header>
      <dl className="text-sm">
        <Fact label="Code">{zone.code}</Fact>
        <Fact label="Type">{zone.type}</Fact>
      </dl>
      {zone.reglement && <ReglementLink href={zone.reglement} />}
    </article>
  )
}
