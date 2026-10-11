import { Section } from '@/components/common/Section'
import { SectionError } from '@/components/common/SectionError'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlocProps } from '@/components/fiche/blocs'
import { useRisques } from '@/queries/risques'
import { RisqueList } from './RisqueList'

/** Bloc Risques : charge ce que Géorisques dit de la parcelle et de sa commune, et l'affiche. */
export function RisquesSection({ idu }: BlocProps) {
  const risques = useRisques(idu)
  return (
    <Section
      title="Risques"
      source={
        <SourceLink href="https://www.georisques.gouv.fr/" label="Géorisques (ministère de la Transition écologique, BRGM)" />
      }
    >
      {risques.isPending ? (
        <SectionSkeleton rows={8} />
      ) : risques.isError ? (
        <SectionError error={risques.error} onRetry={() => risques.refetch()} />
      ) : (
        <RisqueList risques={risques.data.risques} />
      )}
    </Section>
  )
}
