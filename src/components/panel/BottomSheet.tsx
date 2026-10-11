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
import { adjacentSnap, HALF_SCREEN_RATIO, SNAPS, snapOnRelease, type Snap } from '@/lib/bottom-sheet'
import { useUiStore } from '@/stores/ui-store'

interface BottomSheetProps {
  header: ReactNode
  children: ReactNode
  /** Snap when the panel opens; afterwards, the user chooses. */
  initialSnap: Snap
}

const LABELS: Record<Snap, string> = {
  peek: 'Aperçu',
  half: 'Mi-écran',
  full: 'Plein écran',
}

// The map store's framing reserves the same share of the screen for the half snap.
const CSS_HEIGHTS = { half: `${HALF_SCREEN_RATIO * 100}svh`, full: '100svh' }

// Below this, the finger hesitates or taps (close the report): it is not a drag yet.
const DRAG_THRESHOLD = 6
// A finger held still before being lifted has no momentum left, whatever its past velocity.
const MOMENTUM_WINDOW = 100

interface Gesture {
  pointerId: number
  startY: number
  startHeight: number
  y: number
  t: number
  /** px/ms, positive upwards. */
  velocity: number
  dragging: boolean
}

/**
 * Mobile container of the report: panel that rises from the bottom of the screen and rests on three snaps
 * (UI store). The handle and the header are dragged with the finger; the handle can also be driven
 * with the keyboard and by a tap. In peek, only the header shows and the map stays usable above.
 */
export function BottomSheet({ header, children, initialSnap }: BottomSheetProps) {
  const snap = useUiStore((state) => state.sheetSnap)
  const setSnap = useUiStore((state) => state.setSheetSnap)
  const sheet = useRef<HTMLElement>(null)
  const peek = useRef<HTMLDivElement>(null)
  const [peekHeight, setPeekHeight] = useState(0)
  const [draggedHeight, setDraggedHeight] = useState<number | null>(null)
  const gesture = useRef<Gesture | null>(null)

  // Frozen on mount: a later selection, with the report already open, must not move the panel.
  const [snapOnOpen] = useState(initialSnap)
  useEffect(() => {
    setSnap(snapOnOpen)
    // Go back to peek on close: the next report will rise from the bottom instead of first
    // showing at the snap where the previous one was left.
    return () => setSnap('peek')
  }, [setSnap, snapOnOpen])

  // The peek fits the handle and the header, whose height depends on the text and the zoom.
  useLayoutEffect(() => {
    const area = peek.current
    const panel = sheet.current
    if (!area || !panel) return
    const measure = () => setPeekHeight(area.offsetHeight + panel.clientTop)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(area)
    return () => observer.disconnect()
  }, [])

  const heightsInPx = (): Record<Snap, number> => ({
    peek: peekHeight,
    half: window.innerHeight * HALF_SCREEN_RATIO,
    full: window.innerHeight,
  })

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || !sheet.current) return
    gesture.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: sheet.current.offsetHeight,
      y: event.clientY,
      t: event.timeStamp,
      velocity: 0,
      dragging: false,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.pointerId !== event.pointerId) return
    if (!g.dragging) {
      if (Math.abs(event.clientY - g.startY) < DRAG_THRESHOLD) return
      g.dragging = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const dt = event.timeStamp - g.t
    if (dt > 0) g.velocity = (g.y - event.clientY) / dt
    g.y = event.clientY
    g.t = event.timeStamp
    const height = g.startHeight + g.startY - event.clientY
    setDraggedHeight(Math.min(Math.max(height, peekHeight), window.innerHeight))
  }

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.pointerId !== event.pointerId) return
    gesture.current = null
    if (!g.dragging || draggedHeight === null) return
    const momentum = event.type === 'pointerup' && event.timeStamp - g.t < MOMENTUM_WINDOW
    setSnap(
      snapOnRelease({
        heights: heightsInPx(),
        height: draggedHeight,
        velocity: momentum ? g.velocity : 0,
      }),
    )
    setDraggedHeight(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = snapForKey(snap, event.key)
    if (!next) return
    event.preventDefault()
    setSnap(next)
  }

  // A tap on the handle expands by one snap, and collapses everything from full screen.
  const onTap = () => setSnap(snap === 'full' ? 'peek' : adjacentSnap(snap, 'up'))

  const height =
    draggedHeight !== null
      ? `${draggedHeight}px`
      : snap === 'peek'
        ? `${peekHeight}px`
        : CSS_HEIGHTS[snap]

  return (
    <aside
      ref={sheet}
      aria-label="Fiche de la parcelle"
      style={{ height }}
      className={cn(
        'fixed inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-xl border-t bg-background/85 shadow-lg backdrop-blur-md',
        draggedHeight === null && 'transition-[height] duration-300 ease-out motion-reduce:transition-none',
      )}
    >
      <div
        ref={peek}
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
          aria-valuemax={SNAPS.length - 1}
          aria-valuenow={SNAPS.indexOf(snap)}
          aria-valuetext={LABELS[snap]}
          onKeyDown={onKeyDown}
          onClick={onTap}
          className="flex h-6 cursor-grab items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:cursor-grabbing"
        >
          <span aria-hidden className="h-1 w-10 rounded-full bg-muted-foreground/40" />
        </div>
        {header}
      </div>
      {/* Hidden in peek: the keyboard must not enter it while it is not visible. */}
      <div
        inert={snap === 'peek' && draggedHeight === null}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
      >
        {children}
      </div>
    </aside>
  )
}

function snapForKey(snap: Snap, key: string): Snap | null {
  switch (key) {
    case 'ArrowUp':
    case 'ArrowRight':
    case 'PageUp':
      return adjacentSnap(snap, 'up')
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'PageDown':
      return adjacentSnap(snap, 'down')
    case 'Home':
      return SNAPS[0]
    case 'End':
      return SNAPS[SNAPS.length - 1]
    default:
      return null
  }
}
