import { loadDpe } from '@/api/ademe'
import { useParcelBlock } from './block'

export const useDpe = (idu: string) => useParcelBlock('dpe', idu, loadDpe)
