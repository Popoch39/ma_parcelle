import { describe, expect, it } from 'vitest'
import { ZONING_SOURCE_ID, ZONING_SOURCES } from './zoning-source'

const source = ZONING_SOURCES[ZONING_SOURCE_ID]
const tileUrl = source.type === 'raster' ? (source.tiles?.[0] ?? '') : ''

describe('zoning source', () => {
  it('is a raster source tiled on the Géoplateforme WMS', () => {
    expect(source.type).toBe('raster')
    expect(tileUrl.startsWith('https://data.geopf.fr/wms-v/ows?')).toBe(true)
  })

  it('requests the zone_secteur layer with GetMap, as transparent PNG', () => {
    const params = new URL(tileUrl).searchParams
    expect(params.get('SERVICE')).toBe('WMS')
    expect(params.get('REQUEST')).toBe('GetMap')
    expect(params.get('LAYERS')).toBe('zone_secteur')
    expect(params.get('FORMAT')).toBe('image/png')
    expect(params.get('TRANSPARENT')).toBe('true')
  })

  it('lets MapLibre fill in the bbox of each tile, in Web Mercator', () => {
    // Encoded (%7B…%7D), the braces would no longer be recognized as a template by MapLibre.
    expect(tileUrl).toContain('BBOX={bbox-epsg-3857}')
    expect(new URL(tileUrl).searchParams.get('CRS')).toBe('EPSG:3857')
  })

  it('requests images the size of the tiles', () => {
    const params = new URL(tileUrl).searchParams
    const tileSize = source.type === 'raster' ? source.tileSize : undefined
    expect(params.get('WIDTH')).toBe(String(tileSize))
    expect(params.get('HEIGHT')).toBe(String(tileSize))
  })
})
