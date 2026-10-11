import { BLOCS } from './blocs'

/** Contenu de la fiche d'une parcelle, indépendant de son contenant (panneau ou bottom sheet). */
export function Fiche({ idu }: { idu: string }) {
  return (
    <div className="flex flex-col gap-3">
      {BLOCS.map(({ id, Section }) => (
        <Section key={id} idu={idu} />
      ))}
    </div>
  )
}
