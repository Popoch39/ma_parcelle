import { cn } from 'cn'
import { ChevronDown } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import type { BlockId } from '@/components/report/blocks'
import { useBlockCollapsed, useUiStore } from '@/stores/ui-store'

interface SectionProps {
  title: string
  /** Report block, collapsed and expanded by a click on its title. The summary is not one. */
  block?: BlockId
  /**
   * Link to the official source, shown whatever the loading state (`SourceLink`).
   * Only the summary, which cites the blocks, has none.
   */
  source?: ReactNode
  children: ReactNode
}

/** Common frame of a report block: title (which collapses it), content, source. */
export function Section({ title, block, source, children }: SectionProps) {
  const titleId = useId()
  const contentId = useId()
  const collapsed = useBlockCollapsed(block)
  const toggleBlock = useUiStore((state) => state.toggleBlock)
  return (
    <section aria-labelledby={titleId} className="rounded-xl border bg-card p-4 text-card-foreground">
      <h2 className="text-sm font-semibold tracking-tight">
        {block ? (
          <button
            type="button"
            id={titleId}
            aria-expanded={!collapsed}
            aria-controls={contentId}
            onClick={() => toggleBlock(block)}
            className="-m-1 flex w-[calc(100%+0.5rem)] items-center justify-between gap-2 rounded-md p-1 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {title}
            <ChevronDown
              aria-hidden
              className={cn('size-4 shrink-0 text-muted-foreground transition-transform print:hidden', collapsed && '-rotate-90')}
            />
          </button>
        ) : (
          <span id={titleId}>{title}</span>
        )}
      </h2>
      <div id={contentId} hidden={collapsed} className="mt-3">
        {children}
        {source && <footer className="mt-4 border-t pt-3 text-xs text-muted-foreground">{source}</footer>}
      </div>
    </section>
  )
}
