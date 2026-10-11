import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMapStore } from '@/stores/map-store'

/** Boutons « Zoomer » et « Dézoomer », pour qui n'a ni molette ni pincement. */
export function ZoomControl() {
  const map = useMapStore((state) => state.map)
  return (
    <div role="group" aria-label="Zoom" className="flex flex-col">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => map?.zoomIn()}
        disabled={!map}
        aria-label="Zoomer"
        title="Zoomer"
      >
        <Plus aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => map?.zoomOut()}
        disabled={!map}
        aria-label="Dézoomer"
        title="Dézoomer"
      >
        <Minus aria-hidden />
      </Button>
    </div>
  )
}
