import { UrbanismeNotice } from './UrbanismeNotice'

/** Avis qui accompagne un secteur de carte communale : ce document n'a pas de règlement écrit. */
export function CarteCommunaleNotice() {
  return (
    <UrbanismeNotice title="Carte communale">
      Une carte communale délimite seulement les secteurs où l’on peut construire. Elle n’a pas de
      règlement écrit : pour le reste, ce sont les règles générales du code de l’urbanisme (RNU) qui
      s’appliquent.
    </UrbanismeNotice>
  )
}
