import { create } from 'zustand'

interface SelectionState {
  /** IDU of the parcel whose report is open. One parcel at a time. */
  idu: string | null
  /**
   * True when the selection does not come from a click on the map (shared URL, history,
   * search): the map must then go to the parcel.
   */
  reframe: boolean
  select: (idu: string, options?: { reframe?: boolean }) => void
  clear: () => void
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  idu: null,
  reframe: false,
  select: (idu, { reframe = false } = {}) => set({ idu, reframe }),
  clear: () => set({ idu: null, reframe: false }),
}))
