import { loadBuilding } from '@/api/building'
import { useParcelBlock } from './block'

export const useBuilding = (idu: string) => useParcelBlock('building', idu, loadBuilding)
