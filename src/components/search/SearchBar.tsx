import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Adresse } from '@/api/geocodage'
import { errorMessage } from '@/components/common/error-message'
import { useAdresseSuggestions, useResolveSearch, type SearchTarget } from '@/queries/recherche'
import { useSelectionStore } from '@/stores/selection-store'
import { SearchInput } from './SearchInput'
import { SuggestionList } from './SuggestionList'

/**
 * Barre de recherche unifiée : assemble le champ et ses suggestions d'adresse, et ouvre la
 * fiche de la parcelle trouvée en recadrant la carte dessus.
 */
export function SearchBar() {
  const listId = useId()
  const errorId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [saisie, setSaisie] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const suggestions = useAdresseSuggestions(saisie).data ?? []
  const resolve = useResolveSearch()
  const select = useSelectionStore((state) => state.select)

  const expanded = open && suggestions.length > 0
  // La liste peut raccourcir sous la suggestion active quand de nouveaux résultats arrivent.
  const active = expanded && activeIndex < suggestions.length ? activeIndex : -1
  const optionId = (index: number) => `${listId}-${index}`

  const closeList = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const search = (target: SearchTarget) => {
    closeList()
    // Sur mobile, le clavier masquerait la fiche qui s'ouvre.
    if (window.matchMedia('(pointer: coarse)').matches) input.current?.blur()
    resolve.mutate(target, { onSuccess: (parcelle) => select(parcelle.idu, { reframe: true }) })
  }

  const choose = (adresse: Adresse) => {
    setSaisie(adresse.label)
    search({ adresse })
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    search({ saisie })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = suggestions.length
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (count === 0) return
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        setOpen(true)
        setActiveIndex(active === -1 ? (step === 1 ? 0 : count - 1) : (active + step + count) % count)
        return
      }
      case 'Enter':
        // Sans suggestion active, Entrée soumet le formulaire : la saisie est résolue telle quelle.
        if (active === -1) return
        event.preventDefault()
        choose(suggestions[active])
        return
      case 'Escape':
        event.preventDefault()
        if (expanded) {
          closeList()
        } else {
          setSaisie('')
          resolve.reset()
        }
    }
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative min-w-0 flex-1">
      <SearchInput
        ref={input}
        value={saisie}
        onChange={(value) => {
          setSaisie(value)
          setOpen(true)
          setActiveIndex(-1)
          resolve.reset()
        }}
        onKeyDown={onKeyDown}
        onBlur={closeList}
        listId={listId}
        expanded={expanded}
        activeId={active === -1 ? undefined : optionId(active)}
        errorId={resolve.isError ? errorId : undefined}
        pending={resolve.isPending}
      />
      {expanded && (
        <SuggestionList
          id={listId}
          suggestions={suggestions}
          activeIndex={active}
          optionId={optionId}
          onChoose={choose}
          onHover={setActiveIndex}
        />
      )}
      {resolve.isError && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 rounded-xl border bg-background/95 px-3 py-2 text-sm text-destructive shadow-lg backdrop-blur-md"
        >
          {errorMessage(resolve.error)}
        </p>
      )}
    </form>
  )
}
