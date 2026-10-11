import type { MultiPolygon, Point, Polygon } from 'geojson'
import { centroideOf, distanceBetweenPolygons, distanceToPolygon } from '@/lib/geo'
import type { NiveauAlerte } from '@/lib/synthese/synthese'
import type { Parcelle } from './cadastre'
import { fetchJson, fetchJsonOuVide } from './fetch-json'
import type { BlocLoader } from './loader'

const API = 'https://www.georisques.gouv.fr/api/v1'
const SITE = 'https://www.georisques.gouv.fr'

// Tout en une page : les réponses sont paginées par 10, et leur lien `next` pointe vers un hôte
// interne de Géorisques, injoignable.
const UNE_PAGE = 'page_size=1000'
/** Rayon de recherche autour du centroïde de la parcelle, en mètres. */
const RAYON = 500
/** Rayon des installations classées, plus large : un accident industriel porte plus loin. */
const RAYON_INSTALLATIONS = 1000
/** En deçà, un site ou une cavité est tout proche de la parcelle, en mètres. */
const TOUT_PROCHE = 100
/** Éléments cités par risque, les plus proches ou les plus récents d'abord ; le total est dans la valeur. */
const CITES = 5

/** Où vaut un risque : à l'emplacement de la parcelle (et autour), ou pour toute sa commune. */
export type PorteeRisque = 'emplacement' | 'commune'

/** Ce qui fonde un risque : un site, une cavité, un arrêté… */
export interface ElementRisque {
  id: string
  libelle: string
  /** Ce qui le situe ou le qualifie, ex. « naturelle · à 12 m ». */
  precision: string | null
  /** Sa fiche sur Géorisques, quand elle existe. */
  lien: string | null
}

interface RisqueCommun {
  id: string
  /** Le risque en clair, ex. « Retrait-gonflement des argiles ». */
  libelle: string
  portee: PorteeRisque
  /** Page de Géorisques qui explique ce risque. */
  lien: string
}

/** Ce que les données de Géorisques disent d'un risque. */
interface Lecture {
  niveau: NiveauAlerte
  /** Ce qu'en disent les données, en quelques mots, ex. « Exposition forte ». */
  valeur: string
  /** Une phrase qui explique la valeur à qui ne connaît pas le jargon. */
  detail: string | null
  elements: ElementRisque[]
}

/** Un risque tel que Géorisques le décrit, ou indisponible quand son service a échoué. */
export type Risque = RisqueCommun & ((Lecture & { disponible: true }) | { disponible: false })

/** Modèle du bloc Risques. */
export interface RisquesBloc {
  risques: Risque[]
}

/** Enveloppe commune des réponses paginées de Géorisques. */
interface Enveloppe<T> {
  results: number
  data: T[]
}

/** Réponse brute de `rga`, un objet nu. */
interface RgaGeorisques {
  codeExposition: string
  exposition: string
}

interface CaviteGeorisques {
  identifiant: string
  /** « naturelle », « carrière », « ouvrage civil »… */
  type: string
  /** Préfixé d'un code de type, ex. « CN_Grotte de Falgalle 2 ». */
  nom: string | null
  longitude: number
  latitude: number
}

interface MouvementTerrainGeorisques {
  identifiant: string
  /** « Glissement », « Éboulement »… */
  type: string
  /** « aaaa-mm-jj », souvent approximative. */
  date_debut: string | null
  longitude: number
  latitude: number
}

/** Ancien site d'activité de la base CASIAS. */
interface CasiasGeorisques {
  identifiant_ssp: string
  nom_etablissement: string | null
  adresse: string | null
  fiche_risque: string | null
  geom: Point
}

/** Site pollué en cours d'instruction ou classé (SIS, SUP). */
interface SitePollueGeorisques {
  identifiant_ssp: string
  /** Nom du site instruit ; les sites classés le donnent dans `nom`. */
  nom_etablissement?: string | null
  nom?: string | null
  adresse: string | null
  /** Instruction : « En cours », « Clôturée ». */
  statut?: string | null
  fiche_risque: string | null
  geom: Point | Polygon | MultiPolygon
}

