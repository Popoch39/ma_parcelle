import type { Municipality } from '@/api/municipalities'
import { distanceBetween } from '../lib/geo.ts'

// Runs at build time too: see the import rule in plugin.ts.

/**
 * Cloudflare Pages' free plan serves at most 20,000 files per deployment: one page per
 * municipality of at least 500 inhabitants (about 16,700 of them, 94 % of the population)
 * fits. The smaller ones are listed on their department's page, with a link to the map.
 */
export const MIN_POPULATION_FOR_PAGE = 500

// Overseas departments whose parcels the cadastre (PCI) covers; the overseas collectivities
// (975, 977, 978, 98x) keep their own land registry.
const OVERSEAS_DEPARTMENTS = new Set(['971', '972', '973', '974', '976'])

const NEARBY_COUNT = 8

export interface Department {
  code: string
  name: string
  region: { code: string; name: string }
  /** From A to Z. */
  municipalities: Municipality[]
}

export interface Nearby {
  municipality: Municipality
  /** In metres, between the two centers. */
  distance: number
}

export interface Catalog {
  /** In the order of their codes, Corsica between 19 and 21. */
  departments: Department[]
  /** Municipalities and districts that get their own page, from the most populated. */
  pages: Municipality[]
  department: (code: string) => Department
  municipality: (inseeCode: string) => Municipality | undefined
  /** Districts of Paris, Lyon or Marseille, from the 1st; none for any other municipality. */
  districtsOf: (municipality: Municipality) => Municipality[]
  /** Closest municipalities, from the closest, the municipality's own districts or parent aside. */
  nearby: (municipality: Municipality) => Nearby[]
}

// Numeric, so that Paris 2e arrondissement comes before Paris 10e.
const collator = new Intl.Collator('fr', { numeric: true })

/** Gathers what the static pages need: departments, pages, neighbors. */
export function buildCatalog(all: Municipality[]): Catalog {
  const covered = all.filter(isCovered)
  const byInseeCode = new Map(covered.map((municipality) => [municipality.inseeCode, municipality]))

  const departments = new Map<string, Department>()
  for (const municipality of covered.toSorted((a, b) => collator.compare(a.name, b.name))) {
    const { department, region } = municipality
    const entry = departments.get(department.code) ?? { ...department, region, municipalities: [] }
    entry.municipalities.push(municipality)
    departments.set(department.code, entry)
  }

  const districts = new Map<string, Municipality[]>()
  for (const district of covered.toSorted((a, b) => a.inseeCode.localeCompare(b.inseeCode))) {
    if (district.parentInseeCode) districts.set(district.parentInseeCode, [...(districts.get(district.parentInseeCode) ?? []), district])
  }
  const districtsOf = (municipality: Municipality) => districts.get(municipality.inseeCode) ?? []

  const grid = new Grid(covered)
  return {
    departments: [...departments.values()].sort((a, b) => departmentOrder(a.code).localeCompare(departmentOrder(b.code), 'fr', { numeric: true })),
    pages: covered.filter(hasPage).sort((a, b) => b.population - a.population),
    department: (code) => departments.get(code)!,
    municipality: (inseeCode) => byInseeCode.get(inseeCode),
    districtsOf,
    nearby: (municipality) => {
      const related = new Set([municipality.inseeCode, municipality.parentInseeCode, ...districtsOf(municipality).map(({ inseeCode }) => inseeCode)])
      return grid
        .around(municipality.center, NEARBY_COUNT + related.size)
        .filter((neighbor) => !related.has(neighbor.inseeCode))
        .map((neighbor) => ({ municipality: neighbor, distance: distanceBetween(municipality.center, neighbor.center) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, NEARBY_COUNT)
    },
  }
}

/** Whether the cadastre (PCI) covers the municipality: mainland France and the overseas departments. */
export const isCovered = ({ department }: Municipality) => department.code.length === 2 || OVERSEAS_DEPARTMENTS.has(department.code)

export const hasPage = ({ population }: Municipality) => population >= MIN_POPULATION_FOR_PAGE

// Corsica (2A, 2B) took the place of the 20.
const departmentOrder = (code: string) => code.replace(/^2([AB])$/, '20$1')

/** Lowercase ASCII words joined by hyphens: « L'Haÿ-les-Roses » → « l-hay-les-roses ». */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/œ/gi, 'oe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const municipalityPath = ({ name, inseeCode }: Municipality) => `/commune/${slugify(name)}-${inseeCode.toLowerCase()}`

export const departmentPath = ({ name, code }: Pick<Department, 'name' | 'code'>) => `/departement/${slugify(name)}-${code.toLowerCase()}`

export const DIRECTORY_PATH = '/communes'

// MapLibre tiles are 512 px wide: at zoom z, a pixel covers 78,271.5 × cos(latitude) / 2^z metres.
const METRES_PER_PIXEL_AT_ZOOM_0 = 78_271.517
// Width, in pixels, the municipality takes on screen once the map opens on it.
const FRAMED_WIDTH_PX = 600
// Parcels show from zoom 15; below 10, the municipality is lost among its neighbors.
const MIN_ZOOM = 10
const MAX_ZOOM = 16

/** Zoom at which the map shows the whole municipality, taken as a square of its area. */
export function mapZoom({ area, center }: Municipality): number {
  const side = Math.sqrt(area * 10_000)
  const zoom = Math.log2((METRES_PER_PIXEL_AT_ZOOM_0 * Math.cos((center.lat * Math.PI) / 180) * FRAMED_WIDTH_PX) / side)
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom * 10) / 10))
}

/** The app, its map open on the municipality: the `#carte=zoom/lat/lon` hash that MapLibre reads. */
export function mapPath(municipality: Municipality): string {
  const { lat, lon } = municipality.center
  return `/#carte=${mapZoom(municipality)}/${lat}/${lon}`
}

// About 15 to 22 km per cell in mainland France: a municipality's neighbors are in the
// surrounding cells, and each cell holds a few dozen municipalities at most.
const CELL_DEGREES = 0.2
const MAX_RINGS = 5

/** Spatial index of the municipalities' centers, to find each one's neighbors without comparing it to all others. */
class Grid {
  private readonly cells = new Map<string, Municipality[]>()

  constructor(municipalities: Municipality[]) {
    for (const municipality of municipalities) {
      const key = Grid.key(Grid.cell(municipality.center.lon), Grid.cell(municipality.center.lat))
      const cell = this.cells.get(key)
      if (cell) cell.push(municipality)
      else this.cells.set(key, [municipality])
    }
  }

  /**
   * At least `count` municipalities around the point, if there are that many within
   * `MAX_RINGS` cells: the closest are among them, give or take the corners of the square.
   */
  around({ lon, lat }: { lon: number; lat: number }, count: number): Municipality[] {
    const [x, y] = [Grid.cell(lon), Grid.cell(lat)]
    let found: Municipality[] = []
    for (let ring = 1; ring <= MAX_RINGS && found.length < count; ring++) {
      found = []
      for (let dx = -ring; dx <= ring; dx++) {
        for (let dy = -ring; dy <= ring; dy++) found.push(...(this.cells.get(Grid.key(x + dx, y + dy)) ?? []))
      }
    }
    return found
  }

  private static cell = (degrees: number) => Math.floor(degrees / CELL_DEGREES)
  private static key = (x: number, y: number) => `${x}:${y}`
}
