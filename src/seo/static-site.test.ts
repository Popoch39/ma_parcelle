import { describe, expect, it } from 'vitest'
import districts from '@/api/__fixtures__/geo/communes-arrondissement-municipal-paris-lyon-marseille.json'
import municipalities from '@/api/__fixtures__/geo/communes-gironde-paris-ajaccio-strasbourg-overseas.json'
import { loadMunicipalities } from '@/api/municipalities'
import { fakeFetch } from '@/test/fake-fetch'
import { buildCatalog } from './catalog'
import { staticSite } from './static-site'

async function site() {
  const fetch = fakeFetch([
    { match: 'type=arrondissement-municipal', body: districts },
    { match: 'geo.api.gouv.fr/communes', body: municipalities },
  ])
  const files = staticSite(buildCatalog(await loadMunicipalities(fetch)), ['/assets/index-abc.css'])
  return (fileName: string) => {
    const file = files.find((candidate) => candidate.fileName === fileName)
    if (!file) throw new Error(`No ${fileName} among ${files.map((candidate) => candidate.fileName).join(', ')}`)
    return file.source
  }
}

/** The page's schema.org graph, parsed as a search engine would. */
const structuredData = (page: string) =>
  JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(page)![1])['@graph'] as Array<Record<string, unknown>>

describe('staticSite', () => {
  it('writes a municipality’s page at its canonical address, with its own title and description', async () => {
    const page = (await site())('commune/bordeaux-33063.html')

    expect(page).toContain('<title>Cadastre de Bordeaux (33) : parcelles, PLU, risques · Ma parcelle</title>')
    expect(page).toContain('<meta name="description" content="Toute parcelle de Bordeaux (Gironde) en une fiche gratuite')
    expect(page).toContain('<link rel="canonical" href="https://ma-parcelle.pages.dev/commune/bordeaux-33063" />')
    expect(page).toContain('<meta property="og:url" content="https://ma-parcelle.pages.dev/commune/bordeaux-33063" />')
    expect(page).toContain('<link rel="stylesheet" href="/assets/index-abc.css" />')
    expect(page).toContain('<h1 class="text-3xl font-bold tracking-tight">Cadastre de Bordeaux</h1>')
  })

  it('links a municipality’s page to the map open on it, to its department and to its neighbors', async () => {
    const page = (await site())('commune/bordeaux-33063.html')

    expect(page).toContain('href="/#carte=12.2/44.8624/-0.5848"')
    expect(page).toContain('href="/departement/gironde-33"')
    expect(page).toContain('href="/commune/merignac-33281"')
    // Too small for a page of its own: its link opens the map.
    expect(page).toMatch(/href="\/#carte=[\d./-]+"[^>]*>Asques<\/a>/)
  })

  it('describes the municipality and the breadcrumb in structured data', async () => {
    const graph = structuredData((await site())('commune/paris-7e-arrondissement-75107.html'))

    expect(graph.find((node) => node['@type'] === 'AdministrativeArea')).toMatchObject({
      name: 'Paris 7e arrondissement',
      identifier: { propertyID: 'INSEE', value: '75107' },
      containedInPlace: { '@type': 'City', name: 'Paris' },
    })
    expect(graph.find((node) => node['@type'] === 'BreadcrumbList')).toMatchObject({
      itemListElement: [
        { position: 1, name: 'Accueil', item: 'https://ma-parcelle.pages.dev/' },
        { position: 2, name: 'Communes', item: 'https://ma-parcelle.pages.dev/communes' },
        { position: 3, name: 'Paris (75)', item: 'https://ma-parcelle.pages.dev/departement/paris-75' },
        { position: 4, name: 'Paris', item: 'https://ma-parcelle.pages.dev/commune/paris-75056' },
        { position: 5, name: 'Paris 7e arrondissement', item: 'https://ma-parcelle.pages.dev/commune/paris-7e-arrondissement-75107' },
      ],
    })
  })

  it('gives search examples with the district’s code where the cadastre is kept by district', async () => {
    const page = (await site())('commune/paris-75056.html')

    expect(page).toContain('« 75101 AB 12 »')
    expect(page).toContain('75101000AB0012')
    expect(page).toContain('href="/commune/paris-7e-arrondissement-75107"')
  })

  it('warns that no sale is published where the land register replaces the DGFiP', async () => {
    const page = await site()

    expect(page('commune/strasbourg-67482.html')).toContain('la DGFiP ne publie pas les ventes de ce département : le bloc reste vide à Strasbourg.')
    expect(page('commune/bordeaux-33063.html')).toContain('ventes publiées du voisinage')
  })

  it('escapes the names it writes into the HTML', async () => {
    const page = (await site())('departement/corse-du-sud-2a.html')

    expect(page).toContain('Ajaccio')
    expect(page).not.toMatch(/content="[^"]*'[^"]*"/)
    expect((await site())('commune/ajaccio-2a004.html')).toContain('Cadastre d’Ajaccio')
  })

  it('lists the home page, the directory, the departments and the municipality pages in the sitemap', async () => {
    const sitemap = (await site())('sitemap.xml')

    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url)
    expect(urls.slice(0, 3)).toEqual([
      'https://ma-parcelle.pages.dev/',
      'https://ma-parcelle.pages.dev/communes',
      'https://ma-parcelle.pages.dev/departement/bouches-du-rhone-13',
    ])
    expect(urls).toContain('https://ma-parcelle.pages.dev/commune/bordeaux-33063')
    expect(urls).not.toContain('https://ma-parcelle.pages.dev/commune/asques-33016')
  })

  it('points robots to the sitemap', async () => {
    expect((await site())('robots.txt')).toBe('User-agent: *\nAllow: /\n\nSitemap: https://ma-parcelle.pages.dev/sitemap.xml\n')
  })

  it('writes a 404 page kept out of the results', async () => {
    const page = (await site())('404.html')

    expect(page).toContain('<meta name="robots" content="noindex" />')
    expect(page).not.toContain('rel="canonical"')
  })
})
