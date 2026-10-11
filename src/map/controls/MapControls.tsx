import { BasemapSwitcher } from './BasemapSwitcher'
import { LayerToggles } from './LayerToggles'
import { ThemeToggle } from './ThemeToggle'
import { VentesLegend } from './VentesLegend'

/**
 * Contrôles de la carte, empilés en haut à droite (sous la barre de recherche sur mobile, où
 * elle prend toute la largeur), chacun sur son propre fond. Un contrôle = une ligne.
 */
export function MapControls() {
  return (
    <div className="fixed top-16 right-3 z-10 md:top-3 flex flex-col items-end gap-2 *:rounded-lg *:border *:bg-background/85 *:p-0.5 *:shadow-lg *:backdrop-blur-md">
      <BasemapSwitcher />
      <LayerToggles />
      <ThemeToggle />
      <VentesLegend />
    </div>
  )
}
