import { UrbanismeNotice } from './UrbanismeNotice'

/** Avis d'une commune au règlement national d'urbanisme, qui n'a donc ni zone ni règlement propre. */
export function RnuNotice() {
  return (
    <UrbanismeNotice title="Règlement national d’urbanisme (RNU)">
      La commune n’a ni plan local d’urbanisme ni carte communale : ce sont les règles générales du
      code de l’urbanisme qui s’appliquent. En dehors des parties déjà urbanisées de la commune, les
      constructions nouvelles y sont en principe interdites, sauf exceptions prévues par la loi.
    </UrbanismeNotice>
  )
}
