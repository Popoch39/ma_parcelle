/** Production address of the app, without a trailing slash: canonical URLs, sitemap, Open Graph. */
export const SITE_URL = 'https://ma-parcelle.pages.dev'

export const SITE_NAME = 'Ma parcelle'

/** Absolute URL of a path of the site. */
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`
