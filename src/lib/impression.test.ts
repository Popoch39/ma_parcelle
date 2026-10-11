import { describe, expect, it } from 'vitest'
import { cadrageCapture, zoomImpression } from './impression'

describe('zoom de la carte imprimée', () => {
  // Parcelle entière dans l'image jusqu'au zoom 18 ; sélection surlignée à partir du zoom 15.
  const zoom = (courant: number, parcelleEntiere = 18) => zoomImpression({ courant, parcelleEntiere, surlignage: 15 })

  it('garde le zoom de la vue courante quand la parcelle y tient et y est surlignée', () => {
    expect(zoom(17)).toBe(17)
    expect(zoom(15)).toBe(15)
  })

  it('recule quand la parcelle déborderait de l’image', () => {
    expect(zoom(19.5)).toBe(18)
  })

  it('avance jusqu’au surlignage de la parcelle quand la vue courante est trop éloignée', () => {
    expect(zoom(11)).toBe(15)
  })

  it('montre en entier une parcelle trop grande pour être surlignée', () => {
    expect(zoom(11, 13.5)).toBe(13.5)
    expect(zoom(16, 13.5)).toBe(13.5)
  })
})

describe('cadrage de la carte imprimée', () => {
  it('garde toute la hauteur d’un écran plus large que l’image, centrée en largeur', () => {
    expect(cadrageCapture({ width: 1600, height: 900 }, 16 / 10)).toEqual({ x: 80, y: 0, width: 1440, height: 900 })
  })

  it('garde toute la largeur d’un écran de téléphone, centrée en hauteur', () => {
    expect(cadrageCapture({ width: 780, height: 1688 }, 16 / 10)).toEqual({ x: 0, y: 600, width: 780, height: 488 })
  })
})