/** Réponse brute de `ssp` : un objet par sous-base, chacune dans son enveloppe. */
interface SspGeorisques {
  casias: Enveloppe<CasiasGeorisques>
  instructions: Enveloppe<SitePollueGeorisques>
  conclusions_sis: Enveloppe<SitePollueGeorisques>
  conclusions_sup: Enveloppe<SitePollueGeorisques>
}

interface InstallationClasseeGeorisques {
  codeAIOT: string
  raisonSociale: string
  /** « Seveso seuil haut », « Seveso seuil bas », « Non Seveso » ou null. */
  statutSeveso: string | null
  /** « Autorisation », « Enregistrement », « Autres régimes », « Non ICPE »… */
  regime: string | null
  longitude: number
  latitude: number
}

interface ZonageSismiqueGeorisques {
  code_zone: string
}

interface RadonGeorisques {
  classe_potentiel: string
}

interface AziGeorisques {
  code_national_azi: string
  libelle_azi: string
  /** « jj/mm/aaaa ». */
  date_diffusion: string | null
}

interface RisquesCommuneGeorisques {
  code_insee: string
  /** Familles (« 12 ») suivies de leurs risques détaillés (« 121 »). */
  risques_detail: Array<{ num_risque: string; libelle_risque_long: string }>
}

interface CatnatGeorisques {
  code_national_catnat: string
  /** « jj/mm/aaaa ». */
  date_debut_evt: string
  date_fin_evt: string
  libelle_risque_jo: string
}

interface TriGeorisques {
  code_national_tri: string
  libelle_tri: string
  /** « jj/mm/aaaa ». */
  date_arrete_carte: string | null
}

/** De quoi interroger Géorisques pour une parcelle. */
interface Contexte {
  parcelle: Parcelle
  /** Paramètre `latlon` du centroïde de la parcelle. */
  latlon: string
  get: <T>(chemin: string) => Promise<T>
  getOuVide: <T>(chemin: string) => Promise<T | null>
  /** Sites et sols pollués autour de la parcelle : deux risques s'y lisent, demandés une seule fois. */
  ssp: () => Promise<SspGeorisques>
}

/** Un risque du bloc, et comment le lire dans Géorisques. */
interface SourceRisque extends RisqueCommun {
  lire: (contexte: Contexte) => Promise<Lecture>
}

