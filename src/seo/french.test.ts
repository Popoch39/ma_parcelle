import { describe, expect, it } from 'vitest'
import { formatDistance, inPlace, ofPlace } from './french'

describe('ofPlace', () => {
  it('contracts « de » with the article of the name, and elides it before a vowel', () => {
    expect(ofPlace('Bordeaux')).toBe('de Bordeaux')
    expect(ofPlace('Le Havre')).toBe('du Havre')
    expect(ofPlace('Les Abymes')).toBe('des Abymes')
    expect(ofPlace('La Rochelle')).toBe('de La Rochelle')
    expect(ofPlace('Ajaccio')).toBe('d’Ajaccio')
    expect(ofPlace('Évry-Courcouronnes')).toBe('d’Évry-Courcouronnes')
  })
})

describe('inPlace', () => {
  it('contracts « à » with the article of the name', () => {
    expect(inPlace('Bordeaux')).toBe('à Bordeaux')
    expect(inPlace('Le Havre')).toBe('au Havre')
    expect(inPlace('Les Abymes')).toBe('aux Abymes')
    expect(inPlace('La Rochelle')).toBe('à La Rochelle')
  })
})

describe('formatDistance', () => {
  it('rounds to 50 m under a kilometre, to 100 m beyond', () => {
    expect(formatDistance(830)).toBe('850 m')
    expect(formatDistance(7_942)).toBe('7,9 km')
  })
})
