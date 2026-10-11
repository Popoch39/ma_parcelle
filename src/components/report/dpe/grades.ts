import type { Grade } from '@/api/ademe'

export type GradeType = 'energy' | 'climate'

/**
 * Regulatory colors of the DPE grades (2021 model): energy from green to red, climate from
 * light blue to dark purple. They do not change with the theme; the color of the text laid on
 * them is chosen for a contrast ≥ 4.5:1 on each one.
 */
export const GRADE_COLORS: Record<GradeType, Record<Grade, { background: string; text: string }>> = {
  energy: {
    A: { background: '#00a06d', text: 'text-black' },
    B: { background: '#52b153', text: 'text-black' },
    C: { background: '#a5cc74', text: 'text-black' },
    D: { background: '#f4e70f', text: 'text-black' },
    E: { background: '#f0b40f', text: 'text-black' },
    F: { background: '#eb8235', text: 'text-black' },
    G: { background: '#d7221f', text: 'text-white' },
  },
  climate: {
    A: { background: '#a4dbf8', text: 'text-black' },
    B: { background: '#8cb4d3', text: 'text-black' },
    C: { background: '#7792b1', text: 'text-black' },
    D: { background: '#606f8f', text: 'text-white' },
    E: { background: '#4d5271', text: 'text-white' },
    F: { background: '#393551', text: 'text-white' },
    G: { background: '#281b35', text: 'text-white' },
  },
}

export const GRADE_NAMES: Record<GradeType, string> = { energy: 'énergie', climate: 'climat' }
