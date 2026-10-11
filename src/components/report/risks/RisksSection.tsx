import { BlockQueryState } from '@/components/common/BlockQueryState'
import { Section } from '@/components/common/Section'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlockProps } from '@/components/report/blocks'
import { useRisks } from '@/queries/risks'
import { RiskList } from './RiskList'

/** Risks block: loads what Géorisques says about the parcel and its municipality, and shows it. */
export function RisksSection({ idu }: BlockProps) {
  const risks = useRisks(idu)
  return (
    <Section
      title="Risques"
      block="risks"
      source={
        <SourceLink href="https://www.georisques.gouv.fr/" label="Géorisques (ministère de la Transition écologique, BRGM)" />
      }
    >
      <BlockQueryState query={risks} rows={8}>
        {(block) => <RiskList risks={block.risks} />}
      </BlockQueryState>
    </Section>
  )
}
