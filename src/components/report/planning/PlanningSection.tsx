import { BlockQueryState } from '@/components/common/BlockQueryState'
import { Section } from '@/components/common/Section'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlockProps } from '@/components/report/blocks'
import { usePlanning } from '@/queries/planning'
import { useMapStore } from '@/stores/map-store'
import { AbfPerimeterAlert } from './AbfPerimeterAlert'
import { EasementList } from './EasementList'
import { PrescriptionList } from './PrescriptionList'
import { RegulationView } from './RegulationView'
import { PLANNING_GEOPORTAL } from './source'

/**
 * Planning block: loads what the planning document and the easements say about the
 * parcel, shows it, and shows on the map the geometry of the hovered easement.
 */
export function PlanningSection({ idu }: BlockProps) {
  const planning = usePlanning(idu)
  const hoveredEasement = useMapStore((state) => state.hoveredEasement)
  const hoverEasement = useMapStore((state) => state.hoverEasement)
  return (
    <Section
      title="Urbanisme"
      block="planning"
      source={<SourceLink href={PLANNING_GEOPORTAL} label="Géoportail de l’urbanisme" />}
    >
      <BlockQueryState query={planning} rows={6}>
        {(block) => (
          <div className="flex flex-col gap-4">
            {block.abfPerimeter && <AbfPerimeterAlert abfPerimeter={block.abfPerimeter} />}
            <RegulationView regulation={block.regulation} />
            <PrescriptionList prescriptions={block.prescriptions} />
            <EasementList easements={block.easements} hovered={hoveredEasement} onHover={hoverEasement} />
          </div>
        )}
      </BlockQueryState>
    </Section>
  )
}
