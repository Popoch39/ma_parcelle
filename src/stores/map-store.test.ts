import { beforeEach, describe, expect, it } from 'vitest'
import { useMapStore } from './map-store'

const initial = useMapStore.getState()

beforeEach(() => useMapStore.setState(initial, true))

describe('active overlays', () => {
  it('shows sales by default, not zoning', () => {
    expect(useMapStore.getState().activeOverlays).toEqual(['sales'])
  })

  it('activates then deactivates an overlay', () => {
    const { setOverlayActive } = useMapStore.getState()
    setOverlayActive('zoning', true)
    expect(useMapStore.getState().activeOverlays).toEqual(['sales', 'zoning'])
    setOverlayActive('zoning', false)
    expect(useMapStore.getState().activeOverlays).toEqual(['sales'])
  })

  it('hides sales on demand', () => {
    useMapStore.getState().setOverlayActive('sales', false)
    expect(useMapStore.getState().activeOverlays).toEqual([])
  })

  it('does not count twice an overlay activated twice', () => {
    const { setOverlayActive } = useMapStore.getState()
    setOverlayActive('zoning', true)
    setOverlayActive('zoning', true)
    expect(useMapStore.getState().activeOverlays).toEqual(['sales', 'zoning'])
  })

  it('keeps the active overlays when the basemap changes', () => {
    useMapStore.getState().setOverlayActive('zoning', true)
    useMapStore.getState().setBasemap('ortho')
    expect(useMapStore.getState().activeOverlays).toEqual(['sales', 'zoning'])
  })
})

describe('hovered and opened sale', () => {
  it('tracks the hovered sale, in the list as on the map', () => {
    useMapStore.getState().hoverSale('v1')
    expect(useMapStore.getState().hoveredSale).toBe('v1')
    useMapStore.getState().hoverSale(null)
    expect(useMapStore.getState().hoveredSale).toBeNull()
  })

  it('does not close the sale just opened when the previous one closes', () => {
    const { openSale, closeSale } = useMapStore.getState()
    openSale('v1')
    openSale('v2')
    closeSale('v1')
    expect(useMapStore.getState().openedSale).toBe('v2')
    closeSale('v2')
    expect(useMapStore.getState().openedSale).toBeNull()
  })
})
