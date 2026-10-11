/** Hauteurs auxquelles le bottom sheet de la fiche se pose, de la plus basse à la plus haute. */
export const CRANS = ['apercu', 'mi-ecran', 'plein-ecran'] as const

export type Cran = (typeof CRANS)[number]

interface Relachement {
  /** Hauteur de chaque cran, en px. */
  hauteurs: Record<Cran, number>
  /** Hauteur du panneau au moment où le doigt le lâche, en px. */
  hauteur: number
  /** Vitesse du doigt au relâchement, en px/ms, positive vers le haut. */
  vitesse: number
}

/** Cran immédiatement au-dessus ou au-dessous, le cran extrême restant en place. */
export function cranVoisin(cran: Cran, sens: 'haut' | 'bas'): Cran {
  const index = CRANS.indexOf(cran) + (sens === 'haut' ? 1 : -1)
  return CRANS[Math.min(Math.max(index, 0), CRANS.length - 1)]
}

// Au-delà, le geste est un lancer : on suit son intention plutôt que la position atteinte,
// sinon un petit coup sec ne ferait que revenir au cran de départ.
const VITESSE_DE_LANCER = 0.5

/** Cran sur lequel le panneau se pose quand on le lâche après l'avoir fait glisser. */
export function cranAuRelachement({ hauteurs, hauteur, vitesse }: Relachement): Cran {
  if (vitesse >= VITESSE_DE_LANCER) {
    return CRANS.find((cran) => hauteurs[cran] > hauteur) ?? CRANS[CRANS.length - 1]
  }
  if (vitesse <= -VITESSE_DE_LANCER) {
    return CRANS.findLast((cran) => hauteurs[cran] < hauteur) ?? CRANS[0]
  }
  const distance = (cran: Cran) => Math.abs(hauteurs[cran] - hauteur)
  return CRANS.reduce((proche, cran) => (distance(cran) < distance(proche) ? cran : proche))
}
