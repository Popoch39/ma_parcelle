import { useEffect } from 'react'
import { useParcel } from '@/queries/parcel'
import { SITE_NAME } from '@/seo/site'
import { useSelectionStore } from '@/stores/selection-store'

// The home page's title, set in index.html at build (src/seo).
const HOME_TITLE = document.title

/** Names the selected parcel in the tab title, the history and the bookmarks. */
export function DocumentTitle() {
  const idu = useSelectionStore((state) => state.idu)
  return idu ? <ParcelTitle key={idu} idu={idu} /> : null
}

function ParcelTitle({ idu }: { idu: string }) {
  const parcel = useParcel(idu).data
  const title = parcel
    ? `Parcelle ${parcel.cadastralReference}, ${(parcel.district ?? parcel.municipality).name} · ${SITE_NAME}`
    : `Parcelle ${idu} · ${SITE_NAME}`

  useEffect(() => {
    document.title = title
  }, [title])
  useEffect(
    () => () => {
      document.title = HOME_TITLE
    },
    [],
  )

  return null
}
