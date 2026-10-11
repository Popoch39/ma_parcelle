import { describe, expect, it } from 'vitest'
import { basemapStyle } from './basemaps'

describe('basemapStyle', () => {
  it('le plan suit le thème affiché', () => {
    expect(basemapStyle('plan', 'light')).toBe('https://tiles.openfreemap.org/styles/positron')
    expect(basemapStyle('plan', 'dark')).toBe('https://tiles.openfreemap.org/styles/dark')
  })

  it('sous la photo aérienne, ne télécharge aucun plan : la photo est un calque', () => {
    const style = basemapStyle('ortho', 'light')
    expect(style).toMatchObject({ version: 8, sources: {}, layers: [] })
  })

  it('garde les polices du plan sous la photo aérienne, pour les étiquettes des surcouches', () => {
    expect(basemapStyle('ortho', 'light')).toMatchObject({
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    })
  })

  it('ne recharge pas la photo aérienne quand le thème change', () => {
    expect(basemapStyle('ortho', 'dark')).toBe(basemapStyle('ortho', 'light'))
  })
})
