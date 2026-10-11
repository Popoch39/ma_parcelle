import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import { loadParcelle } from '../cadastre'
import parcelleAiguesJuntes from '../__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelleBordeaux from '../__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import ceremaAiguesJuntes from '../__fixtures__/cerema/geomutations-aigues-juntes-09001-zc-148.json'
import bordeauxPage1 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-1.json'
import bordeauxPage2 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-2.json'
import bordeauxPage3 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-3.json'
import bordeauxPage4 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-4.json'
import bordeauxPage5 from '../__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-5.json'
import { loadVentes } from '.'

const parcelle = (idu: string, body: unknown) => loadParcelle(fakeFetch([{ match: 'cadastre/parcelle', body }]), idu)

/**
 * Les cinq pages de mutations de l'API Cerema autour de 33063 KJ 33, chacune réduite à
 * quelques mutations. Une page n'est servie qu'à son URL en https : suivre le lien `next` tel
 * quel (en http) tomberait sur « Aucune fixture ».
 */
const ceremaBordeaux: FakeRoute[] = [
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/.*page=2&/, body: bordeauxPage2 },
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/.*page=3&/, body: bordeauxPage3 },
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/.*page=4&/, body: bordeauxPage4 },
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/.*page=5&/, body: bordeauxPage5 },
  { match: /^https:\/\/apidf-preprod\.cerema\.fr\/dvf_opendata\/geomutations\/\?in_bbox=/, body: bordeauxPage1 },
]

beforeAll(() => {
  // La période des ventes (les cinq dernières années) se compte depuis aujourd'hui.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-11T12:00:00+02:00'))
})

