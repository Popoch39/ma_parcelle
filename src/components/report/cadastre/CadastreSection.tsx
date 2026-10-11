import { BlockQueryState } from '@/components/common/BlockQueryState'
import { Section } from '@/components/common/Section'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlockProps } from '@/components/report/blocks'
import { useParcel } from '@/queries/parcel'
import { CadastreFacts } from './CadastreFacts'

/** Cadastre block: loads the parcel and shows its facts, its loading or its failure. */
export function CadastreSection({ idu }: BlockProps) {
  const parcel = useParcel(idu)
  return (
    <Section
      title="Cadastre"
      block="cadastre"
      source={<SourceLink href="https://www.cadastre.gouv.fr/" label="Plan cadastral (DGFiP, IGN)" />}
    >
      <BlockQueryState query={parcel} rows={7}>
        {(data) => <CadastreFacts parcel={data} />}
      </BlockQueryState>
    </Section>
  )
}
