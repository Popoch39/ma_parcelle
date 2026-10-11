import { Section } from '@/components/common/Section'
import { SectionError } from '@/components/common/SectionError'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlocProps } from '@/components/fiche/blocs'
import { useBatiment } from '@/queries/batiment'
import { BatimentFacts } from './BatimentFacts'

/** Bloc Bâtiment : charge le bâti et l'altitude de la parcelle, et affiche ses faits, son chargement ou son échec. */
export function BatimentSection({ idu }: BlocProps) {
  const batiment = useBatiment(idu)
  return (
    <Section
      title="Bâtiment"
      source={
        <div className="flex flex-col items-start gap-1">
          <SourceLink
            href="https://bdnb.io/"
            label="Base de données nationale des bâtiments (CSTB)"
            date={batiment.data?.millesimeBdnb ? `millésime ${batiment.data.millesimeBdnb}` : undefined}
          />
          <SourceLink href="https://geoservices.ign.fr/rgealti" label="Altitude : RGE ALTI (IGN)" />
        </div>
      }
    >
      {batiment.isPending ? (
        <SectionSkeleton rows={4} />
      ) : batiment.isError ? (
        <SectionError error={batiment.error} onRetry={() => batiment.refetch()} />
      ) : (
        <BatimentFacts bloc={batiment.data} />
      )}
    </Section>
  )
}
