import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Basemap } from '@/map/basemaps'
import { useMapStore } from '@/stores/map-store'

const OPTIONS: { value: Basemap; label: string }[] = [
  { value: 'plan', label: 'Plan' },
  { value: 'ortho', label: 'Photo aérienne' },
]

/** Basemap choice: the plan, which follows the theme, or the IGN aerial photo. */
export function BasemapSwitcher() {
  const basemap = useMapStore((state) => state.basemap)
  const setBasemap = useMapStore((state) => state.setBasemap)
  return (
    <ToggleGroup
      aria-label="Fond de carte"
      size="sm"
      spacing={0}
      value={[basemap]}
      // A second click on the active basemap would release it: the group must never stay empty.
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