const SOURCES: SourceRisque[] = [
  {
    id: 'argiles',
    libelle: 'Retrait-gonflement des argiles',
    portee: 'emplacement',
    lien: `${SITE}/minformer-sur-un-risque/retrait-gonflement-des-argiles`,
    // Hors des secteurs cartographiés (Paris, par exemple), `rga` répond 200 avec un corps vide.
    lire: async ({ latlon, getOuVide }) => argiles(await getOuVide<RgaGeorisques>(`rga?${latlon}`)),
  },
  {
    id: 'cavites',
    libelle: 'Cavités souterraines',
    portee: 'emplacement',
    lien: `${SITE}/consulter-les-dossiers-thematiques/dossier-expert-sur-les-cavites-souterraines`,
    lire: async ({ parcelle, latlon, get }) =>
      cavites(parcelle, await get<Enveloppe<CaviteGeorisques>>(`cavites?${latlon}&rayon=${RAYON}&${UNE_PAGE}`)),
  },
  {
    id: 'mouvements-terrain',
    libelle: 'Mouvements de terrain',
    portee: 'emplacement',
    lien: `${SITE}/minformer-sur-un-risque/mouvement-de-terrain`,
    lire: async ({ parcelle, latlon, get }) =>
      mouvementsTerrain(
        parcelle,
        await get<Enveloppe<MouvementTerrainGeorisques>>(`mvt?${latlon}&rayon=${RAYON}&${UNE_PAGE}`),
      ),
  },
  {
    id: 'sols-pollues',
    libelle: 'Sols pollués',
    portee: 'emplacement',
    lien: `${SITE}/sites-et-sols-pollues-ou-potentiellement-pollues`,
    lire: async ({ parcelle, ssp }) => solsPollues(parcelle, await ssp()),
  },
  {
    id: 'anciens-sites',
    libelle: 'Anciens sites industriels',
    portee: 'emplacement',
    lien: `${SITE}/sites-et-sols-pollues-ou-potentiellement-pollues`,
    lire: async ({ parcelle, ssp }) => anciensSites(parcelle, (await ssp()).casias),
  },
  {
    id: 'installations-classees',
    libelle: 'Installations classées',
    portee: 'emplacement',
    lien: `${SITE}/minformer-sur-un-risque/accident-industriel`,
    lire: async ({ parcelle, latlon, get }) =>
      installationsClassees(
        parcelle,
        await get<Enveloppe<InstallationClasseeGeorisques>>(
          `installations_classees?${latlon}&rayon=${RAYON_INSTALLATIONS}&${UNE_PAGE}`,
        ),
      ),
  },
  {
    id: 'risques-commune',
    libelle: 'Risques recensés dans la commune',
    portee: 'commune',
    lien: `${SITE}/minformer-sur-un-risque`,
    lire: async ({ parcelle, latlon, get }) => {
      // Le point renvoie aussi les communes voisines : seule celle de la parcelle compte.
      const { data } = await get<Enveloppe<RisquesCommuneGeorisques>>(`gaspar/risques?${latlon}`)
      return risquesCommune(data.find(({ code_insee }) => code_insee === parcelle.commune.codeInsee))
    },
  },
  {
    id: 'azi',
    libelle: 'Atlas des zones inondables',
    portee: 'commune',
    lien: `${SITE}/minformer-sur-un-risque/inondation`,
    lire: async (contexte) => azi(await parCommune<AziGeorisques>(contexte, 'gaspar/azi')),
  },
  {
    id: 'tri',
    libelle: 'Territoire à risque important d’inondation',
    portee: 'commune',
    lien: `${SITE}/minformer-sur-un-risque/inondation`,
    lire: async (contexte) => tri(await parCommune<TriGeorisques>(contexte, 'gaspar/tri')),
  },
  {
    id: 'sismicite',
    libelle: 'Sismicité',
    portee: 'commune',
    lien: `${SITE}/minformer-sur-un-risque/seisme`,
    lire: async (contexte) =>
      sismicite(await parArrondissementPuisCommune<ZonageSismiqueGeorisques>(contexte, 'zonage_sismique')),
  },
  {
    id: 'radon',
    libelle: 'Radon',
    portee: 'commune',
    lien: `${SITE}/minformer-sur-un-risque/radon`,
    lire: async (contexte) => radon(await parArrondissementPuisCommune<RadonGeorisques>(contexte, 'radon')),
  },
  {
    id: 'catnat',
    libelle: 'Catastrophes naturelles',
    portee: 'commune',
    lien: `${SITE}/le-dispositif-dindemnisation-des-catastrophes-naturelles`,
    lire: async ({ parcelle, get }) =>
      catnat(
        await get<Enveloppe<CatnatGeorisques>>(`gaspar/catnat?code_insee=${parcelle.commune.codeInsee}&${UNE_PAGE}`),
      ),
  },
]

