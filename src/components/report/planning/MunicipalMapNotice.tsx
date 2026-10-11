import { PlanningNotice } from './PlanningNotice'

/** Notice accompanying a municipal map sector: this document has no written rules. */
export function MunicipalMapNotice() {
  return (
    <PlanningNotice title="Carte communale">
      Une carte communale délimite seulement les secteurs où l’on peut construire. Elle n’a pas de
      règlement écrit : pour le reste, ce sont les règles générales du code de l’urbanisme (RNU) qui
      s’appliquent.
    </PlanningNotice>
  )
}
