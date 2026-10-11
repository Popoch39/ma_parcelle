import { BasemapSwitcher } from './BasemapSwitcher'
import { LayerToggles } from './LayerToggles'
import { SalesLegend } from './SalesLegend'
import { ThemeToggle } from './ThemeToggle'
import { ZoomControl } from './ZoomControl'

/**
 * Map controls, stacked at the top right (below the search bar on mobile, where it takes
 * the full width), each on its own background. One control = one line.
 */
export function MapControls() {
  return (
    <div className="fixed top-16 right-3 z-10 md:top-3 flex flex-col items-end gap-2 *:rounded-lg *:border *:bg-background/85 *:p-0.5 *:shadow-lg *:backdrop-blur-md">
      <BasemapSwitcher />
      <LayerToggles />
      <ThemeToggle />
      <ZoomControl />
      <SalesLegend />
    </div>
  )
}
