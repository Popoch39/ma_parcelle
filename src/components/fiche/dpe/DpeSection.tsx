import { Section } from '@/components/common/Section'
import { SectionError } from '@/components/common/SectionError'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'
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
      source={
        <SourceLink
          href="https://data.ademe.fr/datasets/dpe03existant"
          label="DPE des logements existants depuis juillet 2021 (ADEME)"
        />
      }
    >
      {dpe.isPending ? (
        <SectionSkeleton rows={7} />
      ) : dpe.isError ? (
        <SectionError error={dpe.error} onRetry={() => dpe.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <DpePortee bloc={dpe.data} />
          {dpe.data.dpe.length > 0 && (
            <>
              <EtiquetteDistribution repartition={dpe.data.repartition} />
              <DpeList dpe={dpe.data.dpe} portee={dpe.data.portee} />
            </>
          )}
        </div>
      )}
    </Section>
  )
}
