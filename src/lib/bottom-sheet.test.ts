import { describe, expect, it } from 'vitest'
import { cranAuRelachement, cranVoisin } from './bottom-sheet'

// Écran de 800 px : aperçu de 80 px, mi-écran à 400 px, plein écran à 800 px.
const hauteurs = { apercu: 80, 'mi-ecran': 400, 'plein-ecran': 800 }

describe('cranAuRelachement', () => {
  it('pose le panneau sur le cran le plus proche quand on le lâche sans élan', () => {
    expect(cranAuRelachement({ hauteurs, hauteur: 300, vitesse: 0 })).toBe('mi-ecran')
    expect(cranAuRelachement({ hauteurs, hauteur: 200, vitesse: 0 })).toBe('apercu')
    expect(cranAuRelachement({ hauteurs, hauteur: 650, vitesse: 0 })).toBe('plein-ecran')
  })

  it("suit l'élan d'un geste vif jusqu'au cran suivant dans sa direction, même s'il est plus loin", () => {
    expect(cranAuRelachement({ hauteurs, hauteur: 420, vitesse: 1 })).toBe('plein-ecran')
    expect(cranAuRelachement({ hauteurs, hauteur: 380, vitesse: -1 })).toBe('apercu')
    expect(cranAuRelachement({ hauteurs, hauteur: 420, vitesse: -1 })).toBe('mi-ecran')
  })

  it('reste au cran extrême quand un geste vif le pousse au-delà', () => {
    expect(cranAuRelachement({ hauteurs, hauteur: 820, vitesse: 2 })).toBe('plein-ecran')
    expect(cranAuRelachement({ hauteurs, hauteur: 60, vitesse: -2 })).toBe('apercu')
  })
})

describe('cranVoisin', () => {
  it("monte ou descend d'un cran, sans dépasser les extrêmes", () => {
    expect(cranVoisin('apercu', 'haut')).toBe('mi-ecran')
    expect(cranVoisin('mi-ecran', 'haut')).toBe('plein-ecran')
    expect(cranVoisin('plein-ecran', 'haut')).toBe('plein-ecran')
    expect(cranVoisin('plein-ecran', 'bas')).toBe('mi-ecran')
    expect(cranVoisin('apercu', 'bas')).toBe('apercu')
  })
})
