import { MapPin } from 'lucide-react'
import type { Address } from '@/api/geocoding'

interface SuggestionItemProps {
  id: string
  address: Address
  active: boolean
  onChoose: () => void
  onHover: () => void
}

/** A suggested address. */
export function SuggestionItem({ id, address, active, onChoose, onHover }: SuggestionItemProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      // The field keeps the focus: without this, it would lose it (and close the list) before the click.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onChoose}
      onMouseMove={onHover}
      className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
    >
      <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block truncate">{address.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{address.context}</span>
      </span>
    </li>
  )
}
