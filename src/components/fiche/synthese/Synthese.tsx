import { Section } from '@/components/common/Section'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'
import { useSynthese } from '@/queries/synthese'
import { SyntheseFact } from './SyntheseFact'

/**
 * Synthèse en tête de fiche : les faits essentiels des blocs déjà chargés. Un bloc en erreur
 * n'y figure pas ; sa section, plus bas, dit pourquoi.
 */
export function Synthese({ idu }: { idu: string }) {
  const { faits, enCours } = useSynthese(idu)
  return (
    <Section title="Synthèse">
      {faits.length > 0 && (
        <dl>
          {faits.map((fait) => (
            <SyntheseFact key={fait.id} fait={fait} />
          ))}
        </dl>
      )}
      {enCours ? (
        <div className={faits.length > 0 ? 'mt-3' : undefined}>
          <SectionSkeleton rows={faits.length > 0 ? 1 : 3} />
        </div>
      ) : (
        faits.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun fait à résumer : voir le détail des blocs ci-dessous.</p>
        )
      )}
    </Section>
  )
}
