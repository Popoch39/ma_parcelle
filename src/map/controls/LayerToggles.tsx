import { Layers } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { CALQUES } from '@/map/calques'
import { useMapStore } from '@/stores/map-store'

/** Affiche ou masque chacun des calques activables, indépendamment les uns des autres. */
export function LayerToggles() {
  const calquesActifs = useMapStore((state) => state.calquesActifs)
  const setCalqueActif = useMapStore((state) => state.setCalqueActif)
  return (
    <div role="group" aria-label="Calques" className="flex items-center gap-0.5">
      <Layers aria-hidden className="mx-1.5 size-3.5 text-muted-foreground" />
      {CALQUES.map(({ id, label }) => (
        <Toggle
          key={id}
          size="sm"
          pressed={calquesActifs.includes(id)}
          onPressedChange={(pressed) => setCalqueActif(id, pressed)}
        >
          {label}
        </Toggle>
      ))}
    </div>
  )
}
