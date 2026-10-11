import type { Reglementation } from '@/api/gpu'
import { CarteCommunaleNotice } from './CarteCommunaleNotice'
import { DocumentUrbanismeFacts } from './DocumentUrbanismeFacts'
import { RnuNotice } from './RnuNotice'
import { SansZoneNotice } from './SansZoneNotice'
import { ZonePluCard } from './ZonePluCard'

/** Règles d'usage du sol de la parcelle : son document et ses zones, ou l'explication de leur absence. */
export function ReglementationView({ reglementation }: { reglementation: Reglementation }) {
  switch (reglementation.regime) {
    case 'rnu':
      return <RnuNotice />
    case 'sans-zone':
      return <SansZoneNotice />
    case 'document': {
      const { document, zones } = reglementation
      return (
        <div className="flex flex-col gap-3">
          {document && <DocumentUrbanismeFacts document={document} />}
          {zones.map((zone, index) => (
            <ZonePluCard key={`${zone.code}-${index}`} zone={zone} montrerPart={zones.length > 1} />
          ))}
          {document?.type === 'CC' && <CarteCommunaleNotice />}
        </div>
      )
    }
  }
}
