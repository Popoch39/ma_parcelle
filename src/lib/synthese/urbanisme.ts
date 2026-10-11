import { loadUrbanisme, type PerimetreAbf, type Reglementation, type Zone } from '@/api/gpu'
import { contribution, niveauLePlusPressant, type FaitSynthese, type NiveauAlerte } from './synthese'

/** Faits du bloc Urbanisme : la zone de la parcelle expliquée, et le périmètre ABF le cas échéant. */
export const syntheseUrbanisme = contribution({
  bloc: 'urbanisme',
  charger: loadUrbanisme,
  faits: ({ reglementation, perimetreAbf }) => [
    faitZone(reglementation),
    ...(perimetreAbf ? [faitPerimetreAbf(perimetreAbf)] : []),
  ],
})

interface Lecture {
  niveau: NiveauAlerte
  explication?: string
}

// Ce que chaque type de zone (PLU) ou de secteur (carte communale) implique, sans jamais dire si
// la parcelle est constructible : seul un certificat d'urbanisme le dit.
const URBAINE: Lecture = {
  niveau: 'information',
  explication: 'Zone urbaine : secteur déjà urbanisé et équipé, dont le règlement fixe ce qui peut y être bâti et comment.',
}
const AGRICOLE: Lecture = {
  niveau: 'alerte',
  explication: 'Zone agricole : secteur protégé pour l’agriculture, où les constructions sont strictement encadrées.',
}
const NATURELLE: Lecture = {
  niveau: 'alerte',
  explication:
    'Zone naturelle : secteur protégé pour ses milieux ou ses paysages, où les constructions sont strictement encadrées.',
}

// Mêmes nomenclatures CNIG que `FAMILLES_ZONE` et `FAMILLES_SECTEUR` du chargeur.
const LECTURES: Record<string, Lecture> = {
  U: URBAINE,
  AUc: {
    niveau: 'vigilance',
    explication:
      'Zone à urbaniser : secteur appelé à s’urbaniser, en général sous des conditions d’équipement ou de projet d’ensemble fixées par le règlement.',
  },
  AUs: {
    niveau: 'vigilance',
    explication:
      'Zone à urbaniser à long terme : réserve pour une urbanisation future, qui suppose en général de faire évoluer le PLU.',
  },
  A: AGRICOLE,
  Ah: AGRICOLE,
  N: NATURELLE,
  Nh: NATURELLE,
  Nd: NATURELLE,
  '01': {
    niveau: 'information',
    explication:
      'Secteur de carte communale où les constructions sont admises, selon les règles générales du code de l’urbanisme.',
  },
  '02': {
    niveau: 'information',
    explication: 'Secteur de carte communale réservé aux activités, notamment celles qui ne se mêlent pas à l’habitat.',
  },
  '03': {
    niveau: 'alerte',
    explication: 'Secteur de carte communale où les constructions ne sont admises qu’à titre exceptionnel.',
  },
}

// Type hors nomenclature : on montre la zone sans l'interpréter.
const SANS_LECTURE: Lecture = { niveau: 'information' }

function faitZone(reglementation: Reglementation): FaitSynthese {
  const fait = { id: 'zone', libelle: 'Zone d’urbanisme' }
  switch (reglementation.regime) {
    case 'sans-zone':
      return {
        ...fait,
        valeur: 'Aucune zone publiée',
        niveau: 'vigilance',
        detail:
          'Souvent un secteur sauvegardé dont le plan n’est pas en ligne : la mairie indique les règles qui s’y appliquent.',
      }
    case 'rnu':
      return {
        ...fait,
        valeur: 'Règlement national d’urbanisme',
        niveau: 'vigilance',
        detail:
          'La commune n’a ni PLU ni carte communale : les règles générales du code de l’urbanisme s’appliquent, et limitent les constructions nouvelles hors des parties déjà urbanisées.',
      }
    case 'document': {
      // Zones triées de la plus étendue à la moins étendue : la première donne la valeur, mais
      // la part, même petite, d'une zone plus contraignante donne le niveau.
      const [principale, ...autres] = reglementation.zones
      const detail = [lectureDe(principale).explication, ...autres.map(partEn)].filter(Boolean).join(' ')
      return {
        ...fait,
        valeur: nomDe(principale),
        niveau: niveauLePlusPressant(reglementation.zones.map((zone) => lectureDe(zone).niveau)),
        ...(detail && { detail }),
      }
    }
  }
}

const pourcentage = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 })

function lectureDe({ type }: Zone): Lecture {
  return LECTURES[type] ?? SANS_LECTURE
}

function nomDe({ code, libelle }: Zone): string {
  return libelle ? `${code} · ${libelle}` : code
}

function partEn(zone: Zone): string {
  return `${pourcentage.format(zone.part)} de la parcelle est en ${nomDe(zone)}${zone.famille ? ` (${zone.famille})` : ''}.`
}

function faitPerimetreAbf({ monuments }: PerimetreAbf): FaitSynthese {
  return {
    id: 'perimetre-abf',
    libelle: 'Périmètre ABF',
    valeur: abordsDe(monuments),
    niveau: 'vigilance',
    detail: 'Les travaux visibles depuis l’espace public y sont soumis à l’avis de l’architecte des bâtiments de France.',
  }
}

function abordsDe(monuments: string[]): string {
  if (monuments.length === 0) return 'Abords d’un monument historique'
  if (monuments.length === 1) return `Abords de « ${monuments[0]} »`
  return `Abords de ${monuments.length} monuments historiques`
}
