import type { ReactNode } from 'react'

interface PanelShellProps {
  header: ReactNode
  children: ReactNode
}

/**
 * Contenant desktop de la fiche : panneau flottant à gauche (420 px, à garder en phase avec le
 * cadrage du store carte). Son contenu défile sans faire bouger la carte.
 */
export function PanelShell({ header, children }: PanelShellProps) {
  return (
    <aside
      aria-label="Fiche de la parcelle"
      className="fixed top-3 bottom-3 left-3 z-10 flex w-[420px] flex-col overflow-hidden rounded-xl border bg-background/85 shadow-lg backdrop-blur-md"
    >
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">{children}</div>
    </aside>
  )
}
