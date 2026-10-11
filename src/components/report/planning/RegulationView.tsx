import type { Regulation } from '@/api/gpu'
import { MunicipalMapNotice } from './MunicipalMapNotice'
import { NoZoneNotice } from './NoZoneNotice'
import { PlanningDocumentFacts } from './PlanningDocumentFacts'
import { RnuNotice } from './RnuNotice'
import { ZonePluCard } from './ZonePluCard'

/** Land use rules of the parcel: its document and its zones, or the explanation of their absence. */
export function RegulationView({ regulation }: { regulation: Regulation }) {
  switch (regulation.regime) {
    case 'rnu':
      return <RnuNotice />
    case 'no-zone':
      return <NoZoneNotice />
    case 'document': {
      const { document, zones } = regulation
      return (
        <div className="flex flex-col gap-3">
          {document && <PlanningDocumentFacts document={document} />}
          {zones.map((zone, index) => (
            <ZonePluCard key={`${zone.code}-${index}`} zone={zone} showShare={zones.length > 1} />
          ))}
          {document?.type === 'CC' && <MunicipalMapNotice />}
        </div>
      )
    }
  }
}
