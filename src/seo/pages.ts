import type { Municipality } from '@/api/municipalities'
import {
  departmentPath,
  DIRECTORY_PATH,
  hasPage,
  mapPath,
  municipalityPath,
  type Catalog,
  type Department,
} from './catalog.ts'
import { formatDecimal, formatDistance, formatInteger, inPlace, ofPlace } from './french.ts'
import { html, type Html, type PageMeta } from './html.ts'
import { absoluteUrl, SITE_NAME, SITE_URL } from './site.ts'

// Runs at build time: see the import rule in plugin.ts.

const WEBSITE_ID = `${SITE_URL}/#website`

export const HOME_META: PageMeta = {
  title: 'Ma parcelle : cadastre, PLU, risques et ventes de toute parcelle',
  description:
    'Toute parcelle de France en une fiche gratuite : cadastre, zonage du PLU, servitudes, risques, ventes DVF, DPE et bâtiment, d’après les données publiques.',
  path: '/',
  structuredData: [
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      inLanguage: 'fr-FR',
    },
    {
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description:
        'Carte des parcelles cadastrales de France. Une fiche par parcelle réunit cadastre, document d’urbanisme et servitudes, risques, ventes du voisinage, DPE et bâtiment.',
      applicationCategory: 'ReferenceApplication',
      operatingSystem: 'Web',
      inLanguage: 'fr-FR',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR' },
    },
  ],
}

interface Crumb {
  name: string
  path: string
}

const breadcrumbData = (crumbs: Crumb[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map(({ name, path }, i) => ({ '@type': 'ListItem', position: i + 1, name, item: absoluteUrl(path) })),
})

const webPageData = (meta: Pick<PageMeta, 'title' | 'description' | 'path'>, type = 'WebPage') => ({
  '@type': type,
  url: absoluteUrl(meta.path),
  name: meta.title,
  description: meta.description,
  inLanguage: 'fr-FR',
  isPartOf: { '@id': WEBSITE_ID },
})

const HOME_CRUMB: Crumb = { name: 'Accueil', path: '/' }
const DIRECTORY_CRUMB: Crumb = { name: 'Communes', path: DIRECTORY_PATH }
const departmentLabel = ({ name, code }: Pick<Department, 'name' | 'code'>) => `${name} (${code})`
const departmentCrumb = (department: Department): Crumb => ({ name: departmentLabel(department), path: departmentPath(department) })

/** Header, breadcrumb, content and footer shared by the static pages. */
function layout(crumbs: Crumb[], content: Html): Html {
  return html`<body class="min-h-dvh bg-background font-sans text-foreground antialiased">
    <header class="border-b">
      <div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <a href="/" class="flex items-center gap-2 font-semibold">
          <img src="/favicon.svg" alt="" width="24" height="24" class="size-6" />${SITE_NAME}
        </a>
        <a href="${DIRECTORY_PATH}" class="text-sm text-muted-foreground hover:text-foreground">Communes</a>
      </div>
    </header>
    <main class="mx-auto max-w-3xl px-4 py-8">
      ${crumbs.length > 0 &&
      html`<nav aria-label="Fil d’Ariane" class="mb-6 text-sm text-muted-foreground">
        <ol class="flex flex-wrap gap-x-2 gap-y-1">
          ${crumbs.map((crumb, i) =>
            i === crumbs.length - 1
              ? html`<li aria-current="page" class="text-foreground">${crumb.name}</li>`
              : html`<li><a href="${crumb.path}" class="hover:text-foreground hover:underline">${crumb.name}</a> <span aria-hidden="true">›</span></li>`,
          )}
        </ol>
      </nav>`}
      ${content}
    </main>
    <footer class="border-t">
      <div class="mx-auto max-w-3xl space-y-2 px-4 py-6 text-xs text-muted-foreground">
        <p>
          Fiches indicatives, établies à partir de données publiques ouvertes : IGN, DGFiP, Géoportail de l’urbanisme,
          Géorisques, Cerema, ADEME, CSTB et INSEE. Elles ne remplacent pas un certificat d’urbanisme, qui se demande à la mairie.
        </p>
        <p><a href="/" class="underline">${SITE_NAME}</a> est gratuit et sans compte.</p>
      </div>
    </footer>
  </body>`
}

const h2 = (text: string) => html`<h2 class="mt-10 mb-3 text-lg font-semibold">${text}</h2>`
const link = (href: string, text: string) => html`<a href="${href}" class="text-primary underline-offset-2 hover:underline">${text}</a>`
const ctaLink = (href: string, text: string) =>
  html`<a href="${href}" class="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">${text}</a>`

