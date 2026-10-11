import type { SourceVentesId } from '@/api/ventes/source'
import { Section } from '@/components/common/Section'
import { SectionError } from '@/components/common/SectionError'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlocProps } from '@/components/fiche/blocs'
import type { Vente } from '@/lib/ventes'
import { useVentes } from '@/queries/ventes'
import { useMapStore } from '@/stores/map-store'
import { useUiStore } from '@/stores/ui-store'
import { PrixMedianStat } from './PrixMedianStat'
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
  const ouvrirVente = useMapStore((state) => state.ouvrirVente)
  const setCalqueActif = useMapStore((state) => state.setCalqueActif)
  const montrerPoint = useMapStore((state) => state.montrerPoint)
  const sheetCran = useUiStore((state) => state.sheetCran)
  const setSheetCran = useUiStore((state) => state.setSheetCran)
  const montrerVente = (vente: Vente) => {
    setCalqueActif('ventes', true)
    ouvrirVente(vente.id)
    // Sur mobile, la fiche en plein écran cache toute la carte.
    if (sheetCran === 'plein-ecran') setSheetCran('mi-ecran')
    montrerPoint(vente.position)
  }
  const source = SOURCES[ventes.data?.source ?? 'cerema']
  return (
    <Section
      title="Ventes"
      source={
        <SourceLink href={source.href} label={source.label} date={ventes.data && `depuis ${ventes.data.depuis}`} />
      }
    >
      {ventes.isPending ? (
        <SectionSkeleton rows={6} />
      ) : ventes.isError ? (
        <SectionError error={ventes.error} onRetry={() => ventes.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">Prix médian au m² bâti</h3>
            <div className="grid grid-cols-2 gap-2">
              <PrixMedianStat type="appartement" median={ventes.data.medianes.appartement} />
              <PrixMedianStat type="maison" median={ventes.data.medianes.maison} />
            </div>
            <p className="text-xs text-muted-foreground">
              Ventes d’un seul logement, dépendances comprises, à moins de {ventes.data.rayon} m de la parcelle depuis{' '}
              {ventes.data.depuis} : un repère du voisinage, pas une estimation de la parcelle.
            </p>
          </div>
          <VenteList
            key={idu}
            ventes={ventes.data.ventes}
            survolee={venteSurvolee}
            onSurvol={survolerVente}
            onOuvrir={montrerVente}
          />
        </div>
      )}
    </Section>
  )
}
