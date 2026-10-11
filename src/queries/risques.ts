import { loadRisques } from '@/api/georisques'
import { useParcelleBloc } from './bloc'

/** Ce que Géorisques dit de l'emplacement de la parcelle et de sa commune : bloc Risques. */
export const useRisques = (idu: string) => useParcelleBloc('risques', idu, loadRisques)
