import { describe, expect, it } from 'vitest'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import { loadParcelle } from './cadastre'
import { loadRisques } from './georisques'
import parcelleAiguesJuntes148 from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelleAiguesJuntes153 from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zb-153.json'
import parcelleAmberieu183 from './__fixtures__/cadastre/parcelle-amberieu-01004-bc-183.json'
import parcelleAmberieu724 from './__fixtures__/cadastre/parcelle-amberieu-01004-bi-724.json'
import parcelleBordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelleBordeaux368 from './__fixtures__/cadastre/parcelle-bordeaux-33063-bo-368.json'
import parcelleBordeaux384 from './__fixtures__/cadastre/parcelle-bordeaux-33063-bo-384.json'
import parcelleFeyzin from './__fixtures__/cadastre/parcelle-feyzin-69276-bb-221.json'
import parcelleLyon from './__fixtures__/cadastre/parcelle-lyon-69382-ab-62.json'
import parcelleParis from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'
import parcellePleaux from './__fixtures__/cadastre/parcelle-pleaux-15153-0f-262.json'
import aucunResultat from './__fixtures__/georisques/aucun-resultat.json'
import aziParis from './__fixtures__/georisques/gaspar-azi-75056.json'
import cavitesAiguesJuntes153 from './__fixtures__/georisques/cavites-aigues-juntes-09001-zb-153.json'
import aziAiguesJuntes from './__fixtures__/georisques/gaspar-azi-09001.json'
import catnatAiguesJuntes from './__fixtures__/georisques/gaspar-catnat-09001.json'
import radonAiguesJuntes from './__fixtures__/georisques/radon-09001.json'
import sspAucunSite from './__fixtures__/georisques/ssp-aucun-site.json'
import catnatParis from './__fixtures__/georisques/gaspar-catnat-75056.json'
import risquesAiguesJuntes148 from './__fixtures__/georisques/gaspar-risques-aigues-juntes-09001-zc-148.json'
import triParis from './__fixtures__/georisques/gaspar-tri-75056.json'
import icpeFeyzin from './__fixtures__/georisques/installations-classees-feyzin-69276-bb-221.json'
import icpeParis from './__fixtures__/georisques/installations-classees-paris-75107-bq-3.json'
import mvtAmberieu183 from './__fixtures__/georisques/mvt-amberieu-01004-bc-183.json'
import radonPleaux from './__fixtures__/georisques/radon-15153.json'
import radonParis7e from './__fixtures__/georisques/radon-75107.json'
import rgaAiguesJuntes148 from './__fixtures__/georisques/rga-aigues-juntes-09001-zc-148.json'
import rgaAmberieu724 from './__fixtures__/georisques/rga-amberieu-01004-bi-724.json'
import rgaBordeaux from './__fixtures__/georisques/rga-bordeaux-33063-kj-33.json'
import sspBordeaux368 from './__fixtures__/georisques/ssp-bordeaux-33063-bo-368.json'
import sspBordeaux384 from './__fixtures__/georisques/ssp-bordeaux-33063-bo-384.json'
import sspParis from './__fixtures__/georisques/ssp-paris-75107-bq-3.json'
import sismiqueAiguesJuntes from './__fixtures__/georisques/zonage-sismique-09001.json'
import sismiqueLyon from './__fixtures__/georisques/zonage-sismique-69123.json'

const parcelle = (idu: string, body: unknown) => loadParcelle(fakeFetch([{ match: 'cadastre/parcelle', body }]), idu)

/** Toutes les réponses de Géorisques pour Aigues-Juntes ZC 148, terrain nu en zone rurale. */
const aiguesJuntes148: FakeRoute[] = [
  { match: '/api/v1/rga?', body: rgaAiguesJuntes148 },
  { match: '/api/v1/cavites?', body: aucunResultat },
  { match: '/api/v1/mvt?', body: aucunResultat },
  { match: '/api/v1/ssp?', body: sspAucunSite },
  { match: '/api/v1/installations_classees?', body: aucunResultat },
  { match: '/api/v1/gaspar/risques?', body: risquesAiguesJuntes148 },
  { match: '/api/v1/gaspar/azi?code_insee=09001', body: aziAiguesJuntes },
  { match: '/api/v1/gaspar/tri?code_insee=09001', body: aucunResultat },
  { match: '/api/v1/zonage_sismique?code_insee=09001', body: sismiqueAiguesJuntes },
  { match: '/api/v1/radon?code_insee=09001', body: radonAiguesJuntes },
  { match: '/api/v1/gaspar/catnat?code_insee=09001', body: catnatAiguesJuntes },
]

