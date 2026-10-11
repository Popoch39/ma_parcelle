import type { DpeBlock } from '@/api/ademe'
import { GRADE_COLORS } from './grades'
import { GradeBadge } from './GradeBadge'

/** Distribution of the DPEs by energy grade, from A to G: one bar per grade, its count written next to it. */
export function GradeDistribution({ distribution }: { distribution: DpeBlock['distribution'] }) {
  const max = Math.max(1, ...distribution.map(({ count }) => count))
  return (
    <ul aria-label="Répartition par étiquette énergie" className="flex flex-col gap-1">
      {distribution.map(({ grade, count }) => (
        <li key={grade} className="flex items-center gap-2 text-sm">
          <GradeBadge grade={grade} type="energy" />
          <div aria-hidden className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${(count / max) * 100}%`, backgroundColor: GRADE_COLORS.energy[grade].background }}
            />
          </div>
          <span className="w-8 text-right font-medium tabular-nums">
            {count}
            <span className="sr-only"> DPE</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
