import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

interface PlanningNoticeProps {
  title: string
  children: ReactNode
}

/** Box that explains a case where the block has no zone to show, rather than leaving it empty. */
export function PlanningNotice({ title, children }: PlanningNoticeProps) {
  return (
    <aside className="flex gap-2.5 rounded-lg border bg-muted/40 p-3 text-sm">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </aside>
  )
}
