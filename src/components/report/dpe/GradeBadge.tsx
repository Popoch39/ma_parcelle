import { cn } from 'cn'
import type { Grade } from '@/api/ademe'
import { GRADE_COLORS, GRADE_NAMES, type GradeType } from './grades'

interface GradeBadgeProps {
  grade: Grade | null
  type: GradeType
}

/** Letter of a DPE grade on its regulatory color; its type is told to screen readers. */
export function GradeBadge({ grade, type }: GradeBadgeProps) {
  const color = grade && GRADE_COLORS[type][grade]
  return (
    <span
      title={`Étiquette ${GRADE_NAMES[type]}`}
      // The ring keeps the badge visible when its color blends into the dark background.
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded text-xs font-bold ring-1 ring-border ring-inset',
        color ? color.text : 'text-muted-foreground',
      )}
      style={color ? { backgroundColor: color.background } : undefined}
    >
      <span className="sr-only">Étiquette {GRADE_NAMES[type]} </span>
      {grade ?? '?'}
    </span>
  )
}
