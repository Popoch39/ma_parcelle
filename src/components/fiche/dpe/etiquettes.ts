import type { Etiquette } from '@/api/ademe'

export type TypeEtiquette = 'energie' | 'climat'

/**
 * Couleurs réglementaires des étiquettes du DPE (modèle de 2021) : énergie du vert au rouge,
 * climat du bleu clair au violet sombre. Elles ne changent pas avec le thème ; la couleur du
 * texte posé dessus est choisie pour un contraste ≥ 4,5:1 sur chacune.
 */
export const COULEURS_ETIQUETTE: Record<TypeEtiquette, Record<Etiquette, { fond: string; texte: string }>> = {
  energie: {
    A: { fond: '#00a06d', texte: 'text-black' },
    B: { fond: '#52b153', texte: 'text-black' },
    C: { fond: '#a5cc74', texte: 'text-black' },
    D: { fond: '#f4e70f', texte: 'text-black' },
    E: { fond: '#f0b40f', texte: 'text-black' },
    F: { fond: '#eb8235', texte: 'text-black' },
    G: { fond: '#d7221f', texte: 'text-white' },
  },
  climat: {
    A: { fond: '#a4dbf8', texte: 'text-black' },
    B: { fond: '#8cb4d3', texte: 'text-black' },
    C: { fond: '#7792b1', texte: 'text-black' },
    D: { fond: '#606f8f', texte: 'text-white' },
    E: { fond: '#4d5271', texte: 'text-white' },
    F: { fond: '#393551', texte: 'text-white' },
    G: { fond: '#281b35', texte: 'text-white' },
  },
}

export const NOM_ETIQUETTE: Record<TypeEtiquette, string> = { energie: 'énergie', climat: 'climat' }
