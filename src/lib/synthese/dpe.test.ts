import { describe, expect, it } from 'vitest'
import { loadParcelle } from '@/api/cadastre'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import aucunDpe from '@/api/__fixtures__/ademe/aucun-dpe.json'
import bboxKj44 from '@/api/__fixtures__/ademe/bbox-bordeaux-33063-kj-44.json'
import bboxKm239 from '@/api/__fixtures__/ademe/bbox-bordeaux-33063-km-239.json'
import voisinageAiguesJuntes from '@/api/__fixtures__/ademe/voisinage-aigues-juntes-09001-zc-148.json'
import voisinageBordeauxPage1 from '@/api/__fixtures__/ademe/voisinage-bordeaux-33063-kj-33-page-1.json'
import voisinageBordeauxPage2 from '@/api/__fixtures__/ademe/voisinage-bordeaux-33063-kj-33-page-2.json'
import voisinageBordeauxPage3 from '@/api/__fixtures__/ademe/voisinage-bordeaux-33063-kj-33-page-3.json'
import parcelleAiguesJuntes from '@/api/__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelleBordeaux from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelleKj44 from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-kj-44.json'
import parcelleKm239 from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-km-239.json'
import { syntheseDpe } from './dpe'

/** Faits DPE de la synthèse d'une parcelle, le bloc chargé par son chargeur comme dans la fiche. */
async function faitsDpe(idu: string, parcelle: unknown, routes: FakeRoute[]) {
  const fetch = fakeFetch([{ match: 'cadastre/parcelle', body: parcelle }, ...routes])
  return syntheseDpe.faits(await syntheseDpe.charger(fetch, await loadParcelle(fetch, idu)))
}

describe('synthèse : faits du bloc DPE', () => {
  it('donne la répartition des étiquettes de la parcelle, en vigilance quand des logements sont classés F ou G', async () => {
    const faits = await faitsDpe('33063000KJ0044', parcelleKj44, [{ match: 'lines?bbox=', body: bboxKj44 }])

    expect(faits).toEqual([
      {
        id: 'dpe',
        libelle: 'DPE des logements',
        valeur: '10 DPE : 1 C, 4 D, 3 E, 1 F, 1 G',
        niveau: 'vigilance',
        detail:
          '2 logements classés F ou G : leur location est progressivement interdite (G depuis 2025, F à partir de 2028).',
      },
    ])
  })

  it('reste une information quand aucun logement de la parcelle n’est classé F ou G', async () => {
    const faits = await faitsDpe('33063000KM0239', parcelleKm239, [{ match: 'lines?bbox=', body: bboxKm239 }])

    expect(faits).toEqual([{ id: 'dpe', libelle: 'DPE des logements', valeur: '2 DPE : 1 D, 1 E', niveau: 'information' }])
  })

  it('présente les DPE à moins de 100 m comme ceux du voisinage, sans en tirer d’alerte pour la parcelle', async () => {
    const faits = await faitsDpe('09001000ZC0148', parcelleAiguesJuntes, [
      { match: 'lines?bbox=', body: aucunDpe },
      { match: 'lines?geo_distance=', body: voisinageAiguesJuntes },
    ])

    expect(faits).toEqual([
      {
        id: 'dpe',
        libelle: 'DPE du voisinage (moins de 100 m)',
        valeur: '3 DPE : 1 C, 1 F, 1 G',
        niveau: 'information',
        detail: 'Aucun DPE n’est localisé sur la parcelle : ce sont ceux des logements voisins.',
      },
    ])
  })

  it('dit quand le voisinage compte plus de DPE que ceux retenus', async () => {
    const faits = await faitsDpe('33063000KJ0033', parcelleBordeaux, [
      { match: 'lines?bbox=', body: aucunDpe },
      { match: 'after=52.29016186365669', body: voisinageBordeauxPage2 },
      { match: 'after=70.73690557292974', body: voisinageBordeauxPage3 },
      { match: 'lines?geo_distance=', body: voisinageBordeauxPage1 },
    ])

    expect(faits[0].detail).toBe(
      'Aucun DPE n’est localisé sur la parcelle : ce sont ceux des logements voisins, les 7 plus proches sur 377.',
    )
  })

  it('ne dit rien quand ni la parcelle ni son voisinage n’ont de DPE', async () => {
    const faits = await faitsDpe('33063000KJ0044', parcelleKj44, [{ match: 'dpe03existant/lines?', body: aucunDpe }])

    expect(faits).toEqual([])
  })
})
