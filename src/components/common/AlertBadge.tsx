import { cn } from 'cn'
import { CircleAlert, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { NiveauAlerte } from '@/lib/synthese/synthese'

const NIVEAUX: Record<NiveauAlerte, { label: string; Icon: LucideIcon; className: string }> = {
  information: { label: 'Information', Icon: Info, className: 'border-information/30 bg-information/10 text-information' },
  vigilance: { label: 'Vigilance', Icon: TriangleAlert, className: 'border-vigilance/30 bg-vigilance/10 text-vigilance' },
  alerte: { label: 'Alerte', Icon: CircleAlert, className: 'border-alerte/30 bg-alerte/10 text-alerte' },
}

/** Niveau d'alerte d'un fait, dit en toutes lettres et pas seulement par la couleur. */
export function AlertBadge({ niveau }: { niveau: NiveauAlerte }) {
  const { label, Icon, className } = NIVEAUX[niveau]
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
