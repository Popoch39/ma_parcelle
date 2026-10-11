import { Section } from '@/components/common/Section'
import { SectionError } from '@/components/common/SectionError'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlocProps } from '@/components/fiche/blocs'
import { useUrbanisme } from '@/queries/urbanisme'
import { useMapStore } from '@/stores/map-store'
import { PerimetreAbfAlert } from './PerimetreAbfAlert'
import { PrescriptionList } from './PrescriptionList'
import { ReglementationView } from './ReglementationView'
import { ServitudeList } from './ServitudeList'
import { GEOPORTAIL_URBANISME } from './source'

/**
 * Bloc Urbanisme : charge ce que le document d'urbanisme et les servitudes disent de la
 * parcelle, l'affiche, et montre sur la carte l'emprise de la servitude survolée.
 */
export function UrbanismeSection({ idu }: BlocProps) {
  const urbanisme = useUrbanisme(idu)
  const survolerServitude = useMapStore((state) => state.survolerServitude)
  return (
    <Section
      title="Urbanisme"
      source={<SourceLink href={GEOPORTAIL_URBANISME} label="Géoportail de l’urbanisme" />}
    >
      {urbanisme.isPending ? (
        <SectionSkeleton rows={6} />
      ) : urbanisme.isError ? (
        <SectionError error={urbanisme.error} onRetry={() => urbanisme.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          {urbanisme.data.perimetreAbf && <PerimetreAbfAlert perimetreAbf={urbanisme.data.perimetreAbf} />}
          <ReglementationView reglementation={urbanisme.data.reglementation} />
          <PrescriptionList prescriptions={urbanisme.data.prescriptions} />
          <ServitudeList servitudes={urbanisme.data.servitudes} onSurvol={survolerServitude} />
        </div>
      )}
    </Section>
  )
}
