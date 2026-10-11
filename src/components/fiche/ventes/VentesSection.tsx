import type { SourceVentesId } from '@/api/ventes/source'
import { BlocQueryState } from '@/components/common/BlocQueryState'
import { Section } from '@/components/common/Section'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlocProps } from '@/components/fiche/blocs'
import { useVentes } from '@/queries/ventes'
import { useMapStore } from '@/stores/map-store'
import { montrerVente } from '@/stores/montrer-vente'
import { PrixMedians } from './PrixMedians'
import { VenteList } from './VenteList'

const SOURCES: Record<SourceVentesId, { href: string; label: string }> = {
  cerema: { href: 'https://apidf-preprod.cerema.fr/', label: 'DVF (DGFiP), API DVF open data du Cerema' },
  datagouv: {
    href: 'https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/',
    label: 'DVF géolocalisées (DGFiP, Etalab), source de secours',
  },
}

/**
 * Bloc Ventes : charge les ventes du voisinage, affiche leur prix médian au m² et leur liste, et
 * relie chaque ligne à son point sur la carte.
 */
export function VentesSection({ idu }: BlocProps) {
  const ventes = useVentes(idu)
  const venteSurvolee = useMapStore((state) => state.venteSurvolee)
  const survolerVente = useMapStore((state) => state.survolerVente)
  const source = SOURCES[ventes.data?.source ?? 'cerema']
  return (
    <Section
      title="Ventes"
      bloc="ventes"
      source={
        <SourceLink href={source.href} label={source.label} date={ventes.data && `depuis ${ventes.data.depuis}`} />
      }
    >
      <BlocQueryState query={ventes} rows={6}>
        {(bloc) => (
          <div className="flex flex-col gap-4">
            <PrixMedians medianes={bloc.medianes} rayon={bloc.rayon} depuis={bloc.depuis} />
            <VenteList
              key={idu}
              ventes={bloc.ventes}
              survolee={venteSurvolee}
              onSurvol={survolerVente}
              onOuvrir={montrerVente}
            />
          </div>
        )}
      </BlocQueryState>
    </Section>
  )
}
