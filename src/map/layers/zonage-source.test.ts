import { describe, expect, it } from 'vitest'
import { ZONAGE_SOURCE_ID, ZONAGE_SOURCES } from './zonage-source'

const source = ZONAGE_SOURCES[ZONAGE_SOURCE_ID]
const tileUrl = source.type === 'raster' ? (source.tiles?.[0] ?? '') : ''

describe('source du zonage', () => {
  it('est une source raster tuilée sur le WMS de la Géoplateforme', () => {
    expect(source.type).toBe('raster')
    expect(tileUrl.startsWith('https://data.geopf.fr/wms-v/ows?')).toBe(true)
  })

  it('demande la couche zone_secteur en GetMap, en PNG transparent', () => {
    const params = new URL(tileUrl).searchParams
    expect(params.get('SERVICE')).toBe('WMS')
    expect(params.get('REQUEST')).toBe('GetMap')
    expect(params.get('LAYERS')).toBe('zone_secteur')
    expect(params.get('FORMAT')).toBe('image/png')
    expect(params.get('TRANSPARENT')).toBe('true')
  })

  it("laisse MapLibre remplir l'emprise de chaque tuile, en Web Mercator", () => {
    // Encodées (%7B…%7D), les accolades ne seraient plus reconnues comme un gabarit par MapLibre.
    expect(tileUrl).toContain('BBOX={bbox-epsg-3857}')
    expect(new URL(tileUrl).searchParams.get('CRS')).toBe('EPSG:3857')
  })

  it('demande des images de la taille des tuiles', () => {
    const params = new URL(tileUrl).searchParams
    const tileSize = source.type === 'raster' ? source.tileSize : undefined
    expect(params.get('WIDTH')).toBe(String(tileSize))
    expect(params.get('HEIGHT')).toBe(String(tileSize))
  })
})
