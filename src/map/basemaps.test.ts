import { describe, expect, it } from 'vitest'
import { basemapStyle } from './basemaps'

describe('basemapStyle', () => {
  it('the plan follows the displayed theme', () => {
    expect(basemapStyle('plan', 'light')).toBe('https://tiles.openfreemap.org/styles/positron')
    expect(basemapStyle('plan', 'dark')).toBe('https://tiles.openfreemap.org/styles/dark')
  })

  it('under the aerial photo, downloads no plan: the photo is a layer', () => {
    const style = basemapStyle('ortho', 'light')
    expect(style).toMatchObject({ version: 8, sources: {}, layers: [] })
  })

  it('keeps the plan fonts under the aerial photo, for the overlay labels', () => {
    expect(basemapStyle('ortho', 'light')).toMatchObject({
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    })
  })

  it('does not reload the aerial photo when the theme changes', () => {
    expect(basemapStyle('ortho', 'dark')).toBe(basemapStyle('ortho', 'light'))
  })
})
