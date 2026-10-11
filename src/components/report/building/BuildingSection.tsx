import { BlockQueryState } from '@/components/common/BlockQueryState'
import { Section } from '@/components/common/Section'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlockProps } from '@/components/report/blocks'
import { useBuilding } from '@/queries/building'
import { BuildingFacts } from './BuildingFacts'

/** Building block: loads the built fabric and the elevation of the parcel, and shows its facts, its loading or its failure. */
export function BuildingSection({ idu }: BlockProps) {
  const building = useBuilding(idu)
  return (
    <Section
      title="Bâtiment"
      block="building"
      source={
        <div className="flex flex-col items-start gap-1">
          <SourceLink
            href="https://bdnb.io/"
            label="Base de données nationale des bâtiments (CSTB)"
            date={building.data?.bdnbVintage ? `millésime ${building.data.bdnbVintage}` : undefined}
          />
          <SourceLink href="https://geoservices.ign.fr/rgealti" label="Altitude : RGE ALTI (IGN)" />
        </div>
      }
    >
      <BlockQueryState query={building} rows={4}>
        {(block) => <BuildingFacts block={block} />}
      </BlockQueryState>
    </Section>
  )
}
