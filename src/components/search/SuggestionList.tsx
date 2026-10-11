import type { Adresse } from '@/api/geocodage'
import { SuggestionItem } from './SuggestionItem'

interface SuggestionListProps {
  id: string
  suggestions: Adresse[]
  activeIndex: number
  /** Identifiant DOM de chaque suggestion, celui que le champ annonce dans `aria-activedescendant`. */
  optionId: (index: number) => string
  onChoose: (adresse: Adresse) => void
  onHover: (index: number) => void
}

/** Liste des adresses suggérées sous le champ de recherche. */
export function SuggestionList({ id, suggestions, activeIndex, optionId, onChoose, onHover }: SuggestionListProps) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Adresses suggérées"
      className="mt-1 rounded-xl border bg-background/95 p-1 shadow-lg backdrop-blur-md"
    >
      {suggestions.map((adresse, index) => (
        <SuggestionItem
          key={adresse.id}
          id={optionId(index)}
          adresse={adresse}
          active={index === activeIndex}
          onChoose={() => onChoose(adresse)}
          onHover={() => onHover(index)}
        />
      ))}
    </ul>
  )
}
