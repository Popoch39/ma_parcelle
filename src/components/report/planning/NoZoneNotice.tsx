import { PlanningNotice } from './PlanningNotice'

/** Notice for a parcel whose zone is not published, typically in a safeguarded sector. */
export function NoZoneNotice() {
  return (
    <PlanningNotice title="Aucune zone publiée à cet endroit">
      Le Géoportail de l’urbanisme ne publie aucune zone pour cette parcelle. C’est le cas des
      secteurs sauvegardés, dont le plan de sauvegarde et de mise en valeur (PSMV) n’est souvent pas
      mis en ligne, ou d’un document en cours de publication. La mairie peut indiquer les règles qui
      s’y appliquent.
    </PlanningNotice>
  )
}
