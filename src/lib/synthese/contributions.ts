import { syntheseBatiment } from './batiment'
import { syntheseCadastre } from './cadastre'
import { syntheseDpe } from './dpe'
import type { ContributionSynthese } from './synthese'
import { syntheseUrbanisme } from './urbanisme'

/**
 * Blocs qui apportent des faits à la synthèse, dans l'ordre où leurs faits s'affichent.
 * Ajouter un bloc = un fichier `lib/synthese/<bloc>.ts` qui exporte sa `contribution()`, et
 * une ligne ici.
 */
export const CONTRIBUTIONS: readonly ContributionSynthese[] = [
  syntheseCadastre,
  syntheseUrbanisme,
  syntheseBatiment,
  syntheseDpe,
]
