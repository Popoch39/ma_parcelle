import { LazyReport } from '@/components/report/LazyReport'
import { ReportHeader } from '@/components/report/ReportHeader'
import { useSelectionStore } from '@/stores/selection-store'
import { useUiStore } from '@/stores/ui-store'
import { BottomSheet } from './BottomSheet'
import { PanelShell } from './PanelShell'

/** Opens the selected parcel's report in the container suited to the screen. */
export function ReportPanel() {
  const idu = useSelectionStore((state) => state.idu)
  const reframe = useSelectionStore((state) => state.reframe)
  const clear = useSelectionStore((state) => state.clear)
  const desktop = useUiStore((state) => state.desktop)
  if (!idu) return null

  const header = <ReportHeader idu={idu} onClose={clear} />
  if (desktop) {
    return (
      <PanelShell header={header}>
        <LazyReport idu={idu} />
      </PanelShell>
    )
  }
  // A click on the map opens in peek to keep exploring; a searched or shared parcel opens
  // at half screen to be read, where the map's framing leaves room for it.
  return (
    <BottomSheet header={header} initialSnap={reframe ? 'half' : 'peek'}>
      <LazyReport idu={idu} />
    </BottomSheet>
  )
}
