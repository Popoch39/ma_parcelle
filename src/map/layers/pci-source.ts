import type { SourceSpecification } from 'maplibre-gl'

/** Tuiles vectorielles du plan cadastral (PCI) de l'IGN, partagées par les calques Parcelles et Sélection. */
export const PCI_SOURCE_ID = 'pci'

/** Couche des tuiles qui porte les parcelles et leurs attributs (`idu`, `section`, `contenance`…). */
export const PCI_PARCELLE = 'parcelle'

/** Couche la plus basse du calque Parcelles : une surcouche qui doit rester sous les parcelles se pose sous elle. */
export const PARCELLES_HIT_LAYER = 'parcelles-clic'

export const PCI_SOURCES: Record<string, SourceSpecification> = {
  [PCI_SOURCE_ID]: {
    type: 'vector',
    tiles: ['https://data.geopf.fr/tms/1.0.0/PCI/{z}/{x}/{y}.pbf'],
    // Les parcelles n'existent qu'à partir du zoom 15, et le serveur répond 404 au-delà de 19.
    minzoom: 15,
    maxzoom: 19,
    // Les objets des tuiles n'ont pas d'identifiant : l'IDU en tient lieu.
    promoteId: { [PCI_PARCELLE]: 'idu' },
    attribution: '© IGN – Plan cadastral',
  },
}
