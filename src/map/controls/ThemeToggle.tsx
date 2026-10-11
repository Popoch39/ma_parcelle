import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Theme } from '@/stores/theme'
import { useUiStore } from '@/stores/ui-store'

const OPTIONS: { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: 'auto', label: 'Thème du système', Icon: Monitor },
  { value: 'light', label: 'Thème clair', Icon: Sun },
  { value: 'dark', label: 'Thème sombre', Icon: Moon },
]

/** Theme choice: auto, light or dark. */
export function ThemeToggle() {
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  return (
    <ToggleGroup
      aria-label="Thème"
      size="sm"
      spacing={0}
      value={[theme]}
      // A second click on the active theme would release it: the group must never stay empty.
      onValueChange={([value]) => {
        const next = OPTIONS.find((option) => option.value === value)
        if (next) setTheme(next.value)
      }}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <ToggleGroupItem key={value} value={value} aria-label={label} title={label}>
          <Icon aria-hidden />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
