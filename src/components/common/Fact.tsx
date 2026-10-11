import type { ReactNode } from 'react'

interface FactProps {
  label: string
  children: ReactNode
}

/** A "label: value" row of a block, to place inside a `<dl>`. */
export function Fact({ label, children }: FactProps) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-4 border-b border-border/60 py-1 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1 text-right font-medium tabular-nums">{children}</dd>
    </div>
  )
}
