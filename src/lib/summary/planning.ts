import { loadPlanning, type AbfPerimeter, type Regulation, type Zone } from '@/api/gpu'
import { contribution, mostUrgentLevel, type SummaryFact, type AlertLevel } from './summary'

/** Facts of the Planning block: the parcel's zone explained, and the ABF perimeter if any. */
export const planningSummary = contribution({
  block: 'planning',
  load: loadPlanning,
  facts: ({ regulation, abfPerimeter }) => [
    zoneFact(regulation),
    ...(abfPerimeter ? [abfPerimeterFact(abfPerimeter)] : []),
  ],
})

interface Reading {
  level: AlertLevel
  explanation?: string
}

// What each zone type (PLU) or sector type (municipal map) implies, without ever saying whether
// the parcel is buildable: only a planning certificate says so.
const URBAN: Reading = {
  level: 'info',
  explanation: 'Zone urbaine : secteur déjà urbanisé et équipé, dont le règlement fixe ce qui peut y être bâti et comment.',
}
const AGRICULTURAL: Reading = {
  level: 'alert',
  explanation: 'Zone agricole : secteur protégé pour l’agriculture, où les constructions sont strictement encadrées.',
}
const NATURAL: Reading = {
  level: 'alert',
  explanation:
    'Zone naturelle : secteur protégé pour ses milieux ou ses paysages, où les constructions sont strictement encadrées.',
}

// Same CNIG nomenclatures as the loader's `ZONE_FAMILIES` and `SECTOR_FAMILIES`.
const READINGS: Record<string, Reading> = {
  U: URBAN,
  AUc: {
    level: 'caution',
    explanation:
      'Zone à urbaniser : secteur appelé à s’urbaniser, en général sous des conditions d’équipement ou de projet d’ensemble fixées par le règlement.',
  },
  AUs: {
    level: 'caution',
    explanation:
      'Zone à urbaniser à long terme : réserve pour une urbanisation future, qui suppose en général de faire évoluer le PLU.',
  },
  A: AGRICULTURAL,
  Ah: AGRICULTURAL,
  N: NATURAL,
  Nh: NATURAL,
  Nd: NATURAL,
  '01': {
    level: 'info',
    explanation:
      'Secteur de carte communale où les constructions sont admises, selon les règles générales du code de l’urbanisme.',
  },
  '02': {
    level: 'info',
    explanation: 'Secteur de carte communale réservé aux activités, notamment celles qui ne se mêlent pas à l’habitat.',
  },
  '03': {
    level: 'alert',
    explanation: 'Secteur de carte communale où les constructions ne sont admises qu’à titre exceptionnel.',
  },
}

// Type outside the nomenclature: the zone is shown without interpreting it.
const NO_READING: Reading = { level: 'info' }

function zoneFact(regulation: Regulation): SummaryFact {
  const fact = { id: 'zone', label: 'Zone d’urbanisme' }
  switch (regulation.regime) {
    case 'no-zone':
      return {
        ...fact,
        value: 'Aucune zone publiée',
        level: 'caution',
        detail:
          'Souvent un secteur sauvegardé dont le plan n’est pas en ligne : la mairie indique les règles qui s’y appliquent.',
      }
    case 'rnu':
      return {
        ...fact,
        value: 'Règlement national d’urbanisme',
        level: 'caution',
        detail:
          'La commune n’a ni PLU ni carte communale : les règles générales du code de l’urbanisme s’appliquent, et limitent les constructions nouvelles hors des parties déjà urbanisées.',
      }
    case 'document': {
      // Zones sorted from largest to smallest: the first gives the value, but the share, even
      // small, of a more restrictive zone gives the level.
      const [main, ...others] = regulation.zones
      const detail = [readingOf(main).explanation, ...others.map(shareIn)].filter(Boolean).join(' ')
      return {
        ...fact,
        value: nameOf(main),
        level: mostUrgentLevel(regulation.zones.map((zone) => readingOf(zone).level)),
        ...(detail && { detail }),
      }
    }
  }
}

const percent = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 })

function readingOf({ type }: Zone): Reading {
  return READINGS[type] ?? NO_READING
}

function nameOf({ code, label }: Zone): string {
  return label ? `${code} · ${label}` : code
}

function shareIn(zone: Zone): string {
  return `${percent.format(zone.share)} de la parcelle est en ${nameOf(zone)}${zone.family ? ` (${zone.family})` : ''}.`
}

function abfPerimeterFact({ monuments }: AbfPerimeter): SummaryFact {
  return {
    id: 'abf-perimeter',
    label: 'Périmètre ABF',
    value: surroundingsOf(monuments),
    level: 'caution',
    detail: 'Les travaux visibles depuis l’espace public y sont soumis à l’avis de l’architecte des bâtiments de France.',
  }
}

function surroundingsOf(monuments: string[]): string {
  if (monuments.length === 0) return 'Abords d’un monument historique'
  if (monuments.length === 1) return `Abords de « ${monuments[0]} »`
  return `Abords de ${monuments.length} monuments historiques`
}