describe('loadRisques', () => {
  it('interroge chaque service de Géorisques une fois, sans clé, et range les risques de l’emplacement avant ceux de la commune', async () => {
    const fetch = fakeFetch(aiguesJuntes148)

    const { risques } = await loadRisques(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes148))

    // Ni le rapport de risques (hors service), ni `azi`/`tri` sans préfixe `gaspar/` (404), ni
    // `gaspar/pprn` (qui ignore ses filtres).
    expect(fetch.calls.toSorted()).toEqual([
      'https://www.georisques.gouv.fr/api/v1/cavites?latlon=1.471231,43.055679&rayon=500&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/gaspar/azi?code_insee=09001',
      'https://www.georisques.gouv.fr/api/v1/gaspar/catnat?code_insee=09001&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/gaspar/risques?latlon=1.471231,43.055679',
      'https://www.georisques.gouv.fr/api/v1/gaspar/tri?code_insee=09001',
      'https://www.georisques.gouv.fr/api/v1/installations_classees?latlon=1.471231,43.055679&rayon=1000&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/mvt?latlon=1.471231,43.055679&rayon=500&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/radon?code_insee=09001',
      'https://www.georisques.gouv.fr/api/v1/rga?latlon=1.471231,43.055679',
      'https://www.georisques.gouv.fr/api/v1/ssp?latlon=1.471231,43.055679&rayon=500&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/zonage_sismique?code_insee=09001',
    ])
    expect(risques.map(({ id, portee, disponible }) => ({ id, portee, disponible }))).toEqual([
      { id: 'argiles', portee: 'emplacement', disponible: true },
      { id: 'cavites', portee: 'emplacement', disponible: true },
      { id: 'mouvements-terrain', portee: 'emplacement', disponible: true },
      { id: 'sols-pollues', portee: 'emplacement', disponible: true },
      { id: 'anciens-sites', portee: 'emplacement', disponible: true },
      { id: 'installations-classees', portee: 'emplacement', disponible: true },
      { id: 'risques-commune', portee: 'commune', disponible: true },
      { id: 'azi', portee: 'commune', disponible: true },
      { id: 'tri', portee: 'commune', disponible: true },
      { id: 'sismicite', portee: 'commune', disponible: true },
      { id: 'radon', portee: 'commune', disponible: true },
      { id: 'catnat', portee: 'commune', disponible: true },
    ])
  })

  it('donne l’exposition de l’emplacement aux argiles, en alerte quand elle est forte', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/rga?', body: rgaAiguesJuntes148 }])

    const { risques } = await loadRisques(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes148))

    expect(fetch.calls).toContain('https://www.georisques.gouv.fr/api/v1/rga?latlon=1.471231,43.055679')
    expect(risques.find(({ id }) => id === 'argiles')).toEqual({
      id: 'argiles',
      libelle: 'Retrait-gonflement des argiles',
      portee: 'emplacement',
      lien: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/retrait-gonflement-des-argiles',
      disponible: true,
      niveau: 'alerte',
      valeur: 'Exposition forte',
      detail:
        'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.',
      elements: [],
    })
  })

  it('met en vigilance une exposition moyenne aux argiles, où l’étude de sol est aussi exigée', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/rga?', body: rgaBordeaux }])

    const { risques } = await loadRisques(fetch, await parcelle('33063000KJ0033', parcelleBordeaux))

    expect(risques.find(({ id }) => id === 'argiles')).toMatchObject({
      niveau: 'vigilance',
      valeur: 'Exposition moyenne',
      detail:
        'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.',
    })
  })

  it('ne fait qu’informer d’une exposition faible aux argiles', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/rga?', body: rgaAmberieu724 }])

    const { risques } = await loadRisques(fetch, await parcelle('01004000BI0724', parcelleAmberieu724))

    expect(risques.find(({ id }) => id === 'argiles')).toMatchObject({
      niveau: 'information',
      valeur: 'Exposition faible',
      detail: 'Les sols argileux y bougent peu avec l’humidité : aucune étude de sol n’est exigée à ce niveau.',
    })
  })

  it('n’affirme rien des argiles quand Géorisques n’a pas de donnée à l’emplacement', async () => {
    // Réponse réelle à Paris : 200 avec un corps vide.
    const fetch = fakeFetch([{ match: '/api/v1/rga?', text: '' }])

    const { risques } = await loadRisques(fetch, await parcelle('75107000BQ0003', parcelleParis))

    expect(risques.find(({ id }) => id === 'argiles')).toMatchObject({
      disponible: true,
      niveau: 'information',
      valeur: 'Aucune donnée',
      detail: 'Géorisques ne donne pas d’exposition aux argiles à cet emplacement.',
    })
  })

  it('met en alerte une cavité souterraine recensée sur la parcelle', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/cavites?', body: cavitesAiguesJuntes153 }])

    const { risques } = await loadRisques(fetch, await parcelle('09001000ZB0153', parcelleAiguesJuntes153))

    expect(fetch.calls).toContain(
      'https://www.georisques.gouv.fr/api/v1/cavites?latlon=1.486727,43.053856&rayon=500&page_size=1000',
    )
    expect(risques.find(({ id }) => id === 'cavites')).toEqual({
      id: 'cavites',
      libelle: 'Cavités souterraines',
      portee: 'emplacement',
      lien: 'https://www.georisques.gouv.fr/consulter-les-dossiers-thematiques/dossier-expert-sur-les-cavites-souterraines',
      disponible: true,
      niveau: 'alerte',
      valeur: '1 recensée à moins de 500 m',
      detail: 'Une cavité est recensée sur la parcelle ou à moins de 100 m : le sol peut s’y affaisser ou s’effondrer.',
      elements: [
        { id: 'MPYAA0000559', libelle: 'Grotte de Falgalle 2', precision: 'naturelle · sur la parcelle', lien: null },
      ],
    })
  })

  it('n’affirme rien des cavités quand aucune n’est recensée autour de la parcelle', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/cavites?', body: aucunResultat }])

    const { risques } = await loadRisques(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes148))

    expect(risques.find(({ id }) => id === 'cavites')).toMatchObject({
      niveau: 'information',
      valeur: 'Aucune recensée à moins de 500 m',
      detail: null,
      elements: [],
    })
  })

  it('met en alerte un mouvement de terrain survenu à moins de 100 m, et cite les autres du plus proche au plus éloigné', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/mvt?', body: mvtAmberieu183 }])

    const { risques } = await loadRisques(fetch, await parcelle('01004000BC0183', parcelleAmberieu183))

    expect(fetch.calls).toContain('https://www.georisques.gouv.fr/api/v1/mvt?latlon=5.370047,45.961458&rayon=500&page_size=1000')
    expect(risques.find(({ id }) => id === 'mouvements-terrain')).toEqual({
      id: 'mouvements-terrain',
      libelle: 'Mouvements de terrain',
      portee: 'emplacement',
      lien: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/mouvement-de-terrain',
      disponible: true,
      niveau: 'alerte',
      valeur: '2 recensés à moins de 500 m',
      detail: 'Un glissement, un éboulement ou une coulée s’est déjà produit sur la parcelle ou à moins de 100 m.',
      // Distances au bord de la parcelle : 96,9 m et 197,7 m.
      elements: [
        { id: '60100140', libelle: 'Glissement', precision: '1977 · à 100 m', lien: null },
        { id: '60100142', libelle: 'Glissement', precision: '2008 · à 200 m', lien: null },
      ],
    })
  })

  it('met en alerte un sol pollué recensé sur la parcelle, et compte une seule fois un site à la fois instruit et classé', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/ssp?', body: sspBordeaux368 }])

    const { risques } = await loadRisques(fetch, await parcelle('33063000BO0368', parcelleBordeaux368))

    // Sols pollués et anciens sites se lisent dans la même réponse, demandée une fois.
    expect(fetch.calls.filter((url) => url.includes('/ssp?'))).toEqual([
      'https://www.georisques.gouv.fr/api/v1/ssp?latlon=-0.553122,44.836200&rayon=500&page_size=1000',
    ])
    expect(risques.find(({ id }) => id === 'sols-pollues')).toEqual({
      id: 'sols-pollues',
      libelle: 'Sols pollués',
      portee: 'emplacement',
      lien: 'https://www.georisques.gouv.fr/sites-et-sols-pollues-ou-potentiellement-pollues',
      disponible: true,
      niveau: 'alerte',
      valeur: '4 sites à moins de 500 m',
      detail:
        'Un sol pollué est recensé sur la parcelle ou à moins de 100 m : y construire peut exiger une étude de sol et des précautions d’usage.',
      elements: [
        {
          id: 'SSP00012540101',
          libelle: 'ARDEA',
          precision: 'secteur d’information sur les sols · sur la parcelle',
          lien: 'https://fiches-risques.brgm.fr/georisques/infosols/classification/SSP00012540101',
        },
        {
          id: 'SSP00039740101',
          libelle: 'DOMAINES CORDIER - SHELL',
          precision: 'secteur d’information sur les sols · à 420 m',
          lien: 'https://fiches-risques.brgm.fr/georisques/infosols/classification/SSP00039740101',
        },
        {
          id: 'SSP000746301',
          libelle: 'SHELL Quai de la Souys',
          precision: 'site pollué, dossier clos · à 440 m',
          lien: 'https://fiches-risques.brgm.fr/georisques/infosols/instruction/SSP000746301',
        },
        {
          id: 'SSP40896601',
          libelle: 'EKEM (KEYOR)',
          precision: 'site pollué, dossier clos · à 470 m',
          lien: 'https://fiches-risques.brgm.fr/georisques/infosols/instruction/SSP40896601',
        },
      ],
    })
  })

  it('compte les anciens sites industriels autour de la parcelle, sans y voir une pollution avérée', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/ssp?', body: sspParis }])

    const { risques } = await loadRisques(fetch, await parcelle('75107000BQ0003', parcelleParis))

    expect(risques.find(({ id }) => id === 'sols-pollues')).toMatchObject({
      niveau: 'information',
      valeur: 'Aucun site recensé à moins de 500 m',
      detail: null,
      elements: [],
    })
    expect(risques.find(({ id }) => id === 'anciens-sites')).toEqual({
      id: 'anciens-sites',
      libelle: 'Anciens sites industriels',
      portee: 'emplacement',
      lien: 'https://www.georisques.gouv.fr/sites-et-sols-pollues-ou-potentiellement-pollues',
      disponible: true,
      niveau: 'information',
      valeur: '27 recensés à moins de 500 m',
      detail:
        'Activités passées, industrielles ou de service, qui ont pu polluer les sols : leur présence ne prouve pas une pollution.',
      // Les cinq plus proches ; la base ne nomme pas toujours l'établissement.
      elements: [
        {
          id: 'SSP3868968',
          libelle: '8 avenue SEGUR',
          precision: 'à 60 m',
          lien: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3868968',
        },
        {
          id: 'SSP3869245',
          libelle: '21 bis avenue SEGUR',
          precision: 'à 80 m',
          lien: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3869245',
        },
        {
          id: 'SSP3867129',
          libelle: '7 Place FONTENOY',
          precision: 'à 90 m',
          lien: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3867129',
        },
        {
          id: 'SSP3865346',
          libelle: 'Teinturier, usine de textile',
          precision: '15 avenue Segur · à 160 m',
          lien: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3865346',
        },
        {
          id: 'SSP3865348',
          libelle: "Fabrique d'appareils téléphoniques",
          precision: '46 avenue Breteuil · à 210 m',
          lien: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3865348',
        },
      ],
    })
  })

  it('met en vigilance un ancien site industriel recensé sur la parcelle même, et en alerte un sol pollué voisin', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/ssp?', body: sspBordeaux384 }])

    const { risques } = await loadRisques(fetch, await parcelle('33063000BO0384', parcelleBordeaux384))

    expect(risques.find(({ id }) => id === 'anciens-sites')).toMatchObject({
      niveau: 'vigilance',
      valeur: '35 recensés à moins de 500 m',
      detail:
        'Une activité passée, industrielle ou de service, est recensée sur la parcelle : elle a pu en polluer le sol, sans que ce soit prouvé.',
    })
    const [premier] = risques.flatMap((risque) => (risque.id === 'anciens-sites' && risque.disponible ? risque.elements : []))
    expect(premier).toEqual({
      id: 'SSP3772851',
      libelle: '53 Quai Deschamps',
      precision: 'sur la parcelle',
      lien: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3772851',
    })
    expect(risques.find(({ id }) => id === 'sols-pollues')).toMatchObject({
      niveau: 'alerte',
      elements: expect.arrayContaining([
        expect.objectContaining({ libelle: 'ARDEA', precision: 'secteur d’information sur les sols · à 10 m' }),
      ]),
    })
  })

  it('met en alerte un établissement Seveso seuil haut à moins d’1 km, cité avant les installations plus proches', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/installations_classees?', body: icpeFeyzin }])

    const { risques } = await loadRisques(fetch, await parcelle('69276000BB0221', parcelleFeyzin))

    expect(fetch.calls).toContain(
      'https://www.georisques.gouv.fr/api/v1/installations_classees?latlon=4.856195,45.670037&rayon=1000&page_size=1000',
    )
    // Distances au bord de la parcelle : 790,1 m ; 271,1 m ; 339,9 m ; 626,8 m ; 822,6 m. ENERGYST,
    // au régime « Non ICPE », n'est pas une installation classée.
    expect(risques.find(({ id }) => id === 'installations-classees')).toEqual({
      id: 'installations-classees',
      libelle: 'Installations classées',
      portee: 'emplacement',
      lien: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/accident-industriel',
      disponible: true,
      niveau: 'alerte',
      valeur: '5 à moins de 1 km',
      detail:
        'Un établissement Seveso seuil haut, où un accident majeur est possible, est recensé à moins de 1 km : un plan de prévention des risques technologiques peut encadrer les constructions alentour.',
      elements: [
        {
          id: '0006103973',
          libelle: 'TotalEnergies Raffinage France',
          precision: 'Seveso seuil haut · à 790 m',
          lien: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0006103973',
        },
        {
          id: '0010600288',
          libelle: 'DESCOTES EX KD VALVES',
          precision: 'Enregistrement · à 270 m',
          lien: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0010600288',
        },
        {
          id: '0006113530',
          libelle: 'BROC SERVICE FRAIS',
          precision: 'Autres régimes · à 340 m',
          lien: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0006113530',
        },
        {
          id: '0010600551',
          libelle: 'STEF TRANSPORT LYON EST',
          precision: 'Autres régimes · à 630 m',
          lien: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0010600551',
        },
        {
          id: '0056901134',
          libelle: 'DECHETTERIE FEYZIN',
          precision: 'Enregistrement · à 820 m',
          lien: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0056901134',
        },
      ],
    })
  })

  it('ne fait qu’informer des installations classées ordinaires du voisinage', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/installations_classees?', body: icpeParis }])

    const { risques } = await loadRisques(fetch, await parcelle('75107000BQ0003', parcelleParis))

    expect(risques.find(({ id }) => id === 'installations-classees')).toMatchObject({
      niveau: 'information',
      valeur: '4 à moins de 1 km',
      detail: 'Activités encadrées pour leurs risques ou leurs nuisances (bruit, rejets, trafic…).',
    })
  })

  it('donne la zone de sismicité de la commune, en vigilance là où les maisons neuves suivent des règles parasismiques', async () => {
    const fetch = fakeFetch([
      { match: '/api/v1/rga?', body: rgaAiguesJuntes148 },
      { match: 'zonage_sismique?code_insee=09001', body: sismiqueAiguesJuntes },
    ])

    const { risques } = await loadRisques(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes148))

    expect(risques.find(({ id }) => id === 'sismicite')).toEqual({
      id: 'sismicite',
      libelle: 'Sismicité',
      portee: 'commune',
      lien: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/seisme',
      disponible: true,
      niveau: 'vigilance',
      valeur: 'Zone 3 · modérée',
      detail: 'Une maison neuve doit y respecter les règles de construction parasismique.',
      elements: [],
    })
  })

  it('cherche la sismicité de Lyon sous le code de la commune quand celui de l’arrondissement ne donne rien', async () => {
    const fetch = fakeFetch([
      { match: 'zonage_sismique?code_insee=69382', body: aucunResultat },
      { match: 'zonage_sismique?code_insee=69123', body: sismiqueLyon },
    ])

    const { risques } = await loadRisques(fetch, await parcelle('69382000AB0062', parcelleLyon))

    expect(fetch.calls.filter((url) => url.includes('zonage_sismique'))).toEqual([
      'https://www.georisques.gouv.fr/api/v1/zonage_sismique?code_insee=69382',
      'https://www.georisques.gouv.fr/api/v1/zonage_sismique?code_insee=69123',
    ])
    expect(risques.find(({ id }) => id === 'sismicite')).toMatchObject({ niveau: 'information', valeur: 'Zone 2 · faible' })
  })

  it('donne le potentiel radon de la commune, en vigilance quand il est significatif', async () => {
    const fetch = fakeFetch([{ match: 'radon?code_insee=15153', body: radonPleaux }])

    const { risques } = await loadRisques(fetch, await parcelle('151530000F0262', parcellePleaux))

    expect(risques.find(({ id }) => id === 'radon')).toEqual({
      id: 'radon',
      libelle: 'Radon',
      portee: 'commune',
      lien: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/radon',
      disponible: true,
      niveau: 'vigilance',
      valeur: 'Potentiel significatif',
      detail:
        'Ce gaz radioactif naturel, qui remonte du sous-sol, peut s’accumuler dans les bâtiments : aérer et étancher les pièces basses limite l’exposition.',
      elements: [],
    })
  })

  it('cherche le radon de Paris sous le code de l’arrondissement', async () => {
    const fetch = fakeFetch([{ match: 'radon?code_insee=75107', body: radonParis7e }])

    const { risques } = await loadRisques(fetch, await parcelle('75107000BQ0003', parcelleParis))

    expect(risques.find(({ id }) => id === 'radon')).toMatchObject({
      niveau: 'information',
      valeur: 'Potentiel faible',
      detail: 'Le sous-sol de la commune émet peu de radon, un gaz radioactif naturel.',
    })
  })

  it('liste les risques recensés dans la commune de la parcelle, sans ceux des communes voisines', async () => {
    const fetch = fakeFetch([{ match: 'gaspar/risques?', body: risquesAiguesJuntes148 }])

    const { risques } = await loadRisques(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes148))

    expect(fetch.calls).toContain('https://www.georisques.gouv.fr/api/v1/gaspar/risques?latlon=1.471231,43.055679')
    expect(risques.find(({ id }) => id === 'risques-commune')).toEqual({
      id: 'risques-commune',
      libelle: 'Risques recensés dans la commune',
      portee: 'commune',
      lien: 'https://www.georisques.gouv.fr/minformer-sur-un-risque',
      disponible: true,
      niveau: 'information',
      valeur: '5 risques',
      detail: 'Risques majeurs que l’État recense pour toute la commune : ils ne visent pas forcément la parcelle.',
      elements: [
        {
          id: '12',
          libelle: 'Mouvement de terrain',
          precision: "Affaissements et effondrements d'origine anthropique (anciennes carrières souterraines, hors mines)",
          lien: null,
        },
        { id: '13', libelle: 'Séisme', precision: null, lien: null },
        { id: '16', libelle: 'Feu de forêt', precision: null, lien: null },
        {
          id: '17',
          libelle: "Phénomène lié à l'atmosphère",
          precision: 'Neige et pluies verglaçantes',
          lien: null,
        },
        { id: '23', libelle: 'Rupture de barrage', precision: null, lien: null },
      ],
    })
  })

  it('signale l’atlas des zones inondables et le territoire à risque important d’inondation qui couvrent la commune', async () => {
    const fetch = fakeFetch([
      { match: 'gaspar/azi?code_insee=75056', body: aziParis },
      { match: 'gaspar/tri?code_insee=75056', body: triParis },
    ])

    const { risques } = await loadRisques(fetch, await parcelle('75107000BQ0003', parcelleParis))

    expect(risques.find(({ id }) => id === 'azi')).toEqual({
      id: 'azi',
      libelle: 'Atlas des zones inondables',
      portee: 'commune',
      lien: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/inondation',
      disponible: true,
      niveau: 'vigilance',
      valeur: 'Commune couverte',
      detail:
        'Un atlas cartographie les zones inondables de la commune : la carte de Géorisques montre si la parcelle en fait partie.',
      elements: [{ id: '93DDT19990004', libelle: 'La Seine', precision: 'diffusé le 01/12/1999', lien: null }],
    })
    expect(risques.find(({ id }) => id === 'tri')).toEqual({
      id: 'tri',
      libelle: 'Territoire à risque important d’inondation',
      portee: 'commune',
      lien: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/inondation',
      disponible: true,
      niveau: 'vigilance',
      valeur: 'Commune concernée',
      detail:
        'La commune fait partie d’un territoire où les inondations auraient de lourdes conséquences, et dont les zones inondables sont cartographiées : la carte de Géorisques montre si la parcelle en fait partie.',
      elements: [
        {
          id: '93DRIEE_IF20140001',
          libelle: 'Métropole Francilienne',
          precision: 'cartographié le 20/12/2013',
          lien: null,
        },
      ],
    })
  })

  it('n’affirme rien des inondations quand la commune n’a ni atlas ni territoire à risque recensé', async () => {
    const fetch = fakeFetch([
      { match: 'gaspar/azi?code_insee=33063', body: aucunResultat },
      { match: 'gaspar/tri?code_insee=09001', body: aucunResultat },
    ])

    const bordeaux = await loadRisques(fetch, await parcelle('33063000KJ0033', parcelleBordeaux))
    const aiguesJuntes = await loadRisques(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes148))

    expect(bordeaux.risques.find(({ id }) => id === 'azi')).toMatchObject({
      niveau: 'information',
      valeur: 'Aucun atlas recensé',
      detail: null,
      elements: [],
    })
    expect(aiguesJuntes.risques.find(({ id }) => id === 'tri')).toMatchObject({
      niveau: 'information',
      valeur: 'Aucun territoire recensé',
      detail: null,
      elements: [],
    })
  })

  it('compte les catastrophes naturelles reconnues dans la commune et cite les plus récentes', async () => {
    const fetch = fakeFetch([{ match: 'gaspar/catnat?code_insee=75056', body: catnatParis }])

    const { risques } = await loadRisques(fetch, await parcelle('75107000BQ0003', parcelleParis))

    // Une seule page : le lien `next` de Géorisques pointe vers un hôte interne, injoignable.
    expect(fetch.calls).toContain('https://www.georisques.gouv.fr/api/v1/gaspar/catnat?code_insee=75056&page_size=1000')
    expect(risques.find(({ id }) => id === 'catnat')).toEqual({
      id: 'catnat',
      libelle: 'Catastrophes naturelles',
      portee: 'commune',
      lien: 'https://www.georisques.gouv.fr/le-dispositif-dindemnisation-des-catastrophes-naturelles',
      disponible: true,
      niveau: 'information',
      valeur: '20 événements reconnus',
      detail:
        'Événements reconnus par arrêté comme catastrophes naturelles dans la commune, ce qui a ouvert droit à indemnisation : ils disent ce qui s’y est déjà produit.',
      elements: [
        {
          id: 'INTE1831446A-27/07/2018-Inondations et/ou Coulées de Boue',
          libelle: 'Inondations et/ou Coulées de Boue',
          precision: 'le 27/07/2018',
          lien: null,
        },
        {
          id: 'INTE1804348A-15/01/2018-Inondations et/ou Coulées de Boue',
          libelle: 'Inondations et/ou Coulées de Boue',
          precision: 'du 15/01/2018 au 05/02/2018',
          lien: null,
        },
        {
          id: 'INTE1831446A-09/07/2017-Inondations et/ou Coulées de Boue',
          libelle: 'Inondations et/ou Coulées de Boue',
          precision: 'du 09/07/2017 au 10/07/2017',
          lien: null,
        },
        {
          id: 'INTE1615488A-28/05/2016-Inondations et/ou Coulées de Boue',
          libelle: 'Inondations et/ou Coulées de Boue',
          precision: 'du 28/05/2016 au 05/06/2016',
          lien: null,
        },
        {
          id: 'INTE0600186A-23/06/2005-Inondations et/ou Coulées de Boue',
          libelle: 'Inondations et/ou Coulées de Boue',
          precision: 'le 23/06/2005',
          lien: null,
        },
      ],
    })
  })

  it('montre les autres risques quand l’un des services de Géorisques échoue', async () => {
    const fetch = fakeFetch([
      { match: '/api/v1/rga?', body: rgaAiguesJuntes148 },
      { match: 'zonage_sismique?', status: 500, body: 'Internal Server Error' },
    ])

    const { risques } = await loadRisques(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes148))

    expect(risques.find(({ id }) => id === 'argiles')).toMatchObject({ disponible: true, valeur: 'Exposition forte' })
    expect(risques.find(({ id }) => id === 'sismicite')).toEqual({
      id: 'sismicite',
      libelle: 'Sismicité',
      portee: 'commune',
      lien: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/seisme',
      disponible: false,
    })
  })

  it('échoue quand aucun service de Géorisques ne répond', async () => {
    const fetch = fakeFetch([{ match: 'georisques.gouv.fr', status: 503, body: 'Service Unavailable' }])

    const risques = loadRisques(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes148))

    await expect(risques).rejects.toMatchObject({ name: 'ApiError', kind: 'http', status: 503 })
  })
})
