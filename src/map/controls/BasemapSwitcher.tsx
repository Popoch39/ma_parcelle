import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Basemap } from '@/map/basemaps'
import { useMapStore } from '@/stores/map-store'

const OPTIONS: { value: Basemap; label: string }[] = [
  { value: 'plan', label: 'Plan' },
  { value: 'ortho', label: 'Photo aérienne' },
]

/** Choix du fond de carte : le plan, qui suit le thème, ou la photo aérienne de l'IGN. */
export function BasemapSwitcher() {
  const basemap = useMapStore((state) => state.basemap)
  const setBasemap = useMapStore((state) => state.setBasemap)
  return (
    <ToggleGroup
      aria-label="Fond de carte"
      size="sm"
      spacing={0}
      value={[basemap]}
      // Un second clic sur le fond actif le relâcherait : le groupe ne doit jamais rester vide.
      onValueChange={([value]) => {
        const next = OPTIONS.find((option) => option.value === value)
        if (next) setBasemap(next.value)
      }}
    >
      {OPTIONS.map(({ value, label }) => (
        <ToggleGroupItem key={value} value={value}>
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
