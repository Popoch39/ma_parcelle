import { LoaderCircle, Search } from 'lucide-react'
import type { KeyboardEvent, Ref } from 'react'

interface SearchInputProps {
  ref?: Ref<HTMLInputElement>
  value: string
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onBlur: () => void
  /** Id of the suggestion list the field controls. */
  listId: string
  expanded: boolean
  /** Id of the active suggestion, announced without leaving the field. */
  activeId: string | undefined
  /** Id of the error message that describes the field, if there is one. */
  errorId: string | undefined
  pending: boolean
}

/** Search field, with the combobox role: focus stays on it while browsing the suggestions. */
export function SearchInput({
  ref,
  value,
  onChange,
  onKeyDown,
  onBlur,
  listId,
  expanded,
  activeId,
  errorId,
  pending,
}: SearchInputProps) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-xl border bg-background/85 px-3 shadow-lg backdrop-blur-md focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      {pending ? (
        <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      )}
      <input
        ref={ref}
        type="text"
        role="combobox"
        aria-label="Rechercher une adresse, une référence cadastrale, un IDU ou des coordonnées"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={expanded}
        aria-activedescendant={activeId}
        aria-describedby={errorId}
        aria-invalid={errorId ? true : undefined}
        aria-busy={pending}
        placeholder="Adresse, 33063 AB 123, IDU, lat, lon"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
