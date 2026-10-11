/**
 * Écran desktop, où la fiche s'ouvre en panneau latéral plutôt qu'en bottom sheet : le point de
 * rupture `md` de Tailwind (48rem), celui des classes `md:` de la mise en page.
 */
export const DESKTOP = '(min-width: 48rem)'

/** Largeur du panneau de la fiche sur desktop, en px, lue dans le thème CSS (`--container-panneau`). */
export function largeurPanneau(): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--container-panneau'))
}
