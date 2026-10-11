import { describe, expect, it } from 'vitest'
import { cadrageCapture, garderVueCourante, zoomImpression } from './impression'

describe('vue de la carte imprimée', () => {
  // Image de 1350 × 900 au centre d'un écran de 1600 × 900 ; sélection surlignée à partir du zoom 15.
  const cadre = { x: 125, y: 0, width: 1350, height: 900 }
  const garder = (zoom: number, x: number, y: number) =>
    garderVueCourante({ zoom, surlignage: 15, centreParcelle: { x, y }, cadre })

  it('imprime la vue courante telle quelle quand la parcelle y est, surlignée, même loin du centre', () => {
    expect(garder(17, 800, 450)).toBe(true)
    expect(garder(15, 200, 850)).toBe(true)
  })

  it('recadre quand la parcelle est hors de l’image, même visible à l’écran', () => {
    expect(garder(17, 2400, 450)).toBe(false)
    expect(garder(17, 60, 450)).toBe(false)
  })

  it('recadre quand la vue est trop éloignée pour que la parcelle soit surlignée', () => {
    expect(garder(14.9, 800, 450)).toBe(false)
  })
})

describe('zoom de la carte imprimée quand il faut recadrer', () => {
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
