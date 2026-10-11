import type { Address } from '@/api/geocoding'
import { SuggestionItem } from './SuggestionItem'

interface SuggestionListProps {
  id: string
  suggestions: Address[]
  activeIndex: number
  /** DOM id of each suggestion, the one the field announces in `aria-activedescendant`. */
  optionId: (index: number) => string
  onChoose: (address: Address) => void
  onHover: (index: number) => void
}

/** List of suggested addresses below the search field. */
export function SuggestionList({ id, suggestions, activeIndex, optionId, onChoose, onHover }: SuggestionListProps) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Adresses suggérées"
      className="mt-1 rounded-xl border bg-background/95 p-1 shadow-lg backdrop-blur-md"
    >
      {suggestions.map((address, index) => (
        <SuggestionItem
          key={address.id}
          id={optionId(index)}
          address={address}
          active={index === activeIndex}
          onChoose={() => onChoose(address)}
          onHover={() => onHover(index)}
        />
      ))}
    </ul>
  )
}
