import { departmentPath, DIRECTORY_PATH, municipalityPath, type Catalog } from './catalog.ts'
import { escapeHtml, htmlDocument } from './html.ts'
import {
  departmentBody,
  departmentMeta,
  directoryBody,
  directoryMeta,
  municipalityBody,
  municipalityMeta,
  NOT_FOUND_META,
  notFoundBody,
} from './pages.ts'
import { absoluteUrl } from './site.ts'

// Runs at build time: see the import rule in plugin.ts.

export interface StaticFile {
  /** Path in the build output, without a leading slash. */
  fileName: string
  source: string
}

/**
 * File of a page. Cloudflare Pages serves `commune/x.html` at `/commune/x`, the canonical
 * address, and redirects the former to the latter.
 */
const pageFile = (path: string) => `${path.slice(1)}.html`

/**
 * Every static page of the site, its sitemap, its robots.txt and its 404 page. The
 * stylesheets are the app's, with which the pages share their theme.
 */
export function staticSite(catalog: Catalog, stylesheets: string[]): StaticFile[] {
  const pages = [
    { path: DIRECTORY_PATH, source: htmlDocument(directoryMeta(), stylesheets, directoryBody(catalog)) },
    ...catalog.departments.map((department) => ({
      path: departmentPath(department),
      source: htmlDocument(departmentMeta(department), stylesheets, departmentBody(department)),
    })),
    ...catalog.pages.map((municipality) => ({
      path: municipalityPath(municipality),
      source: htmlDocument(municipalityMeta(catalog, municipality), stylesheets, municipalityBody(catalog, municipality)),
    })),
  ]
  return [
    ...pages.map(({ path, source }) => ({ fileName: pageFile(path), source })),
    // Without a 404.html, Cloudflare Pages takes the site for a single-page app and answers
    // any unknown address with the home page and a 200, which search engines index.
    { fileName: '404.html', source: htmlDocument(NOT_FOUND_META, stylesheets, notFoundBody()) },
    { fileName: 'sitemap.xml', source: sitemap(['/', ...pages.map(({ path }) => path)]) },
    { fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n` },
  ]
}

// A sitemap holds at most 50,000 URLs: about 17,000 here.
function sitemap(paths: string[]): string {
  const urls = paths.map((path) => `  <url><loc>${escapeHtml(absoluteUrl(path))}</loc></url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}
