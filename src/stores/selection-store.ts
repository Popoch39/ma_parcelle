import { create } from 'zustand'

interface SelectionState {
  /** IDU de la parcelle dont la fiche est ouverte. Une seule parcelle à la fois. */
  idu: string | null
  /**
   * Vrai quand la sélection ne vient pas d'un clic sur la carte (URL partagée, historique,
   * recherche) : la carte doit alors aller jusqu'à la parcelle.
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
