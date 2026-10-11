import type { Plugin } from 'vite'
import { loadMunicipalities } from '../api/municipalities.ts'
import { buildCatalog } from './catalog.ts'
import { headTags } from './html.ts'
import { HOME_META } from './pages.ts'
import { staticSite } from './static-site.ts'

// Import rule of the modules vite.config.ts loads (this one, and those it imports): Vite
// loads them before its own config, so without the `@/` alias, which only type imports
// (erased) may use, and soon natively, which wants relative imports with their extension.

/**
 * Search engine optimization: puts the home page's head tags into index.html, and in build
 * emits the static pages of the departments and municipalities, the sitemap, robots.txt
 * and the 404 page. The municipalities come from geo.api.gouv.fr at each build: a build
 * without it fails rather than deploy a site without its pages.
 */
export function seo(): Plugin {
  return {
    name: 'ma-parcelle:seo',
    transformIndexHtml: (html) => html.replace('</head>', `${headTags(HOME_META)}</head>`),
    async generateBundle(_, bundle) {
      const stylesheets = Object.values(bundle).flatMap((file) =>
        file.type === 'chunk' && file.isEntry ? [...(file.viteMetadata?.importedCss ?? [])].map((css) => `/${css}`) : [],
      )
      const catalog = buildCatalog(await loadMunicipalities(fetch))
      for (const { fileName, source } of staticSite(catalog, stylesheets)) {
        this.emitFile({ type: 'asset', fileName, source })
      }
    },
  }
}