/** Chargeur du bloc Risques : ce que Géorisques dit de l'emplacement de la parcelle et de sa commune. */
export const loadRisques: BlocLoader<RisquesBloc> = async (fetch, parcelle, { signal } = {}) => {
  const [lon, lat] = centroideOf(parcelle.geometrie)
  // Au-delà de 6 décimales (10 cm), la précision serait illusoire. Géorisques attend la longitude d'abord.
  const latlon = `latlon=${lon.toFixed(6)},${lat.toFixed(6)}`
  let ssp: Promise<SspGeorisques> | undefined
  const contexte: Contexte = {
    parcelle,
    latlon,
    get: (chemin) => fetchJson(fetch, `${API}/${chemin}`, { signal }),
    getOuVide: (chemin) => fetchJsonOuVide(fetch, `${API}/${chemin}`, { signal }),
    ssp: () => (ssp ??= fetchJson(fetch, `${API}/ssp?${latlon}&rayon=${RAYON}&${UNE_PAGE}`, { signal })),
  }
  // Chaque risque échoue seul ; mais si tous échouent, Géorisques est en panne (ou l'appel
  // annulé) : le bloc échoue avec la première erreur, et propose de réessayer.
  const lectures = await Promise.allSettled(SOURCES.map((source) => source.lire(contexte)))
  const [premierEchec] = lectures.filter((lecture) => lecture.status === 'rejected')
  if (premierEchec && lectures.every(({ status }) => status === 'rejected')) throw premierEchec.reason
  return {
    risques: SOURCES.map(({ lire: _lire, ...risque }, rang): Risque => {
      const lecture = lectures[rang]
      return lecture.status === 'fulfilled'
        ? { ...risque, disponible: true, ...lecture.value }
        : { ...risque, disponible: false }
    }),
  }
}

/**
 * Lignes d'un endpoint communal. Selon l'endpoint, Géorisques range Paris, Lyon et Marseille
 * sous le code de l'arrondissement ou sous celui de la commune : on essaie l'arrondissement,
 * puis la commune s'il ne donne rien.
 */
async function parArrondissementPuisCommune<T>({ parcelle, get }: Contexte, endpoint: string): Promise<T[]> {
  const { arrondissement, commune } = parcelle
  if (arrondissement) {
    const { data } = await get<Enveloppe<T>>(`${endpoint}?code_insee=${arrondissement.codeInsee}`)
    if (data.length > 0) return data
  }
  return (await get<Enveloppe<T>>(`${endpoint}?code_insee=${commune.codeInsee}`)).data
}

/** Lignes d'un endpoint GASPAR, qui range Paris, Lyon et Marseille sous le code de la commune. */
async function parCommune<T>({ parcelle, get }: Contexte, endpoint: string): Promise<T[]> {
  return (await get<Enveloppe<T>>(`${endpoint}?code_insee=${parcelle.commune.codeInsee}`)).data
}

function aucuneDonnee(detail: string | null): Lecture {
  return { niveau: 'information', valeur: 'Aucune donnée', detail, elements: [] }
}

// L'étude de sol (loi ELAN) n'est exigée qu'en exposition moyenne ou forte.
const ETUDE_DE_SOL =
  'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.'
const ARGILES: Record<string, { niveau: NiveauAlerte; detail: string }> = {
  '1': {
    niveau: 'information',
    detail: 'Les sols argileux y bougent peu avec l’humidité : aucune étude de sol n’est exigée à ce niveau.',
  },
  '2': { niveau: 'vigilance', detail: ETUDE_DE_SOL },
  '3': { niveau: 'alerte', detail: ETUDE_DE_SOL },
}

function argiles(rga: RgaGeorisques | null): Lecture {
  const lecture = rga && ARGILES[rga.codeExposition]
  if (!rga || !lecture) {
    return aucuneDonnee('Géorisques ne donne pas d’exposition aux argiles à cet emplacement.')
  }
  return { niveau: lecture.niveau, valeur: rga.exposition, detail: lecture.detail, elements: [] }
}

const metres = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

/** « sur la parcelle » ou « à 120 m », arrondi à 10 m : les positions des bases n'en disent pas plus. */
function aDistance(distance: number): string {
  return distance === 0 ? 'sur la parcelle' : `à ${metres.format(Math.max(10, Math.round(distance / 10) * 10))} m`
}

/** Les éléments, du plus proche de la parcelle au plus éloigné. */
function parDistance<T>(elements: T[], distance: (element: T) => number): Array<{ element: T; distance: number }> {
  return elements
    .map((element) => ({ element, distance: distance(element) }))
    .toSorted((a, b) => a.distance - b.distance)
}

/**
 * Lecture d'un recensement de points autour de la parcelle (cavités, mouvements de terrain) :
 * en alerte quand le plus proche est sur la parcelle ou tout près, en vigilance sinon.
 */
