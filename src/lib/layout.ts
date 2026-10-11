/**
 * Desktop screen, where the report opens as a side panel rather than a bottom sheet: Tailwind's
 * `md` breakpoint (48rem), the one of the layout's `md:` classes.
 */
export const DESKTOP = '(min-width: 48rem)'

/** Width of the report panel on desktop, in px, read from the CSS theme (`--container-panel`). */
export function panelWidth(): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--container-panel'))
}
