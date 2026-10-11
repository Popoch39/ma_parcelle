import { describe, expect, it } from 'vitest'
import { colorSchemeOf, persistedTheme } from './theme'

describe('colorSchemeOf', () => {
  it.each([
    ['auto', 'light', 'light'],
    ['auto', 'dark', 'dark'],
    ['clair', 'dark', 'light'],
    ['sombre', 'light', 'dark'],
  ] as const)('le thème %s, avec un système en %s, s’affiche en %s',(theme, system, expected) => {
    expect(colorSchemeOf(theme, system)).toBe(expected)
  })
})

describe('persistedTheme', () => {
  it('reprend le thème choisi lors d’une visite précédente', () => {
    expect(persistedTheme({ theme: 'sombre' })).toBe('sombre')
  })

  it('suit le système à la première visite', () => {
    expect(persistedTheme(undefined)).toBe('auto')
  })

  it.each([
    ['un thème inconnu', { theme: 'bleu' }],
    ['un thème d’un autre type', { theme: 2 }],
    ['un état sans thème', {}],
    ['une valeur qui n’est pas un objet', 'sombre'],
    ['null', null],
  ])('suit le système quand le stockage contient %s', (_, persisted) => {
    expect(persistedTheme(persisted)).toBe('auto')
  })
})
