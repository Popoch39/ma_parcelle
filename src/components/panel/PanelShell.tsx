import type { ReactNode } from 'react'

interface PanelShellProps {
  header: ReactNode
  children: ReactNode
}

/**
 * Contenant flottant de la fiche : à gauche sur desktop, sous la barre de recherche (420 px, à
 * garder en phase avec le cadrage du store carte), en bas d'écran sur mobile. Son contenu défile sans faire bouger la carte.
 */
export function PanelShell({ header, children }: PanelShellProps) {
  return (
    <aside
      aria-label="Fiche de la parcelle"
      className="fixed z-10 flex flex-col overflow-hidden border bg-background/85 shadow-lg backdrop-blur-md max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[50svh] max-md:rounded-t-xl md:top-16 md:bottom-3 md:left-3 md:w-[420px] md:rounded-xl"
    >
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">{children}</div>
    </aside>
  )
}
