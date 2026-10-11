import { Section } from '@/components/common/Section'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'
import { useSummary } from '@/queries/summary'
import { SummaryFactItem } from './SummaryFactItem'

/**
 * Summary at the top of the report: the key facts of the blocks already loaded. A block in error
 * does not appear in it; its section, further down, says why.
 */
export function ReportSummary({ idu }: { idu: string }) {
  const { facts, loading } = useSummary(idu)
  return (
    <Section title="Synthèse">
      {facts.length > 0 && (
        <dl>
          {facts.map((fact) => (
            <SummaryFactItem key={fact.id} fact={fact} />
          ))}
        </dl>
      )}
      {loading ? (
        <div className={facts.length > 0 ? 'mt-3' : undefined}>
          <SectionSkeleton rows={facts.length > 0 ? 1 : 3} />
        </div>
      ) : (
        facts.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun fait à résumer : voir le détail des blocs ci-dessous.</p>
        )
      )}
    </Section>
  )
}
