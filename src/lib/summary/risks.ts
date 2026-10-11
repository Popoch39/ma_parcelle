import { loadRisks } from '@/api/georisques'
import { contribution } from './summary'

/**
 * Facts of the Risks block: only risks at alert level rise to the top of the report (clay with
 * high exposure, cavity or polluted soil very close, upper-tier Seveso site…); those at caution
 * level stay in the block, so as not to drown the summary.
 */
export const risksSummary = contribution({
  block: 'risks',
  load: loadRisks,
  facts: ({ risks }) =>
    risks.flatMap((risk) =>
      risk.available && risk.level === 'alert'
        ? [
            {
              id: `risk-${risk.id}`,
              label: risk.label,
              value: risk.value,
              level: risk.level,
              ...(risk.detail && { detail: risk.detail }),
            },
          ]
        : [],
    ),
})