function pointsAutour<T extends { longitude: number; latitude: number }>(
  parcelle: Parcelle,
  { results, data }: Enveloppe<T>,
  textes: { recenses: (nombre: number) => string; aucun: string; toutProche: string; environs: string },
  element: (point: T, distance: number) => ElementRisque,
): Lecture {
  if (results === 0) return { niveau: 'information', valeur: textes.aucun, detail: null, elements: [] }
  const proches = parDistance(data, ({ longitude, latitude }) =>
    distanceToPolygon({ lon: longitude, lat: latitude }, parcelle.geometrie),
  )
  const toutProche = (proches[0]?.distance ?? Infinity) <= TOUT_PROCHE
  return {
    niveau: toutProche ? 'alerte' : 'vigilance',
    valeur: `${results} ${textes.recenses(results)} à moins de ${RAYON} m`,
    detail: toutProche ? textes.toutProche : textes.environs,
    elements: proches.slice(0, CITES).map(({ element: point, distance }) => element(point, distance)),
  }
}

function cavites(parcelle: Parcelle, reponse: Enveloppe<CaviteGeorisques>): Lecture {
  return pointsAutour(
    parcelle,
    reponse,
    {
      recenses: (nombre) => (nombre === 1 ? 'recensée' : 'recensées'),
      aucun: `Aucune recensée à moins de ${RAYON} m`,
      toutProche: `Une cavité est recensée sur la parcelle ou à moins de ${TOUT_PROCHE} m : le sol peut s’y affaisser ou s’effondrer.`,
      environs: 'Des cavités sont recensées dans les environs : le sol peut s’y affaisser ou s’effondrer.',
    },
    (cavite, distance) => ({
      id: cavite.identifiant,
      libelle: cavite.nom?.replace(/^[A-Z]{2}_/, '') || cavite.type,
      precision: `${cavite.type} · ${aDistance(distance)}`,
      lien: null,
    }),
  )
}

function mouvementsTerrain(parcelle: Parcelle, reponse: Enveloppe<MouvementTerrainGeorisques>): Lecture {
  return pointsAutour(
    parcelle,
    reponse,
    {
      recenses: (nombre) => (nombre === 1 ? 'recensé' : 'recensés'),
      aucun: `Aucun recensé à moins de ${RAYON} m`,
      toutProche: `Un glissement, un éboulement ou une coulée s’est déjà produit sur la parcelle ou à moins de ${TOUT_PROCHE} m.`,
      environs: 'Glissements, éboulements ou coulées se sont déjà produits dans les environs.',
    },
    (mouvement, distance) => ({
      id: mouvement.identifiant,
      libelle: mouvement.type,
      precision: [mouvement.date_debut?.slice(0, 4), aDistance(distance)].filter(Boolean).join(' · '),
      lien: null,
    }),
  )
}

/** Distance d'un site (point ou emprise) à la parcelle, en mètres. */
function distanceDuSite(parcelle: Parcelle, geom: Point | Polygon | MultiPolygon): number {
  if (geom.type === 'Point') {
    const [lon, lat] = geom.coordinates
    return distanceToPolygon({ lon, lat }, parcelle.geometrie)
  }
  return distanceBetweenPolygons(geom, parcelle.geometrie)
}

