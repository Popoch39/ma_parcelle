import type { ReactNode } from 'react'

interface PanelShellProps {
  header: ReactNode
  children: ReactNode
}

/**
 * Contenant desktop de la fiche : panneau flottant à gauche, sous la barre de recherche (largeur
 * `--container-panneau`, que lit le cadrage du store carte). Son contenu défile sans faire bouger la carte.
 */
export function PanelShell({ header, children }: PanelShellProps) {
  return (
    <aside
      aria-label="Fiche de la parcelle"
      className="fixed top-16 bottom-3 left-3 z-10 flex w-panneau flex-col overflow-hidden rounded-xl border bg-background/85 shadow-lg backdrop-blur-md"
    >
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">{children}</div>
    </aside>
  )
}
