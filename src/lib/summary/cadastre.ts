import type { Parcel } from '@/api/cadastre'
import { contribution } from './summary'

const integer = new Intl.NumberFormat('fr-FR')

/** Facts of the Cadastre block: the parcel's area. */
export const cadastreSummary = contribution({
  block: 'cadastre',
  // The parcel is already loaded for every block: the Cadastre has nothing else to request.
  load: async (_fetch, parcel: Parcel) => parcel,
  facts: (parcel) => [
    { id: 'area', label: 'Surface', value: `${integer.format(parcel.area)} m²`, level: 'info' },
  ],
})
