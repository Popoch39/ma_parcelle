import { describe, expect, it } from 'vitest'
import { snapOnRelease, adjacentSnap } from './bottom-sheet'

// 800 px screen: 80 px peek, half screen at 400 px, full screen at 800 px.
const heights = { peek: 80, half: 400, full: 800 }

describe('snapOnRelease', () => {
  it('settles the panel on the closest snap when released without momentum', () => {
    expect(snapOnRelease({ heights, height: 300, velocity: 0 })).toBe('half')
    expect(snapOnRelease({ heights, height: 200, velocity: 0 })).toBe('peek')
    expect(snapOnRelease({ heights, height: 650, velocity: 0 })).toBe('full')
  })

  it('follows the momentum of a quick gesture to the next snap in its direction, even if it is farther', () => {
    expect(snapOnRelease({ heights, height: 420, velocity: 1 })).toBe('full')
    expect(snapOnRelease({ heights, height: 380, velocity: -1 })).toBe('peek')
    expect(snapOnRelease({ heights, height: 420, velocity: -1 })).toBe('half')
  })

  it('stays at the extreme snap when a quick gesture pushes past it', () => {
    expect(snapOnRelease({ heights, height: 820, velocity: 2 })).toBe('full')
    expect(snapOnRelease({ heights, height: 60, velocity: -2 })).toBe('peek')
  })
})

describe('adjacentSnap', () => {
  it('moves up or down one snap, without going past the extremes', () => {
    expect(adjacentSnap('peek', 'up')).toBe('half')
    expect(adjacentSnap('half', 'up')).toBe('full')
    expect(adjacentSnap('full', 'up')).toBe('full')
    expect(adjacentSnap('full', 'down')).toBe('half')
    expect(adjacentSnap('peek', 'down')).toBe('peek')
  })
})
