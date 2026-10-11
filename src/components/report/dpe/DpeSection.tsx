import { BlockQueryState } from '@/components/common/BlockQueryState'
import { Section } from '@/components/common/Section'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlockProps } from '@/components/report/blocks'
import { useDpe } from '@/queries/dpe'
import { DpeList } from './DpeList'
import { DpeScope } from './DpeScope'
import { GradeDistribution } from './GradeDistribution'

/** DPE block: loads the DPEs of the parcel (or of its neighborhood) and shows their distribution and their list. */
export function DpeSection({ idu }: BlockProps) {
  const dpe = useDpe(idu)
  return (
    <Section
      title="DPE"
      block="dpe"
      source={
        <SourceLink
          href="https://data.ademe.fr/datasets/dpe03existant"
          label="DPE des logements existants depuis juillet 2021 (ADEME)"
        />
      }
    >
      <BlockQueryState query={dpe} rows={7}>
        {(block) => (
          <div className="flex flex-col gap-4">
            <DpeScope block={block} />
            {block.dpes.length > 0 && (
              <>
                <GradeDistribution distribution={block.distribution} />
                <DpeList dpes={block.dpes} scope={block.scope} />
              </>
            )}
          </div>
        )}
      </BlockQueryState>
    </Section>
  )
}
