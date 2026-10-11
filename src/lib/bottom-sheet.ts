/** Heights the report bottom sheet settles at, from lowest to highest. */
export const SNAPS = ['peek', 'half', 'full'] as const

export type Snap = (typeof SNAPS)[number]

/** Share of the screen height covered by the bottom sheet at half screen, where the map framing places nothing. */
export const HALF_SCREEN_RATIO = 0.5

interface Release {
  /** Height of each snap, in px. */
  heights: Record<Snap, number>
  /** Height of the panel at the moment the finger lets go, in px. */
  height: number
  /** Finger velocity at release, in px/ms, positive upwards. */
  velocity: number
}

/** Snap immediately above or below, the extreme snap staying in place. */
export function adjacentSnap(snap: Snap, direction: 'up' | 'down'): Snap {
  const index = SNAPS.indexOf(snap) + (direction === 'up' ? 1 : -1)
  return SNAPS[Math.min(Math.max(index, 0), SNAPS.length - 1)]
}

// Beyond this, the gesture is a fling: we follow its intent rather than the position reached,
// otherwise a quick flick would only return to the starting snap.
const FLING_VELOCITY = 0.5

/** Snap the panel settles on when released after being dragged. */
export function snapOnRelease({ heights, height, velocity }: Release): Snap {
  if (velocity >= FLING_VELOCITY) {
    return SNAPS.find((snap) => heights[snap] > height) ?? SNAPS[SNAPS.length - 1]
  }
  if (velocity <= -FLING_VELOCITY) {
    return SNAPS.findLast((snap) => heights[snap] < height) ?? SNAPS[0]
  }
  const distance = (snap: Snap) => Math.abs(heights[snap] - height)
  return SNAPS.reduce((closest, snap) => (distance(snap) < distance(closest) ? snap : closest))
}
