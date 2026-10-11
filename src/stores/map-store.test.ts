import { beforeEach, describe, expect, it } from 'vitest'
import { useMapStore } from './map-store'

const initial = useMapStore.getState()

describe('calques activés', () => {
  beforeEach(() => useMapStore.setState(initial, true))

  it("n'affiche aucun calque au départ", () => {
    expect(useMapStore.getState().calquesActifs).toEqual([])
  })

  it('active puis désactive un calque', () => {
    const { setCalqueActif } = useMapStore.getState()
    setCalqueActif('zonage', true)
    expect(useMapStore.getState().calquesActifs).toEqual(['zonage'])
    setCalqueActif('zonage', false)
    expect(useMapStore.getState().calquesActifs).toEqual([])
  })

  it('ne compte pas deux fois un calque activé deux fois', () => {
    const { setCalqueActif } = useMapStore.getState()
    setCalqueActif('zonage', true)
    setCalqueActif('zonage', true)
    expect(useMapStore.getState().calquesActifs).toEqual(['zonage'])
  })

  it('garde les calques activés quand le fond change', () => {
    useMapStore.getState().setCalqueActif('zonage', true)
    useMapStore.getState().setBasemap('ortho')
    expect(useMapStore.getState().calquesActifs).toEqual(['zonage'])
  })
})
