import { Disclaimer } from '@/components/common/Disclaimer'
import { BLOCS } from './blocs'
import { Synthese } from './synthese/Synthese'

/** Contenu de la fiche d'une parcelle, indépendant de son contenant (panneau ou bottom sheet). */
export function Fiche({ idu }: { idu: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Synthese idu={idu} />
      <Disclaimer />
      {BLOCS.map(({ id, Section }) => (
        <Section key={id} idu={idu} />
      ))}
    </div>
  )
}
