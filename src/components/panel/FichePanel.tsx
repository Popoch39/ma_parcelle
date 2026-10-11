import { Fiche } from '@/components/fiche/Fiche'
import { FicheHeader } from '@/components/fiche/FicheHeader'
import { useSelectionStore } from '@/stores/selection-store'
import { PanelShell } from './PanelShell'

/** Ouvre la fiche de la parcelle sélectionnée dans son contenant. */
export function FichePanel() {
  const idu = useSelectionStore((state) => state.idu)
  const clear = useSelectionStore((state) => state.clear)
  if (!idu) return null
  return (
    <PanelShell header={<FicheHeader idu={idu} onClose={clear} />}>
      <Fiche idu={idu} />
    </PanelShell>
  )
}
