import { useEffect } from 'react'
import { useParcelle } from '@/queries/parcelle'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'

/** Amène la carte sur la parcelle quand la sélection le demande (URL, historique, recherche). */
export function SelectionFraming() {
  const idu = useSelectionStore((state) => state.idu)
  const reframe = useSelectionStore((state) => state.reframe)
  if (!idu || !reframe) return null
  return <FrameParcelle key={idu} idu={idu} />
}

function FrameParcelle({ idu }: { idu: string }) {
  const emprise = useParcelle(idu).data?.emprise
  const map = useMapStore((state) => state.map)
  const fitEmprise = useMapStore((state) => state.fitEmprise)

  useEffect(() => {
    if (map && emprise) fitEmprise(emprise)
  }, [map, emprise, fitEmprise])

  return null
}
