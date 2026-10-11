import { Fiche } from '@/components/fiche/Fiche'
import { FicheHeader } from '@/components/fiche/FicheHeader'
import { useSelectionStore } from '@/stores/selection-store'
import { useUiStore } from '@/stores/ui-store'
import { BottomSheet } from './BottomSheet'
import { PanelShell } from './PanelShell'

/** Ouvre la fiche de la parcelle sélectionnée dans le contenant adapté à l'écran. */
export function FichePanel() {
  const idu = useSelectionStore((state) => state.idu)
  const reframe = useSelectionStore((state) => state.reframe)
  const clear = useSelectionStore((state) => state.clear)
  const desktop = useUiStore((state) => state.desktop)
  if (!idu) return null

  const header = <FicheHeader idu={idu} onClose={clear} />
  if (desktop) {
    return (
      <PanelShell header={header}>
        <Fiche idu={idu} />
      </PanelShell>
    )
  }
  // Un clic sur la carte ouvre en aperçu pour continuer à explorer ; une parcelle cherchée ou
  // partagée s'ouvre à mi-écran pour être lue, là où le cadrage de la carte lui laisse la place.
  return (
    <BottomSheet header={header} cranInitial={reframe ? 'mi-ecran' : 'apercu'}>
      <Fiche idu={idu} />
    </BottomSheet>
  )
}
