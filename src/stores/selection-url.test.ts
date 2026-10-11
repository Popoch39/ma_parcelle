import { describe, expect, it } from 'vitest'
import { urlDeLaFiche } from './selection-url'

describe('URL de la fiche', () => {
  it('désigne la parcelle depuis l’adresse de l’app', () => {
    expect(urlDeLaFiche('75107000BQ0003', 'https://ma-parcelle.fr/')).toBe(
      'https://ma-parcelle.fr/?parcelle=75107000BQ0003',
    )
  })

  it('ne garde rien de la page courante qui ne désigne pas la parcelle', () => {
    expect(urlDeLaFiche('75107000BQ0003', 'http://localhost:5173/app/?parcelle=33063000KJ0033&x=1#carte')).toBe(
      'http://localhost:5173/app/?parcelle=75107000BQ0003',
    )
  })
})
