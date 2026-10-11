import { loadDpe, RAYON_VOISINAGE, type DpeBloc } from '@/api/ademe'
import { contribution, type FaitSynthese } from './synthese'

/** Faits du bloc DPE : la répartition des étiquettes énergie des logements. */
export const syntheseDpe = contribution({
  bloc: 'dpe',
  charger: loadDpe,
  faits: (bloc) => {
    // Aucun DPE ne prouve rien : le jeu de l'ADEME ne couvre que les DPE depuis juillet 2021.
    if (bloc.dpe.length === 0) return []
    return [bloc.portee === 'parcelle' ? faitParcelle(bloc) : faitVoisinage(bloc)]
  },
})

// Les logements voisins ne disent rien de ceux de la parcelle : jamais d'alerte, et le libellé
// le dit.
function faitVoisinage(bloc: DpeBloc): FaitSynthese {
  const plusProches = bloc.limite?.total ? `, les ${bloc.limite.lues} plus proches sur ${bloc.limite.total}` : ''
  return {
    id: 'dpe',
    libelle: `DPE du voisinage (moins de ${RAYON_VOISINAGE} m)`,
    valeur: repartitionDe(bloc),
    niveau: 'information',
    detail: `Aucun DPE n’est localisé sur la parcelle : ce sont ceux des logements voisins${plusProches}.`,
  }
}

function faitParcelle(bloc: DpeBloc): FaitSynthese {
  const passoires = bloc.repartition
    .filter(({ etiquette }) => etiquette === 'F' || etiquette === 'G')
    .reduce((total, { nombre }) => total + nombre, 0)
  return {
    id: 'dpe',
    libelle: 'DPE des logements',
    valeur: repartitionDe(bloc),
    niveau: passoires > 0 ? 'vigilance' : 'information',
    ...(passoires > 0 && {
      detail: `${passoires === 1 ? '1 logement classé' : `${passoires} logements classés`} F ou G : ${passoires === 1 ? 'sa' : 'leur'} location est progressivement interdite (G depuis 2025, F à partir de 2028).`,
    }),
  }
}

/** « 10 DPE : 1 C, 4 D, 3 E, 1 F, 1 G ». */
function repartitionDe({ dpe, repartition }: DpeBloc): string {
  const etiquettes = repartition.filter(({ nombre }) => nombre > 0).map(({ etiquette, nombre }) => `${nombre} ${etiquette}`)
  return `${dpe.length} DPE : ${etiquettes.join(', ')}`
}
