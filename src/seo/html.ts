import { absoluteUrl, SITE_NAME } from './site.ts'

// Runs at build time: see the import rule in plugin.ts.

/** HTML already escaped, inserted as is by `html`. */
export class Html {
  readonly value: string

  constructor(value: string) {
    this.value = value
  }

  toString() {
    return this.value
  }
}

type Interpolation = Html | string | number | null | undefined | false | Interpolation[]

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ENTITIES[char])

function render(value: Interpolation): string {
  if (value instanceof Html) return value.value
  if (Array.isArray(value)) return value.map(render).join('')
  if (value === null || value === undefined || value === false) return ''
  return escapeHtml(String(value))
}

/** Template of HTML whose interpolations are escaped, except those that are already `Html`. */
export function html(strings: TemplateStringsArray, ...values: Interpolation[]): Html {
  return new Html(strings.reduce((out, string, i) => out + render(values[i - 1]) + string))
}

/** What search engines and link previews read of a page. */
export interface PageMeta {
  /** Full `<title>`, the site name included. */
  title: string
  /** About 150 characters: beyond, results cut it. */
  description: string
  /** Canonical path, from the root. */
  path: string
  /** schema.org graph of the page. */
  structuredData: object[]
  /** A page that must not appear in results (error page). */
  noindex?: boolean
}

// 1200 × 630, the size every link preview expects.
const OG_IMAGE = { path: '/og.png', width: 1200, height: 630, alt: 'Ma parcelle : la fiche complète d’une parcelle cadastrale, sur une carte' }

/** Tags of `<head>` shared by the app and the static pages, after charset and viewport. */
export function headTags(meta: PageMeta): Html {
  const url = absoluteUrl(meta.path)
  const image = absoluteUrl(OG_IMAGE.path)
  // `</script>` inside a string would close the tag early.
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': meta.structuredData }).replace(/</g, '\\u003c')
  return html`
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    ${meta.noindex ? html`<meta name="robots" content="noindex" />` : html`<link rel="canonical" href="${url}" />`}
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="${OG_IMAGE.width}" />
    <meta property="og:image:height" content="${OG_IMAGE.height}" />
    <meta property="og:image:alt" content="${OG_IMAGE.alt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${new Html(jsonLd)}</script>
  `
}

/** A whole static page: its head, the app's stylesheets, then its body. */
export function htmlDocument(meta: PageMeta, stylesheets: string[], body: Html): string {
  return html`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    ${stylesheets.map((href) => html`<link rel="stylesheet" href="${href}" />`)}
    ${headTags(meta)}
  </head>
  ${body}
</html>
`.value
}
