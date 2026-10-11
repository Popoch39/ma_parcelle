import type { BlocLoader } from '@/api/loader'

/** Niveau d'attention d'un fait de la synthèse, du plus neutre au plus pressant. */
export type NiveauAlerte = 'information' | 'vigilance' | 'alerte'

const NIVEAUX: readonly NiveauAlerte[] = ['information', 'vigilance', 'alerte']

/** Le plus pressant des niveaux, pour un fait qui en résume plusieurs. */
export function niveauLePlusPressant(niveaux: readonly NiveauAlerte[]): NiveauAlerte {
  return NIVEAUX[Math.max(0, ...niveaux.map((niveau) => NIVEAUX.indexOf(niveau)))]
}

/** Un fait de la synthèse, traduit en clair. Jamais un verdict de constructibilité. */
export interface FaitSynthese {
  /** Unique dans la synthèse, ex. « zone ». */
  id: string
  /** Ce dont on parle, ex. « Zone d'urbanisme ». */
  libelle: string
  /** Ce qu'en disent les données, en quelques mots, ex. « UG · zone urbaine ». */
  valeur: string
  niveau: NiveauAlerte
  /** Une phrase qui explique la valeur à qui ne connaît pas le jargon. */
  detail?: string
}

/**
 * Ce qu'un bloc apporte à la synthèse : de quoi charger ses données (les mêmes que sa section,
 * même clé de query, donc sans second appel) et les faits qu'on en tire.
 */
export interface ContributionSynthese {
  /** Clé du bloc, celle de sa query `useParcelleBloc(bloc, …)`. */
  bloc: string
  charger: BlocLoader<unknown>
  // En méthode, le paramètre reste bivariant : la liste des contributions accueille des blocs
  // aux données de types différents. `contribution()` garantit que `faits` ne reçoit que ce que
  // `charger` a renvoyé.
  faits(donnees: unknown): FaitSynthese[]
}

/** Déclare la contribution d'un bloc, en vérifiant que ses faits se lisent dans ce qu'il charge. */
export function contribution<Donnees>(definition: {
  bloc: string
  charger: BlocLoader<Donnees>
  faits: (donnees: Donnees) => FaitSynthese[]
}): ContributionSynthese {
  return definition
}

/** Ce que la synthèse voit d'un bloc : ses faits une fois chargé, rien tant qu'il charge ou s'il a échoué. */
export type EtatBloc = { status: 'pending' | 'error' } | { status: 'success'; data: FaitSynthese[] }

export interface Synthese {
  faits: FaitSynthese[]
  /** Vrai tant qu'un bloc charge encore : d'autres faits peuvent arriver. */
  enCours: boolean
}

/**
 * Assemble la synthèse à partir des blocs disponibles, dans l'ordre des contributions. Un bloc
 * en chargement ou en erreur n'apporte rien : la synthèse se compose de ce qui est là.
 */
export function assemblerSynthese(blocs: readonly EtatBloc[]): Synthese {
  return {
    faits: blocs.flatMap((bloc) => (bloc.status === 'success' ? bloc.data : [])),
    enCours: blocs.some(({ status }) => status === 'pending'),
  }
}