function solsPollues(parcelle: Parcelle, ssp: SspGeorisques): Lecture {
  // Un site instruit puis classé figure dans les deux bases : sa fiche de classement prime.
  const categorises = [
    ...ssp.conclusions_sup.data.map((site) => ({ site, categorie: 'servitude d’utilité publique' })),
    ...ssp.conclusions_sis.data.map((site) => ({ site, categorie: 'secteur d’information sur les sols' })),
    ...ssp.instructions.data.map((site) => ({
      site,
      categorie: site.statut === 'Clôturée' ? 'site pollué, dossier clos' : 'site pollué, dossier en cours',
    })),
  ]
  const cle = ({ site }: (typeof categorises)[number]) => `${nomDuSite(site)}|${site.adresse}`.toUpperCase()
  const sites = categorises.filter((candidat, rang) => categorises.findIndex((autre) => cle(autre) === cle(candidat)) === rang)
  if (sites.length === 0) {
    return { niveau: 'information', valeur: `Aucun site recensé à moins de ${RAYON} m`, detail: null, elements: [] }
  }
  const proches = parDistance(sites, ({ site }) => distanceDuSite(parcelle, site.geom))
  const toutProche = proches[0].distance <= TOUT_PROCHE
  return {
    niveau: toutProche ? 'alerte' : 'vigilance',
    valeur: `${sites.length} ${sites.length === 1 ? 'site' : 'sites'} à moins de ${RAYON} m`,
    detail: toutProche
      ? `Un sol pollué est recensé sur la parcelle ou à moins de ${TOUT_PROCHE} m : y construire peut exiger une étude de sol et des précautions d’usage.`
      : 'Des sols pollués sont recensés dans les environs.',
    elements: proches.slice(0, CITES).map(({ element: { site, categorie }, distance }) => ({
      id: site.identifiant_ssp,
      libelle: nomDuSite(site) ?? site.adresse ?? 'Site sans nom',
      precision: `${categorie} · ${aDistance(distance)}`,
      lien: site.fiche_risque,
    })),
  }
}

function nomDuSite(site: SitePollueGeorisques): string | null {
  return site.nom ?? site.nom_etablissement ?? null
}

function anciensSites(parcelle: Parcelle, { results, data }: Enveloppe<CasiasGeorisques>): Lecture {
  if (results === 0) {
    return { niveau: 'information', valeur: `Aucun recensé à moins de ${RAYON} m`, detail: null, elements: [] }
  }
  const proches = parDistance(data, (site) => distanceDuSite(parcelle, site.geom))
  // Un ancien site n'est qu'un indice : il n'appelle la vigilance que sur la parcelle même.
  const surLaParcelle = proches[0]?.distance === 0
  return {
    niveau: surLaParcelle ? 'vigilance' : 'information',
    valeur: `${results} ${results === 1 ? 'recensé' : 'recensés'} à moins de ${RAYON} m`,
    detail: surLaParcelle
      ? 'Une activité passée, industrielle ou de service, est recensée sur la parcelle : elle a pu en polluer le sol, sans que ce soit prouvé.'
      : 'Activités passées, industrielles ou de service, qui ont pu polluer les sols : leur présence ne prouve pas une pollution.',
    elements: proches.slice(0, CITES).map(({ element: site, distance }) => ({
      id: site.identifiant_ssp,
      libelle: site.nom_etablissement ?? site.adresse ?? 'Site sans nom',
      precision: [site.nom_etablissement && site.adresse, aDistance(distance)].filter(Boolean).join(' · '),
      lien: site.fiche_risque,
    })),
  }
}

const SEVESO: Record<string, { rang: number; niveau: NiveauAlerte; detail: string }> = {
  'Seveso seuil haut': {
    rang: 0,
    niveau: 'alerte',
    detail: `Un établissement Seveso seuil haut, où un accident majeur est possible, est recensé à moins de ${RAYON_INSTALLATIONS / 1000} km : un plan de prévention des risques technologiques peut encadrer les constructions alentour.`,
  },
  'Seveso seuil bas': {
    rang: 1,
    niveau: 'vigilance',
    detail: `Un établissement Seveso seuil bas, où un accident grave est possible, est recensé à moins de ${RAYON_INSTALLATIONS / 1000} km.`,
  },
}

