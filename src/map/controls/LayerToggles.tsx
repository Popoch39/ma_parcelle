import { Layers } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { OVERLAYS } from '@/map/overlays'
import { useMapStore } from '@/stores/map-store'

/** Shows or hides each of the toggleable overlays, independently of one another. */
export function LayerToggles() {
  const activeOverlays = useMapStore((state) => state.activeOverlays)
  const setOverlayActive = useMapStore((state) => state.setOverlayActive)
  return (
    <div role="group" aria-label="Calques" className="flex items-center gap-0.5">
      <Layers aria-hidden className="mx-1.5 size-3.5 text-muted-foreground" />
      {OVERLAYS.map(({ id, label }) => (
        <Toggle
          key={id}
          size="sm"
          pressed={activeOverlays.includes(id)}
          onPressedChange={(pressed) => setOverlayActive(id, pressed)}
        >
          {label}
        </Toggle>
      ))}
    </div>
  )
}
