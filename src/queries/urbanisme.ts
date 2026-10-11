import { loadUrbanisme } from '@/api/gpu'
import { useParcelleBloc } from './bloc'

/** Ce que le document d'urbanisme dit de la parcelle : bloc Urbanisme et calque de sa zone. */
export const useUrbanisme = (idu: string) => useParcelleBloc('urbanisme', idu, loadUrbanisme)
