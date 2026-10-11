import { loadRisques } from '@/api/georisques'
import { contribution } from './synthese'

/**
 * Faits du bloc Risques : seuls les risques en alerte remontent en tête de fiche (argiles en
 * exposition forte, cavité ou sol pollué tout proche, établissement Seveso seuil haut…) ; ceux
 * en vigilance restent dans le bloc, pour ne pas noyer la synthèse.
 */
export const syntheseRisques = contribution({
  bloc: 'risques',
  charger: loadRisques,
  faits: ({ risques }) =>
    risques.flatMap((risque) =>
      risque.disponible && risque.niveau === 'alerte'
        ? [
            {
              id: `risque-${risque.id}`,
              libelle: risque.libelle,
              valeur: risque.valeur,
              niveau: risque.niveau,
              ...(risque.detail && { detail: risque.detail }),
            },
          ]
        : [],
    ),
})
