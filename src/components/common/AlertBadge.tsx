import { cn } from 'cn'
import { CircleAlert, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { AlertLevel } from '@/lib/summary/summary'

const LEVELS: Record<AlertLevel, { label: string; Icon: LucideIcon; className: string }> = {
  info: { label: 'Information', Icon: Info, className: 'border-info/30 bg-info/10 text-info' },
  caution: { label: 'Vigilance', Icon: TriangleAlert, className: 'border-caution/30 bg-caution/10 text-caution' },
  alert: { label: 'Alerte', Icon: CircleAlert, className: 'border-alert/30 bg-alert/10 text-alert' },
}

/** Alert level of a fact, spelled out in words and not only by color. */
export function AlertBadge({ level }: { level: AlertLevel }) {
  const { label, Icon, className } = LEVELS[level]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        className,
      )}
    >
      <Icon aria-hidden className="size-3" />
      {label}
    </span>
  )
}
