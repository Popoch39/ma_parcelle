import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Address } from '@/api/geocoding'
import { errorMessage } from '@/components/common/error-message'
import { useAddressSuggestions, useResolveSearch, type SearchTarget } from '@/queries/search'
import { useSelectionStore } from '@/stores/selection-store'
import { SearchInput } from './SearchInput'
import { SuggestionList } from './SuggestionList'

/**
 * Unified search bar: assembles the field and its address suggestions, and opens the
 * report of the parcel found while reframing the map on it.
 */
export function SearchBar() {
  const listId = useId()
  const errorId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const suggestions = useAddressSuggestions(text).data ?? []
  const resolve = useResolveSearch()
  const select = useSelectionStore((state) => state.select)

  const expanded = open && suggestions.length > 0
  // The list may shrink below the active suggestion when new results arrive.
  const active = expanded && activeIndex < suggestions.length ? activeIndex : -1
  const optionId = (index: number) => `${listId}-${index}`

  const closeList = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const search = (target: SearchTarget) => {
    closeList()
    // On mobile, the keyboard would hide the report that opens.
    if (window.matchMedia('(pointer: coarse)').matches) input.current?.blur()
    resolve.mutate(target, { onSuccess: (parcel) => select(parcel.idu, { reframe: true }) })
  }

  const choose = (address: Address) => {
    setText(address.label)
    search({ address })
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    search({ input: text })
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
        // With no active suggestion, Enter submits the form: the input is resolved as is.
        if (active === -1) return
        event.preventDefault()
        choose(suggestions[active])
        return
      case 'Escape':
        event.preventDefault()
        if (expanded) {
          closeList()
        } else {
          setText('')
          resolve.reset()
        }
    }
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative min-w-0 flex-1">
      <SearchInput
        ref={input}
        value={text}
        onChange={(value) => {
          setText(value)
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
