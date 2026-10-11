import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Emprise } from '@/lib/geo'
import { cadrageCapture, zoomImpression } from '@/lib/impression'
import type { CarteImprimee } from '@/stores/ui-store'
import { PCI_ZOOM_MIN } from './layers/pci-source'

/**
 * Format de la carte imprimée (largeur / hauteur) : toute la largeur d'une page A4, sur un peu
 * plus d'un tiers de sa hauteur, pour laisser la synthèse sur la première page.
 */
export const FORMAT_CARTE = 3 / 2

// Écart entre la parcelle et le bord de l'image quand il faut reculer pour la montrer entière.
const MARGE = 32

/**
 * Centre la carte sur la parcelle, au zoom de la vue courante tant qu'elle y tient entière et
 * surlignée. Renvoie de quoi revenir à la vue d'avant.
 */
export function cadrerPourImpression(map: MapLibreMap, emprise: Emprise): () => void {
  const avant = { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() }
  const { clientWidth, clientHeight } = map.getContainer()
  const cadre = cadrageCapture({ width: clientWidth, height: clientHeight }, FORMAT_CARTE)
  const camera = map.cameraForBounds(emprise, {
    padding: { top: cadre.y + MARGE, bottom: cadre.y + MARGE, left: cadre.x + MARGE, right: cadre.x + MARGE },
    bearing: avant.bearing,
  })
  // Sans caméra (écran plus petit que les marges), on garde le zoom courant.
  const parcelleEntiere = camera?.zoom ?? avant.zoom
  map.jumpTo({
    center: camera?.center ?? [(emprise[0] + emprise[2]) / 2, (emprise[1] + emprise[3]) / 2],
    zoom: zoomImpression({ courant: avant.zoom, parcelleEntiere, surlignage: PCI_ZOOM_MIN }),
  })
  return () => map.jumpTo(avant)
}

/**
 * Attend que la carte ait fini de charger son style et ses tuiles, ou que `signal` abandonne :
 * on capture alors la carte telle qu'elle est.
 */
export function carteStabilisee(map: MapLibreMap, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const fin = () => {
      map.off('idle', fin)
      signal.removeEventListener('abort', fin)
      resolve()
    }
    map.on('idle', fin)
    signal.addEventListener('abort', fin)
    // Une carte déjà stable ne redessine plus et n'émettrait plus jamais `idle`.
    map.triggerRepaint()
  })
}

/**
 * Image de la partie centrale de la carte, au format de l'impression, avec ses mentions. Null si
 * le navigateur refuse de la copier.
 */
export function capturerCarte(map: MapLibreMap): CarteImprimee | null {
  // Sans `preserveDrawingBuffer`, l'image WebGL n'est lisible que juste après l'avoir dessinée.
  map.redraw()
  const source = map.getCanvas()
  const cadre = cadrageCapture({ width: source.width, height: source.height }, FORMAT_CARTE)
  const copie = document.createElement('canvas')
  copie.width = cadre.width
  copie.height = cadre.height
  const contexte = copie.getContext('2d')
  if (!contexte) return null
  contexte.drawImage(source, cadre.x, cadre.y, cadre.width, cadre.height, 0, 0, cadre.width, cadre.height)
  return {
    image: copie.toDataURL('image/jpeg', 0.92),
    // Le contrôle d'attribution tient déjà à jour, en texte, les mentions des sources affichées.
    attribution: map.getContainer().querySelector('.maplibregl-ctrl-attrib-inner')?.textContent?.trim() ?? '',
  }
}
