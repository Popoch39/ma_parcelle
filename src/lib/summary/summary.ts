import type { BlockLoader } from '@/api/loader'
import type { BlockId } from '@/components/report/blocks'

/** Attention level of a summary fact, from most neutral to most urgent. */
export type AlertLevel = 'info' | 'caution' | 'alert'

const LEVELS: readonly AlertLevel[] = ['info', 'caution', 'alert']

/** The most urgent of the levels, for a fact that sums up several. */
export function mostUrgentLevel(levels: readonly AlertLevel[]): AlertLevel {
  return LEVELS[Math.max(0, ...levels.map((level) => LEVELS.indexOf(level)))]
}

/** A summary fact, put into plain words. Never a buildability verdict. */
export interface SummaryFact {
  /** Unique within the summary, e.g. « zone ». */
  id: string
  /** What it is about, e.g. « Zone d'urbanisme ». */
  label: string
  /** What the data says about it, in a few words, e.g. « UG · zone urbaine ». */
  value: string
  level: AlertLevel
  /** A sentence that explains the value to someone who does not know the jargon. */
  detail?: string
}

/**
 * What a block brings to the summary: how to load its data (the same as its section,
 * same query key, hence no second call) and the facts drawn from it.
 */
export interface SummaryContribution {
  /** Key of the block, that of its query `useParcelBlock(block, …)`. */
  block: BlockId
  load: BlockLoader<unknown>
  // As a method, the parameter stays bivariant: the list of contributions accepts blocks
  // with data of different types. `contribution()` guarantees that `facts` only receives what
  // `load` returned.
  facts(data: unknown): SummaryFact[]
}

/** Declares a block's contribution, checking that its facts are read from what it loads. */
export function contribution<Data>(definition: {
  block: BlockId
  load: BlockLoader<Data>
  facts: (data: Data) => SummaryFact[]
}): SummaryContribution {
  return definition
}

/** What the summary sees of a block: its facts once loaded, nothing while it loads or if it failed. */
export type BlockState = { status: 'pending' | 'error' } | { status: 'success'; data: SummaryFact[] }

export interface Summary {
  facts: SummaryFact[]
  /** True while a block is still loading: more facts may arrive. */
  loading: boolean
}

/**
 * Assembles the summary from the available blocks, in the order of the contributions. A block
 * loading or in error brings nothing: the summary is made of what is there.
 */
export function assembleSummary(blocks: readonly BlockState[]): Summary {
  return {
    facts: blocks.flatMap((block) => (block.status === 'success' ? block.data : [])),
    loading: blocks.some(({ status }) => status === 'pending'),
  }
}