function installationsClassees(parcelle: Parcelle, { data }: Enveloppe<InstallationClasseeGeorisques>): Lecture {
  const installations = data.filter(({ regime }) => regime !== 'Non ICPE')
  const rayon = `à moins de ${RAYON_INSTALLATIONS / 1000} km`
  if (installations.length === 0) {
    return { niveau: 'information', valeur: `Aucune recensée ${rayon}`, detail: null, elements: [] }
  }
  const seveso = (installation: InstallationClasseeGeorisques) => SEVESO[installation.statutSeveso ?? '']
  // Les établissements Seveso d'abord, les plus dangereux en tête ; puis les plus proches.
  const citees = parDistance(installations, ({ longitude, latitude }) =>
    distanceToPolygon({ lon: longitude, lat: latitude }, parcelle.geometrie),
  ).toSorted((a, b) => (seveso(a.element)?.rang ?? 2) - (seveso(b.element)?.rang ?? 2))
  const plusDangereux = seveso(citees[0].element)
  return {
    niveau: plusDangereux?.niveau ?? 'information',
    valeur: `${installations.length} ${rayon}`,
    detail: plusDangereux?.detail ?? 'Activités encadrées pour leurs risques ou leurs nuisances (bruit, rejets, trafic…).',
    elements: citees.slice(0, CITES).map(({ element: installation, distance }) => ({
      id: installation.codeAIOT,
      libelle: installation.raisonSociale,
      precision: [seveso(installation) ? installation.statutSeveso : installation.regime, aDistance(distance)]
        .filter(Boolean)
        .join(' · '),
      lien: `${SITE}/risques/installations/donnees/details/${installation.codeAIOT}`,
    })),
  }
}

// Les règles parasismiques (Eurocode 8) s'imposent aux maisons neuves à partir de la zone 3.
const SISMICITE: Record<string, { nom: string; niveau: NiveauAlerte; detail: string }> = {
  '1': { nom: 'très faible', niveau: 'information', detail: 'Aucune règle parasismique n’y est imposée aux constructions.' },
  '2': {
    nom: 'faible',
    niveau: 'information',
    detail: 'Les règles parasismiques ne s’y imposent qu’à certains bâtiments, comme les écoles ou les hôpitaux.',
  },
  '3': {
    nom: 'modérée',
    niveau: 'vigilance',
    detail: 'Une maison neuve doit y respecter les règles de construction parasismique.',
  },
  '4': {
    nom: 'moyenne',
    niveau: 'alerte',
    detail: 'Toute construction neuve doit y respecter des règles parasismiques renforcées.',
  },
  '5': {
    nom: 'forte',
    niveau: 'alerte',
    detail: 'Toute construction neuve doit y respecter des règles parasismiques renforcées.',
  },
}

function sismicite(zonages: ZonageSismiqueGeorisques[]): Lecture {
  const code = zonages[0]?.code_zone ?? ''
  const zone = SISMICITE[code]
  if (!zone) return aucuneDonnee(null)
  return { niveau: zone.niveau, valeur: `Zone ${code} · ${zone.nom}`, detail: zone.detail, elements: [] }
}

const RADON: Record<string, { niveau: NiveauAlerte; valeur: string; detail: string }> = {
  '1': {
    niveau: 'information',
    valeur: 'Potentiel faible',
    detail: 'Le sous-sol de la commune émet peu de radon, un gaz radioactif naturel.',
  },
  '2': {
    niveau: 'information',
    valeur: 'Potentiel faible, avec des facteurs aggravants',
    detail:
      'Le sous-sol émet peu de radon, un gaz radioactif naturel, mais des failles ou des galeries peuvent localement faciliter sa remontée dans les bâtiments.',
  },
  '3': {
    niveau: 'vigilance',
    valeur: 'Potentiel significatif',
    detail:
      'Ce gaz radioactif naturel, qui remonte du sous-sol, peut s’accumuler dans les bâtiments : aérer et étancher les pièces basses limite l’exposition.',
  },
}

function radon(potentiels: RadonGeorisques[]): Lecture {
  const lecture = RADON[potentiels[0]?.classe_potentiel ?? '']
  return lecture ? { ...lecture, elements: [] } : aucuneDonnee(null)
}

