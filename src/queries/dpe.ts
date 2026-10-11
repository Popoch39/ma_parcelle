import { loadDpe } from '@/api/ademe'
import { useParcelleBloc } from './bloc'

export const useDpe = (idu: string) => useParcelleBloc('dpe', idu, loadDpe)
