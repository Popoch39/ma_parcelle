import { loadBatiment } from '@/api/batiment'
import { useParcelleBloc } from './bloc'

export const useBatiment = (idu: string) => useParcelleBloc('batiment', idu, loadBatiment)
