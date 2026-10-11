import { beforeEach, describe, expect, it } from 'vitest'
import { useMapStore } from './map-store'

const initial = useMapStore.getState()

beforeEach(() => useMapStore.setState(initial, true))

describe('calques activés', () => {
  it('affiche les ventes au départ, pas le zonage', () => {
    expect(useMapStore.getState().calquesActifs).toEqual(['ventes'])
  })

  it('active puis désactive un calque', () => {
    const { setCalqueActif } = useMapStore.getState()
    setCalqueActif('zonage', true)
    expect(useMapStore.getState().calquesActifs).toEqual(['ventes', 'zonage'])
    setCalqueActif('zonage', false)
    expect(useMapStore.getState().calquesActifs).toEqual(['ventes'])
  })

  it('masque les ventes à la demande', () => {
    useMapStore.getState().setCalqueActif('ventes', false)
    expect(useMapStore.getState().calquesActifs).toEqual([])
  })

  it('ne compte pas deux fois un calque activé deux fois', () => {
    const { setCalqueActif } = useMapStore.getState()
    setCalqueActif('zonage', true)
    setCalqueActif('zonage', true)
    expect(useMapStore.getState().calquesActifs).toEqual(['ventes', 'zonage'])
  })

  it('garde les calques activés quand le fond change', () => {
    useMapStore.getState().setCalqueActif('zonage', true)
    useMapStore.getState().setBasemap('ortho')
    expect(useMapStore.getState().calquesActifs).toEqual(['ventes', 'zonage'])
  })
})

describe('ventes survolée et ouverte', () => {
  it('suit la vente survolée, dans la liste comme sur la carte', () => {
    useMapStore.getState().survolerVente('v1')
    expect(useMapStore.getState().venteSurvolee).toBe('v1')
    useMapStore.getState().survolerVente(null)
    expect(useMapStore.getState().venteSurvolee).toBeNull()
  })

  it("ne referme pas la vente qu'on vient d'ouvrir quand l'ancienne se ferme", () => {
    const { ouvrirVente, fermerVente } = useMapStore.getState()
    ouvrirVente('v1')
    ouvrirVente('v2')
    fermerVente('v1')
    expect(useMapStore.getState().venteOuverte).toBe('v2')
    fermerVente('v2')
    expect(useMapStore.getState().venteOuverte).toBeNull()
  })
})
