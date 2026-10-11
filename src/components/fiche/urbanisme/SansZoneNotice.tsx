import { UrbanismeNotice } from './UrbanismeNotice'

/** Avis d'une parcelle dont la zone n'est pas publiée, typiquement dans un secteur sauvegardé. */
export function SansZoneNotice() {
  return (
    <UrbanismeNotice title="Aucune zone publiée à cet endroit">
      Le Géoportail de l’urbanisme ne publie aucune zone pour cette parcelle. C’est le cas des
      secteurs sauvegardés, dont le plan de sauvegarde et de mise en valeur (PSMV) n’est souvent pas
      mis en ligne, ou d’un document en cours de publication. La mairie peut indiquer les règles qui
      s’y appliquent.
    </UrbanismeNotice>
  )
}
