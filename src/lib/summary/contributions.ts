import { buildingSummary } from './building'
import { cadastreSummary } from './cadastre'
import { dpeSummary } from './dpe'
import { risksSummary } from './risks'
import type { SummaryContribution } from './summary'
import { planningSummary } from './planning'
import { salesSummary } from './sales'

/**
 * Blocks that bring facts to the summary, in the order their facts are displayed.
 * Adding a block = a `lib/summary/<block>.ts` file that exports its `contribution()`, and
 * a line here.
 */
export const CONTRIBUTIONS: readonly SummaryContribution[] = [
  cadastreSummary,
  planningSummary,
  risksSummary,
  salesSummary,
  buildingSummary,
  dpeSummary,
]