/** A municipality's page if it has one, otherwise the map open on it. */
const municipalityHref = (municipality: Municipality) => (hasPage(municipality) ? municipalityPath(municipality) : mapPath(municipality))

// The DGFiP publishes no sales where the land register replaces it (Alsace-Moselle), nor in Mayotte.
const WITHOUT_SALES = new Set(['57', '67', '68', '976'])

/** What a parcel's report says, block by block, with its source. */
function reportBlocks(municipality: Municipality): Array<{ title: string; text: string }> {
  return [
    { title: 'Cadastre', text: 'référence cadastrale, contenance, section et feuille de la parcelle (API Carto, IGN).' },
    {
      title: 'Urbanisme et servitudes',
      text: 'zone du PLU ou de la carte communale et son règlement, prescriptions, servitudes d’utilité publique, abords des monuments historiques (Géoportail de l’urbanisme).',
    },
    {
      title: 'Risques',
      text: 'inondation, retrait-gonflement des argiles, cavités, mouvements de terrain, sols pollués, installations classées et arrêtés de catastrophe naturelle de la commune (Géorisques).',
    },
    {
      title: 'Ventes',
      text: WITHOUT_SALES.has(municipality.department.code)
        ? `la DGFiP ne publie pas les ventes de ce département : le bloc reste vide ${inPlace(municipality.name)}.`
        : 'ventes publiées du voisinage et prix médian au m² des maisons et des appartements (DVF, via le Cerema).',
    },
    { title: 'DPE', text: 'diagnostics de performance énergétique des logements de la parcelle et du voisinage (ADEME).' },
    { title: 'Bâtiment', text: 'année de construction, hauteur et DPE retenu des bâtiments, altitude du terrain (BDNB du CSTB, IGN).' },
  ]
}

/** Title, description and graph of a municipality's page. */
export function municipalityMeta(catalog: Catalog, municipality: Municipality): PageMeta {
  const { name, department, center, population, postalCodes } = municipality
  const path = municipalityPath(municipality)
  const title = `Cadastre ${ofPlace(name)} (${department.code}) : parcelles, PLU, risques · ${SITE_NAME}`
  const description = `Toute parcelle ${ofPlace(name)} (${department.name}) en une fiche gratuite : cadastre, zonage du PLU, servitudes, risques, ventes DVF et DPE.`
  const parent = municipality.parentInseeCode ? catalog.municipality(municipality.parentInseeCode) : undefined
  return {
    title,
    description,
    path,
    structuredData: [
      { ...webPageData({ title, description, path }), about: { '@id': `${absoluteUrl(path)}#place` } },
      {
        '@type': parent ? 'AdministrativeArea' : 'City',
        '@id': `${absoluteUrl(path)}#place`,
        name,
        identifier: { '@type': 'PropertyValue', propertyID: 'INSEE', value: municipality.inseeCode },
        geo: { '@type': 'GeoCoordinates', latitude: center.lat, longitude: center.lon },
        address: { '@type': 'PostalAddress', postalCode: postalCodes[0], addressRegion: municipality.region.name, addressCountry: 'FR' },
        containedInPlace: parent
          ? { '@type': 'City', name: parent.name }
          : { '@type': 'AdministrativeArea', name: department.name },
        ...(population > 0 && { population }),
      },
      breadcrumbData(municipalityCrumbs(catalog, municipality)),
    ],
  }
}

function municipalityCrumbs(catalog: Catalog, municipality: Municipality): Crumb[] {
  const parent = municipality.parentInseeCode ? catalog.municipality(municipality.parentInseeCode) : undefined
  return [
    HOME_CRUMB,
    DIRECTORY_CRUMB,
    departmentCrumb(catalog.department(municipality.department.code)),
    ...(parent ? [{ name: parent.name, path: municipalityPath(parent) }] : []),
    { name: municipality.name, path: municipalityPath(municipality) },
  ]
}

