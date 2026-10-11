import type { ReactNode } from 'react'

interface PanelShellProps {
  header: ReactNode
  children: ReactNode
}

/**
 * Desktop container of the report: floating panel on the left, below the search bar (width
 * `--container-panel`, read by the map store's framing). Its content scrolls without moving the map.
 */
export function PanelShell({ header, children }: PanelShellProps) {
  return (
    <aside
      aria-label="Fiche de la parcelle"
      className="fixed top-16 bottom-3 left-3 z-10 flex w-panel flex-col overflow-hidden rounded-xl border bg-background/85 shadow-lg backdrop-blur-md"
    >
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">{children}</div>
    </aside>
  )
}
