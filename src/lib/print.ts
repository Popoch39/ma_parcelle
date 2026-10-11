/** Dimensions in pixels. */
export interface Size {
  width: number
  height: number
}

/** Rectangle in pixels, from the top-left corner. */
export interface Rectangle extends Size {
  x: number
  y: number
}

interface CurrentView {
  /** Zoom of the on-screen view. */
  zoom: number
  /** Zoom from which the selected parcel is highlighted (cadastral tiles). */
  highlightZoom: number
  /** Center of the parcel's bbox on screen, in pixels. */
  parcelCenter: { x: number; y: number }
  /** Part of the map kept for printing (`captureFrame`). */
  frame: Rectangle
}

/**
 * True if the map prints as it is on screen: the parcel is highlighted there and its center falls
 * within the image. Otherwise, it must be reframed on it.
 */
export function keepCurrentView({ zoom, highlightZoom, parcelCenter: { x, y }, frame }: CurrentView): boolean {
  if (zoom < highlightZoom) return false
  return x >= frame.x && x <= frame.x + frame.width && y >= frame.y && y <= frame.y + frame.height
}

interface PrintZooms {
  /** Zoom of the on-screen view. */
  current: number
  /** Highest zoom at which the whole parcel fits in the image. */
  wholeParcel: number
  /** Zoom from which the selected parcel is highlighted (cadastral tiles). */
  highlightZoom: number
}

/**
 * Zoom of the printed map reframed on the parcel: that of the current view, as long as the
 * parcel fits whole and is highlighted there. A parcel too large to be highlighted is at least
 * shown whole.
 */
export function printZoom({ current, wholeParcel, highlightZoom }: PrintZooms): number {
  return Math.min(Math.max(current, highlightZoom), wholeParcel)
}

/**
 * Part of the map to keep for printing: the largest rectangle at the wanted aspect ratio
 * (width / height), centered, in whole pixels.
 */
export function captureFrame(canvas: Size, aspectRatio: number): Rectangle {
  const width = Math.round(Math.min(canvas.width, canvas.height * aspectRatio))
  const height = Math.round(Math.min(canvas.height, canvas.width / aspectRatio))
  return {
    x: Math.round((canvas.width - width) / 2),
    y: Math.round((canvas.height - height) / 2),
    width,
    height,
  }
}
