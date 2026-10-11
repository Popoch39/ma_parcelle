import { useEffect } from 'react'
import { useParcel } from '@/queries/parcel'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'

/** Brings the map to the parcel when the selection asks for it (URL, history, search). */
export function SelectionFraming() {
  const idu = useSelectionStore((state) => state.idu)
  const reframe = useSelectionStore((state) => state.reframe)
  if (!idu || !reframe) return null
  return <FrameParcel key={idu} idu={idu} />
}

function FrameParcel({ idu }: { idu: string }) {
  const bbox = useParcel(idu).data?.bbox
  const map = useMapStore((state) => state.map)
  const fitBBox = useMapStore((state) => state.fitBBox)

  useEffect(() => {
    if (map && bbox) fitBBox(bbox)
  }, [map, bbox, fitBBox])

  return null
}
