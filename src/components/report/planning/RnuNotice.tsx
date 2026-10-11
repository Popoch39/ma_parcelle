import { PlanningNotice } from './PlanningNotice'

/** Notice for a municipality under the national planning regulation, which thus has no zone nor rules of its own. */
export function RnuNotice() {
  return (
    <PlanningNotice title="Règlement national d’urbanisme (RNU)">
      La commune n’a ni plan local d’urbanisme ni carte communale : ce sont les règles générales du
      code de l’urbanisme qui s’appliquent. En dehors des parties déjà urbanisées de la commune, les
      constructions nouvelles y sont en principe interdites, sauf exceptions prévues par la loi.
    </PlanningNotice>
  )
}