describe('loadVentes', () => {
  it('calcule le prix médian au m² des appartements sur les ventes simples du voisinage, avec leur nombre', async () => {
    const fetch = fakeFetch(ceremaBordeaux)

    const ventes = await loadVentes(fetch, await parcelle('33063000KJ0033', parcelleBordeaux))

    // Appartements vendus seuls à moins de 500 m, en €/m² bâti :
    // 117 000 / 36 = 3 250 ; 287 400 / 80 = 3 592,5 ; 182 838 / 45 ≈ 4 063 ; 330 000 / 80 = 4 125 ;
    // 257 000 / 52 ≈ 4 942 ; 138 000 / 23 = 6 000 ; 127 000 / 20 = 6 350 → médiane 4 125.
    expect(ventes.medianes.appartement).toEqual({ prixM2: 4125, ventes: 7 })
  })

  it('ne donne pas de prix médian quand trop peu de ventes simples sont retenues, mais dit combien', async () => {
    const ventes = await loadVentes(fakeFetch(ceremaBordeaux), await parcelle('33063000KJ0033', parcelleBordeaux))

    // Quatre maisons vendues seules à moins de 500 m : en dessous du seuil de cinq.
    expect(ventes.medianes.maison).toEqual({ prixM2: null, ventes: 4 })
  })

  it('demande au Cerema un carré d’environ 1 km sur cinq ans, et suit les pages en https', async () => {
    const fetch = fakeFetch(ceremaBordeaux)

    await loadVentes(fetch, await parcelle('33063000KJ0033', parcelleBordeaux))

    const page = (n: number) =>
      `https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/?anneemut_min=2021&in_bbox=-0.580041%2C44.835945%2C-0.567372%2C44.844928&page=${n}&page_size=500`
    expect(fetch.calls).toEqual([
      'https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/?in_bbox=-0.580041%2C44.835945%2C-0.567372%2C44.844928&anneemut_min=2021&page_size=500',
      page(2),
      page(3),
      page(4),
      page(5),
    ])
  })

  it('liste toutes les ventes du voisinage, de la plus récente à la plus ancienne, en excluant de la médiane le terrain et le local professionnel', async () => {
    const ventes = await loadVentes(fakeFetch(ceremaBordeaux), await parcelle('33063000KJ0033', parcelleBordeaux))

    expect(ventes.source).toBe('cerema')
    expect(ventes.depuis).toBe(2021)
    expect(
      ventes.ventes.map(({ date, type, prix, surfaceBatie, surfaceTerrain, prixM2, exclusion }) => ({
        date,
        type,
        prix,
        surfaceBatie,
        surfaceTerrain,
        prixM2: prixM2 && Math.round(prixM2),
        exclusion,
      })),
    ).toEqual([
      { date: '2025-09-26', type: 'maison', prix: 632380, surfaceBatie: 86, surfaceTerrain: 56, prixM2: 7353, exclusion: null },
      { date: '2025-09-10', type: 'appartement', prix: 138000, surfaceBatie: 23, surfaceTerrain: null, prixM2: 6000, exclusion: null },
      { date: '2023-10-13', type: 'appartement', prix: 257000, surfaceBatie: 52, surfaceTerrain: null, prixM2: 4942, exclusion: null },
      { date: '2023-09-21', type: 'appartement', prix: 182838, surfaceBatie: 45, surfaceTerrain: null, prixM2: 4063, exclusion: null },
      { date: '2023-05-25', type: 'maison', prix: 638840, surfaceBatie: 86, surfaceTerrain: 56, prixM2: 7428, exclusion: null },
      { date: '2023-04-03', type: 'maison', prix: 720000, surfaceBatie: 80, surfaceTerrain: 39, prixM2: 9000, exclusion: null },
      { date: '2023-03-21', type: 'terrain', prix: 850000, surfaceBatie: null, surfaceTerrain: 68, prixM2: null, exclusion: 'terrain' },
      { date: '2022-06-15', type: 'appartement', prix: 287400, surfaceBatie: 80, surfaceTerrain: null, prixM2: 3593, exclusion: null },
      { date: '2022-05-02', type: 'maison', prix: 652850, surfaceBatie: 128, surfaceTerrain: 50, prixM2: 5100, exclusion: null },
      { date: '2021-11-23', type: 'appartement', prix: 127000, surfaceBatie: 20, surfaceTerrain: null, prixM2: 6350, exclusion: null },
      { date: '2021-09-02', type: 'local', prix: 1000000, surfaceBatie: 170, surfaceTerrain: null, prixM2: 5882, exclusion: 'local-professionnel' },
      { date: '2021-07-13', type: 'appartement', prix: 117000, surfaceBatie: 36, surfaceTerrain: null, prixM2: 3250, exclusion: null },
      { date: '2021-06-14', type: 'appartement', prix: 330000, surfaceBatie: 80, surfaceTerrain: null, prixM2: 4125, exclusion: null },
    ])
  })

  it('ne garde que les ventes à moins de 500 m du centre de la parcelle', async () => {
    const ventes = await loadVentes(fakeFetch(ceremaBordeaux), await parcelle('33063000KJ0033', parcelleBordeaux))

    // Le carré demandé contient aussi une maison à 503 m et un appartement à 516 m.
    expect(ventes.ventes.map(({ id }) => id)).not.toContain('e82053c80cdce800c131d79f822d1b07')
    expect(ventes.ventes.map(({ id }) => id)).not.toContain('52437a051095bfbd15829d8611b2fa2a')
    expect(Math.max(...ventes.ventes.map(({ distance }) => distance))).toBeLessThanOrEqual(500)
    expect(ventes.rayon).toBe(500)
  })

  it('écarte une mutation dont les parcelles sont loin, et exclut de la médiane la vente de plusieurs maisons', async () => {
    const fetch = fakeFetch([{ match: 'apidf-preprod.cerema.fr', body: ceremaAiguesJuntes }])

    const ventes = await loadVentes(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes))

    // L'API renvoie aussi une maison dont les deux parcelles sont à plus de 20 km.
    expect(ventes.ventes.map(({ date, type, exclusion }) => ({ date, type, exclusion }))).toEqual([
      { date: '2025-05-05', type: 'maison', exclusion: null },
      { date: '2024-12-23', type: 'terrain', exclusion: 'terrain' },
      { date: '2024-11-29', type: 'maisons', exclusion: 'vente-groupee' },
    ])
    expect(ventes.medianes).toEqual({
      maison: { prixM2: null, ventes: 1 },
      appartement: { prixM2: null, ventes: 0 },
    })
  })
})
