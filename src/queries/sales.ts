import { loadSales } from '@/api/sales'
import { useParcelBlock } from './block'

/** Sales in the parcel's neighborhood and their median price per sqm: Sales block. */
export const useSales = (idu: string) => useParcelBlock('sales', idu, loadSales)
