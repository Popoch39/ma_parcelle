import type { SalesSourceId } from '@/api/sales/source'
import { BlockQueryState } from '@/components/common/BlockQueryState'
import { Section } from '@/components/common/Section'
import { SourceLink } from '@/components/common/SourceLink'
import type { BlockProps } from '@/components/report/blocks'
import { useSales } from '@/queries/sales'
import { useMapStore } from '@/stores/map-store'
import { showSale } from '@/stores/show-sale'
import { MedianPrices } from './MedianPrices'
import { SaleList } from './SaleList'

const SOURCES: Record<SalesSourceId, { href: string; label: string }> = {
  cerema: { href: 'https://apidf-preprod.cerema.fr/', label: 'DVF (DGFiP), API DVF open data du Cerema' },
  datagouv: {
    href: 'https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/',
    label: 'DVF géolocalisées (DGFiP, Etalab), source de secours',
  },
}

/**
 * Sales block: loads the sales of the neighborhood, shows their median price per sqm and their list, and
 * links each row to its point on the map.
 */
export function SalesSection({ idu }: BlockProps) {
  const sales = useSales(idu)
  const hoveredSale = useMapStore((state) => state.hoveredSale)
  const hoverSale = useMapStore((state) => state.hoverSale)
  const source = SOURCES[sales.data?.source ?? 'cerema']
  return (
    <Section
      title="Ventes"
      block="sales"
      source={
        <SourceLink href={source.href} label={source.label} date={sales.data && `depuis ${sales.data.since}`} />
      }
    >
      <BlockQueryState query={sales} rows={6}>
        {(block) => (
          <div className="flex flex-col gap-4">
            <MedianPrices medians={block.medians} radius={block.radius} since={block.since} />
            <SaleList
              key={idu}
              sales={block.sales}
              hovered={hoveredSale}
              onHover={hoverSale}
              onOpen={showSale}
            />
          </div>
        )}
      </BlockQueryState>
    </Section>
  )
}
