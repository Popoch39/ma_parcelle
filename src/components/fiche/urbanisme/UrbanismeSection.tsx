import { Section } from '@/components/common/Section'
import { SectionError } from '@/components/common/SectionError'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlocProps } from '@/components/fiche/blocs'
import { useUrbanisme } from '@/queries/urbanisme'
import { PrescriptionList } from './PrescriptionList'
import { ReglementationView } from './ReglementationView'

/** Bloc Urbanisme : charge ce que le document d'urbanisme dit de la parcelle et l'affiche. */
export function UrbanismeSection({ idu }: BlocProps) {
  const urbanisme = useUrbanisme(idu)
  return (
    <Section
      title="Urbanisme"
      source={<SourceLink href="https://www.geoportail-urbanisme.gouv.fr/" label="Géoportail de l’urbanisme" />}
    >
      {urbanisme.isPending ? (
        <SectionSkeleton rows={6} />
      ) : urbanisme.isError ? (
        <SectionError error={urbanisme.error} onRetry={() => urbanisme.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <ReglementationView reglementation={urbanisme.data.reglementation} />
          <PrescriptionList prescriptions={urbanisme.data.prescriptions} />
        </div>
      )}
    </Section>
  )
}
