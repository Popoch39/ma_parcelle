/**
 * Calques que l'utilisateur peut afficher au-dessus du fond, dans l'ordre du contrôle des
 * calques. Un calque activable = une ligne ici, et son composant monté dans `MapLayers`.
 */
export const CALQUES = [{ id: 'zonage', label: 'Zonage d’urbanisme' }] as const

export type Calque = (typeof CALQUES)[number]['id']