function risquesCommune(commune: RisquesCommuneGeorisques | undefined): Lecture {
  const risques = commune?.risques_detail ?? []
  // Un risque détaillé (« 121 ») précise la famille dont il prolonge le numéro (« 12 »).
  const familles = risques.filter(
    (risque) => !risques.some((famille) => famille !== risque && risque.num_risque.startsWith(famille.num_risque)),
  )
  if (familles.length === 0) return { niveau: 'information', valeur: 'Aucun risque recensé', detail: null, elements: [] }
  return {
    niveau: 'information',
    valeur: `${familles.length} ${familles.length === 1 ? 'risque' : 'risques'}`,
    detail: 'Risques majeurs que l’État recense pour toute la commune : ils ne visent pas forcément la parcelle.',
    elements: familles.map((famille) => {
      const detailles = risques.filter(
        (risque) => risque !== famille && risque.num_risque.startsWith(famille.num_risque),
      )
      return {
        id: famille.num_risque,
        libelle: famille.libelle_risque_long,
        precision: detailles.length > 0 ? detailles.map(({ libelle_risque_long }) => libelle_risque_long).join(' ; ') : null,
        lien: null,
      }
    }),
  }
}

// Atlas et territoires sont communaux : la parcelle n'est pas forcément dans leurs zones inondables.
function azi(atlasDeLaCommune: AziGeorisques[]): Lecture {
  if (atlasDeLaCommune.length === 0) {
    return { niveau: 'information', valeur: 'Aucun atlas recensé', detail: null, elements: [] }
  }
  return {
    niveau: 'vigilance',
    valeur: 'Commune couverte',
    detail:
      'Un atlas cartographie les zones inondables de la commune : la carte de Géorisques montre si la parcelle en fait partie.',
    elements: atlasDeLaCommune.map((atlas) => ({
      id: atlas.code_national_azi,
      libelle: atlas.libelle_azi,
      precision: atlas.date_diffusion && `diffusé le ${atlas.date_diffusion}`,
      lien: null,
    })),
  }
}

function tri(territoires: TriGeorisques[]): Lecture {
  if (territoires.length === 0) {
    return { niveau: 'information', valeur: 'Aucun territoire recensé', detail: null, elements: [] }
  }
  return {
    niveau: 'vigilance',
    valeur: 'Commune concernée',
    detail:
      'La commune fait partie d’un territoire où les inondations auraient de lourdes conséquences, et dont les zones inondables sont cartographiées : la carte de Géorisques montre si la parcelle en fait partie.',
    elements: territoires.map((territoire) => ({
      id: territoire.code_national_tri,
      // « TRI  Métropole Francilienne » : le sigle répète le libellé du risque.
      libelle: territoire.libelle_tri.replace(/^TRI\s+/, '').replace(/\s+/g, ' '),
      precision: territoire.date_arrete_carte && `cartographié le ${territoire.date_arrete_carte}`,
      lien: null,
    })),
  }
}

function catnat({ results, data }: Enveloppe<CatnatGeorisques>): Lecture {
  if (results === 0) return { niveau: 'information', valeur: 'Aucun événement reconnu', detail: null, elements: [] }
  const recents = data
    .toSorted((a, b) => dateIso(b.date_debut_evt).localeCompare(dateIso(a.date_debut_evt)))
    .slice(0, CITES)
  return {
    niveau: 'information',
    valeur: `${results} ${results === 1 ? 'événement reconnu' : 'événements reconnus'}`,
    detail:
      'Événements reconnus par arrêté comme catastrophes naturelles dans la commune, ce qui a ouvert droit à indemnisation : ils disent ce qui s’y est déjà produit.',
    elements: recents.map((evenement) => ({
      // Un même arrêté reconnaît parfois plusieurs événements, ou plusieurs risques d'un événement.
      id: `${evenement.code_national_catnat}-${evenement.date_debut_evt}-${evenement.libelle_risque_jo}`,
      libelle: evenement.libelle_risque_jo,
      precision:
        evenement.date_fin_evt === evenement.date_debut_evt
          ? `le ${evenement.date_debut_evt}`
          : `du ${evenement.date_debut_evt} au ${evenement.date_fin_evt}`,
      lien: null,
    })),
  }
}

/** « jj/mm/aaaa » → « aaaa-mm-jj », qui se trie comme une chaîne. */
function dateIso(date: string): string {
  return date.split('/').reverse().join('-')
}
