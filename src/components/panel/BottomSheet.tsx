import { cn } from 'cn'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { CRANS, cranAuRelachement, cranVoisin, PART_MI_ECRAN, type Cran } from '@/lib/bottom-sheet'
import { useUiStore } from '@/stores/ui-store'

interface BottomSheetProps {
  header: ReactNode
  children: ReactNode
  /** Cran à l'ouverture du panneau ; ensuite, c'est l'utilisateur qui choisit. */
  cranInitial: Cran
}

const LIBELLES: Record<Cran, string> = {
  apercu: 'Aperçu',
  'mi-ecran': 'Mi-écran',
  'plein-ecran': 'Plein écran',
}

// Le cadrage du store carte réserve la même part de l'écran au mi-écran.
const HAUTEURS_CSS = { 'mi-ecran': `${PART_MI_ECRAN * 100}svh`, 'plein-ecran': '100svh' }

// En deçà, le doigt hésite ou tape (fermer la fiche) : ce n'est pas encore un glissement.
const SEUIL_DE_GLISSEMENT = 6
// Un doigt immobile avant d'être levé n'a plus d'élan, quelle que soit sa vitesse passée.
const DUREE_D_ELAN = 100

interface Geste {
  pointerId: number
  yDepart: number
  hauteurDepart: number
  y: number
  t: number
  /** px/ms, positive vers le haut. */
  vitesse: number
  glisse: boolean
}

/**
 * Contenant mobile de la fiche : panneau qui remonte du bas de l'écran et se pose sur trois crans
 * (store interface). La poignée et l'en-tête se font glisser au doigt ; la poignée se pilote aussi
 * au clavier et d'un tap. En aperçu, seul l'en-tête dépasse et la carte reste utilisable au-dessus.
 */
export function BottomSheet({ header, children, cranInitial }: BottomSheetProps) {
  const cran = useUiStore((state) => state.sheetCran)
  const setCran = useUiStore((state) => state.setSheetCran)
  const sheet = useRef<HTMLElement>(null)
  const apercu = useRef<HTMLDivElement>(null)
  const [hauteurApercu, setHauteurApercu] = useState(0)
  const [hauteurGlissee, setHauteurGlissee] = useState<number | null>(null)
  const geste = useRef<Geste | null>(null)

  // Figé au montage : une sélection suivante, fiche déjà ouverte, ne doit pas déplacer le panneau.
  const [cranAOuverture] = useState(cranInitial)
  useEffect(() => {
    setCran(cranAOuverture)
    // Repartir de l'aperçu à la fermeture : la prochaine fiche remontera du bas au lieu de
    // s'afficher d'abord au cran où la précédente a été laissée.
    return () => setCran('apercu')
  }, [setCran, cranAOuverture])

  // L'aperçu épouse la poignée et l'en-tête, dont la hauteur dépend du texte et du zoom.
  useLayoutEffect(() => {
    const zone = apercu.current
    const panneau = sheet.current
    if (!zone || !panneau) return
    const mesurer = () => setHauteurApercu(zone.offsetHeight + panneau.clientTop)
    mesurer()
    const observer = new ResizeObserver(mesurer)
    observer.observe(zone)
    return () => observer.disconnect()
  }, [])

  const hauteursEnPx = (): Record<Cran, number> => ({
    apercu: hauteurApercu,
    'mi-ecran': window.innerHeight * PART_MI_ECRAN,
    'plein-ecran': window.innerHeight,
  })

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || !sheet.current) return
    geste.current = {
      pointerId: event.pointerId,
      yDepart: event.clientY,
      hauteurDepart: sheet.current.offsetHeight,
      y: event.clientY,
      t: event.timeStamp,
      vitesse: 0,
      glisse: false,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const g = geste.current
    if (!g || g.pointerId !== event.pointerId) return
    if (!g.glisse) {
      if (Math.abs(event.clientY - g.yDepart) < SEUIL_DE_GLISSEMENT) return
      g.glisse = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const dt = event.timeStamp - g.t
    if (dt > 0) g.vitesse = (g.y - event.clientY) / dt
    g.y = event.clientY
    g.t = event.timeStamp
    const hauteur = g.hauteurDepart + g.yDepart - event.clientY
    setHauteurGlissee(Math.min(Math.max(hauteur, hauteurApercu), window.innerHeight))
  }

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const g = geste.current
    if (!g || g.pointerId !== event.pointerId) return
    geste.current = null
    if (!g.glisse || hauteurGlissee === null) return
    const elan = event.type === 'pointerup' && event.timeStamp - g.t < DUREE_D_ELAN
    setCran(
      cranAuRelachement({
        hauteurs: hauteursEnPx(),
        hauteur: hauteurGlissee,
        vitesse: elan ? g.vitesse : 0,
      }),
    )
    setHauteurGlissee(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const suivant = cranAuClavier(cran, event.key)
    if (!suivant) return
    event.preventDefault()
    setCran(suivant)
  }

  // Un tap sur la poignée déplie d'un cran, et replie tout depuis le plein écran.
  const onTap = () => setCran(cran === 'plein-ecran' ? 'apercu' : cranVoisin(cran, 'haut'))

  const hauteur =
    hauteurGlissee !== null
      ? `${hauteurGlissee}px`
      : cran === 'apercu'
        ? `${hauteurApercu}px`
        : HAUTEURS_CSS[cran]

  return (
    <aside
      ref={sheet}
      aria-label="Fiche de la parcelle"
      style={{ height: hauteur }}
      className={cn(
        'fixed inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-xl border-t bg-background/85 shadow-lg backdrop-blur-md',
        hauteurGlissee === null && 'transition-[height] duration-300 ease-out motion-reduce:transition-none',
      )}
    >
      <div
        ref={apercu}
        className="shrink-0 touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="Hauteur de la fiche"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={CRANS.length - 1}
          aria-valuenow={CRANS.indexOf(cran)}
          aria-valuetext={LIBELLES[cran]}
          onKeyDown={onKeyDown}
          onClick={onTap}
          className="flex h-6 cursor-grab items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:cursor-grabbing"
        >
          <span aria-hidden className="h-1 w-10 rounded-full bg-muted-foreground/40" />
        </div>
        {header}
      </div>
      {/* Masqué en aperçu : le clavier ne doit pas y entrer tant qu'il n'est pas visible. */}
      <div
        inert={cran === 'apercu' && hauteurGlissee === null}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
      >
        {children}
      </div>
    </aside>
  )
}

function cranAuClavier(cran: Cran, key: string): Cran | null {
  switch (key) {
    case 'ArrowUp':
    case 'ArrowRight':
    case 'PageUp':
      return cranVoisin(cran, 'haut')
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'PageDown':
      return cranVoisin(cran, 'bas')
    case 'Home':
      return CRANS[0]
    case 'End':
      return CRANS[CRANS.length - 1]
    default:
      return null
  }
}
