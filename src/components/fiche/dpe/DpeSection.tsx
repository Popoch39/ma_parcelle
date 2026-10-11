import { BlocQueryState } from '@/components/common/BlocQueryState'
import { Section } from '@/components/common/Section'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlocProps } from '@/components/fiche/blocs'
import { useDpe } from '@/queries/dpe'
import { DpeList } from './DpeList'
import { DpePortee } from './DpePortee'
import { EtiquetteDistribution } from './EtiquetteDistribution'

/** Bloc DPE : charge les DPE de la parcelle (ou de son voisinage) et affiche leur répartition et leur liste. */
export function DpeSection({ idu }: BlocProps) {
  const dpe = useDpe(idu)
  return (
    <Section
      title="DPE"
      bloc="dpe"
      source={
        <SourceLink
          href="https://data.ademe.fr/datasets/dpe03existant"
          label="DPE des logements existants depuis juillet 2021 (ADEME)"
        />
      }
    >
      <BlocQueryState query={dpe} rows={7}>
        {(bloc) => (
          <div className="flex flex-col gap-4">
            <DpePortee bloc={bloc} />
            {bloc.dpe.length > 0 && (
              <>
                <EtiquetteDistribution repartition={bloc.repartition} />
                <DpeList dpe={bloc.dpe} portee={bloc.portee} />
              </>
            )}
          </div>
        )}
      </BlocQueryState>
    </Section>
  )
}