/** Body of a municipality's page: what its parcels' reports hold and how to reach them. */
export function municipalityBody(catalog: Catalog, municipality: Municipality): Html {
  const { name, department, region, center, population, area, postalCodes } = municipality
  const parent = municipality.parentInseeCode ? catalog.municipality(municipality.parentInseeCode) : undefined
  const districts = catalog.districtsOf(municipality)
  // In Paris, Lyon and Marseille, references and IDU start with the district's code.
  const referenceCode = (districts[0] ?? municipality).inseeCode
  const nearby = catalog.nearby(municipality)
  const density = area > 0 ? population / (area / 100) : null

  const facts: Array<[string, Html | string]> = []
  if (parent) facts.push(['Commune', link(municipalityPath(parent), parent.name)])
  facts.push(
    ['Département', link(departmentPath(department), departmentLabel(department))],
    ['Région', region.name],
    ['Code INSEE', municipality.inseeCode],
    [postalCodes.length > 1 ? 'Codes postaux' : 'Code postal', postalCodes.join(', ')],
    ['Population', `${formatInteger(population)} habitants`],
    ['Superficie', `${formatDecimal(area / 100)} km²`],
  )
  if (density !== null) facts.push(['Densité', `${formatInteger(density)} hab./km²`])

  return layout(
    municipalityCrumbs(catalog, municipality),
    html`
      <h1 class="text-3xl font-bold tracking-tight">Cadastre ${ofPlace(name)}</h1>
      <p class="mt-4 text-base leading-relaxed">
        Cliquez une parcelle ${ofPlace(name)} sur la carte, ou cherchez-la par son adresse ou sa référence cadastrale :
        ${SITE_NAME} réunit sur une seule fiche, gratuitement, ce que les sources publiques en disent. Cadastre,
        zonage du PLU et servitudes, risques, ventes du voisinage, DPE et bâtiment.
      </p>
      <p class="mt-6">${ctaLink(mapPath(municipality), `Voir les parcelles ${ofPlace(name)} sur la carte`)}</p>

      ${h2(`${name} en bref`)}
      <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        ${facts.map(([term, value]) => html`<dt class="text-muted-foreground">${term}</dt><dd>${value}</dd>`)}
      </dl>

      ${districts.length > 0 &&
      html`${h2('Arrondissements')}
        <p class="mb-3 text-sm leading-relaxed">
          Le cadastre ${ofPlace(name)} est tenu par arrondissement : chaque parcelle est rattachée au code INSEE du sien.
        </p>
        <ul class="columns-2 gap-6 text-sm sm:columns-3">
          ${districts.map((district) => html`<li class="py-0.5">${link(municipalityHref(district), district.name)}</li>`)}
        </ul>`}

      ${h2(`Trouver une parcelle ${inPlace(name)}`)}
      <p class="mb-3 text-sm leading-relaxed">La barre de recherche reconnaît :</p>
      <ul class="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
        <li>une adresse, avec son numéro, sa rue et la commune ;</li>
        <li>
          une référence cadastrale, telle qu’elle figure dans les actes : code INSEE, section et numéro, par exemple
          <code class="font-mono">« ${referenceCode} AB 12 »</code>${districts.length === 0 && html`, ou <code class="font-mono">« ${name} AB 12 »</code>`} ;
        </li>
        <li>un IDU, l’identifiant de la parcelle sur 14 caractères, par exemple <code class="font-mono">${referenceCode}000AB0012</code> ;</li>
        <li>
          des coordonnées en degrés, latitude puis longitude, comme celles du centre de la commune :
          <code class="font-mono">${center.lat}, ${center.lon}</code>.
        </li>
      </ul>

      ${h2('Ce que dit la fiche d’une parcelle')}
      <ul class="space-y-2 text-sm leading-relaxed">
        ${reportBlocks(municipality).map(({ title, text }) => html`<li><strong class="font-semibold">${title}</strong> : ${text}</li>`)}
      </ul>

      ${nearby.length > 0 &&
      html`${h2('Communes voisines')}
        <ul class="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          ${nearby.map(
            ({ municipality: neighbor, distance }) =>
              html`<li>${link(municipalityHref(neighbor), neighbor.name)} <span class="text-muted-foreground">(${neighbor.department.code}), à ${formatDistance(distance)}</span></li>`,
          )}
        </ul>`}
    `,
  )
}

/** « 535 communes », « 1 commune et 20 arrondissements ». */
function countLabel({ municipalities }: Department): string {
  const districts = municipalities.filter(({ parentInseeCode }) => parentInseeCode !== null).length
  const count = municipalities.length - districts
  const label = `${formatInteger(count)} commune${count > 1 ? 's' : ''}`
  return districts > 0 ? `${label} et ${districts} arrondissements` : label
}

