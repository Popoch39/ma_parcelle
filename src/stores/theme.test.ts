import { describe, expect, it } from 'vitest'
import { colorSchemeOf, persistedTheme } from './theme'

describe('colorSchemeOf', () => {
  it.each([
    ['auto', 'light', 'light'],
    ['auto', 'dark', 'dark'],
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark'],
  ] as const)('the %s theme, with a %s system, displays as %s',(theme, system, expected) => {
    expect(colorSchemeOf(theme, system)).toBe(expected)
  })

  it.each([
    ['auto', 'dark'],
    ['dark', 'light'],
    ['dark', 'dark'],
  ] as const)('displays as light while printing, whatever the theme (%s, %s system)', (theme, system) => {
    expect(colorSchemeOf(theme, system, { printing: true })).toBe('light')
  })
})

describe('persistedTheme', () => {
  it('restores the theme chosen during a previous visit', () => {
    expect(persistedTheme({ theme: 'dark' })).toBe('dark')
  })

  it('follows the system on the first visit', () => {
    expect(persistedTheme(undefined)).toBe('auto')
  })

  it.each([
    ['an unknown theme', { theme: 'bleu' }],
    ['a theme of another type', { theme: 2 }],
    ['a state without a theme', {}],
    ['a value that is not an object', 'dark'],
    ['null', null],
  ])('follows the system when the storage contains %s', (_, persisted) => {
    expect(persistedTheme(persisted)).toBe('auto')
  })
})
