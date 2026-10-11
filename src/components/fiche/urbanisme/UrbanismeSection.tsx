import { BlocQueryState } from '@/components/common/BlocQueryState'
import { Section } from '@/components/common/Section'
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
      bloc="urbanisme"
      source={<SourceLink href={GEOPORTAIL_URBANISME} label="Géoportail de l’urbanisme" />}
    >
      <BlocQueryState query={urbanisme} rows={6}>
        {(bloc) => (
          <div className="flex flex-col gap-4">
            {bloc.perimetreAbf && <PerimetreAbfAlert perimetreAbf={bloc.perimetreAbf} />}
            <ReglementationView reglementation={bloc.reglementation} />
            <PrescriptionList prescriptions={bloc.prescriptions} />
            <ServitudeList servitudes={bloc.servitudes} onSurvol={survolerServitude} />
          </div>
        )}
      </BlocQueryState>
    </Section>
  )
}
