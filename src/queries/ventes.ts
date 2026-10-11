import { loadVentes } from '@/api/ventes'
import { useParcelleBloc } from './bloc'

/** Les ventes du voisinage de la parcelle et leur prix médian au m² : bloc Ventes. */
export const useVentes = (idu: string) => useParcelleBloc('ventes', idu, loadVentes)
