import { lazy, Suspense } from 'react'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'

// Les blocs ne servent qu'une fois une parcelle choisie : hors du chargement initial de la carte.
// Un seul `lazy` pour le panneau et l'impression : une fois chargée, la fiche s'imprime sans attendre.
const Fiche = lazy(() => import('./Fiche').then(({ Fiche }) => ({ default: Fiche })))

/** La fiche d'une parcelle, dont le code se charge à la première sélection. */
export function FicheDifferee({ idu }: { idu: string }) {
  return (
    <Suspense fallback={<SectionSkeleton rows={8} />}>
      <Fiche idu={idu} />
    </Suspense>
  )
}
