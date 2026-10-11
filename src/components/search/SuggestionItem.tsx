import { MapPin } from 'lucide-react'
import type { Adresse } from '@/api/geocodage'

interface SuggestionItemProps {
  id: string
  adresse: Adresse
  active: boolean
  onChoose: () => void
  onHover: () => void
}

/** Une adresse suggérée. */
export function SuggestionItem({ id, adresse, active, onChoose, onHover }: SuggestionItemProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      // Le champ garde le focus : sans cela, il le perdrait (et fermerait la liste) avant le clic.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onChoose}
      onMouseMove={onHover}
      className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
    >
      <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block truncate">{adresse.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{adresse.contexte}</span>
      </span>
    </li>
  )
}
