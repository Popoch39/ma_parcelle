import { loadPlanning } from '@/api/gpu'
import { useParcelBlock } from './block'

/** What the planning document says about the parcel: Planning block and its zone's overlay. */
export const usePlanning = (idu: string) => useParcelBlock('planning', idu, loadPlanning)
