import { BasemapSwitcher } from './BasemapSwitcher'
import { ThemeToggle } from './ThemeToggle'

/**
 * Contrôles de la carte, empilés en haut à droite, chacun sur son propre fond. Un contrôle =
 * une ligne.
 */
export function MapControls() {
  return (
    <div className="fixed top-3 right-3 z-10 flex flex-col items-end gap-2 *:rounded-lg *:border *:bg-background/85 *:p-0.5 *:shadow-lg *:backdrop-blur-md">
      <BasemapSwitcher />
      <ThemeToggle />
    </div>
  )
}