/** Title, description and graph of a department's page. */
export function departmentMeta(department: Department): PageMeta {
  const path = departmentPath(department)
  const title = `${departmentLabel(department)} : cadastre, ${countLabel(department)} · ${SITE_NAME}`
  const description = `${departmentLabel(department)} : le cadastre de ${countLabel(department)}. Pour chaque parcelle, une fiche gratuite : zonage du PLU, servitudes, risques, ventes DVF et DPE.`
  return {
    title,
    description,
    path,
    structuredData: [webPageData({ title, description, path }, 'CollectionPage'), breadcrumbData([HOME_CRUMB, DIRECTORY_CRUMB, departmentCrumb(department)])],
  }
}

/** Body of a department's page: all its municipalities, from A to Z. */
export function departmentBody(department: Department): Html {
  const { municipalities } = department
  return layout(
    [HOME_CRUMB, DIRECTORY_CRUMB, departmentCrumb(department)],
    html`
      <h1 class="text-3xl font-bold tracking-tight">Cadastre · ${departmentLabel(department)}</h1>
      <p class="mt-4 text-base leading-relaxed">
        ${countLabel(department)} (région ${department.region.name}), de A à Z. Choisissez-en une pour voir ses parcelles
        sur la carte : chacune a sa fiche, avec cadastre, zonage du PLU, servitudes, risques, ventes du voisinage et DPE.
      </p>
      ${h2('Communes')}
      <ul class="columns-2 gap-6 text-sm sm:columns-3">
        ${municipalities.map((municipality) => html`<li class="break-inside-avoid py-0.5">${link(municipalityHref(municipality), municipality.name)}</li>`)}
      </ul>
    `,
  )
}

// The most populated municipalities, linked from the directory.
const LARGEST_COUNT = 30

export function directoryMeta(): PageMeta {
  const title = `Cadastre par commune et par département · ${SITE_NAME}`
  const description = 'Toutes les communes de France, par département : ouvrez le cadastre de la vôtre et la fiche gratuite de chaque parcelle, PLU, risques, ventes et DPE.'
  return {
    title,
    description,
    path: DIRECTORY_PATH,
    structuredData: [webPageData({ title, description, path: DIRECTORY_PATH }, 'CollectionPage'), breadcrumbData([HOME_CRUMB, DIRECTORY_CRUMB])],
  }
}

/** Body of the directory: the largest municipalities, then every department by region. */
export function directoryBody(catalog: Catalog): Html {
  const regions = new Map<string, Department[]>()
  for (const department of catalog.departments) regions.set(department.region.name, [...(regions.get(department.region.name) ?? []), department])
  const largest = catalog.pages.filter(({ parentInseeCode }) => parentInseeCode === null).slice(0, LARGEST_COUNT)
  return layout(
    [HOME_CRUMB, DIRECTORY_CRUMB],
    html`
      <h1 class="text-3xl font-bold tracking-tight">Le cadastre de France, commune par commune</h1>
      <p class="mt-4 text-base leading-relaxed">
        Choisissez un département puis une commune pour voir ses parcelles sur la carte, ou cherchez directement une adresse
        ou une référence cadastrale ${link('/', 'sur la carte')}.
      </p>
      ${h2('Grandes villes')}
      <ul class="columns-2 gap-6 text-sm sm:columns-3">
        ${largest.map((municipality) => html`<li class="py-0.5">${link(municipalityPath(municipality), municipality.name)}</li>`)}
      </ul>
      ${[...regions.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'fr'))
        .map(
          ([region, departments]) => html`${h2(region)}
            <ul class="columns-2 gap-6 text-sm sm:columns-3">
              ${departments.map((department) => html`<li class="py-0.5">${link(departmentPath(department), departmentLabel(department))}</li>`)}
            </ul>`,
        )}
    `,
  )
}

export const NOT_FOUND_META: PageMeta = {
  title: `Page introuvable · ${SITE_NAME}`,
  description: 'Cette page n’existe pas ou plus.',
  path: '/404',
  structuredData: [],
  noindex: true,
}

/** Body of the 404 page, served for any unknown address. */
export function notFoundBody(): Html {
  return layout(
    [],
    html`
      <h1 class="text-3xl font-bold tracking-tight">Page introuvable</h1>
      <p class="mt-4 text-base leading-relaxed">Cette page n’existe pas ou plus.</p>
      <p class="mt-6 flex flex-wrap gap-3">
        ${ctaLink('/', 'Ouvrir la carte')} ${link(DIRECTORY_PATH, 'Parcourir les communes')}
      </p>
    `,
  )
}
