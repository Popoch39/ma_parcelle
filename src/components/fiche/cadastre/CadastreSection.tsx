import { Section } from '@/components/common/Section'
import { SectionError } from '@/components/common/SectionError'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlocProps } from '@/components/fiche/blocs'
import { useParcelle } from '@/queries/parcelle'
import { CadastreFacts } from './CadastreFacts'

/** Bloc Cadastre : charge la parcelle et affiche ses faits, son chargement ou son échec. */
export function CadastreSection({ idu }: BlocProps) {
  const parcelle = useParcelle(idu)
  return (
    <Section
      title="Cadastre"
      source={<SourceLink href="https://www.cadastre.gouv.fr/" label="Plan cadastral (DGFiP, IGN)" />}
    >
      {parcelle.isPending ? (
        <SectionSkeleton rows={7} />
      ) : parcelle.isError ? (
        <SectionError error={parcelle.error} onRetry={() => parcelle.refetch()} />
      ) : (
        <CadastreFacts parcelle={parcelle.data} />
      )}
    </Section>
  )
}
