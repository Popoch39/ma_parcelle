import { loadRisks } from '@/api/georisques'
import { useParcelBlock } from './block'

/** What Géorisques says about the parcel's location and its municipality: Risks block. */
export const useRisks = (idu: string) => useParcelBlock('risks', idu, loadRisks)
