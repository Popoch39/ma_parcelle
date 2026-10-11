import { useEffect } from 'react'
import { LazyReport } from '@/components/report/LazyReport'
import { useParcel } from '@/queries/parcel'
import { useSelectionStore } from '@/stores/selection-store'
import { reportUrl } from '@/stores/selection-url'
import { useUiStore, type PrintJob } from '@/stores/ui-store'
import { MapFigure } from './MapFigure'

const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

/**
 * Document printed instead of the screen during a print: the selected parcel's report,
 * preceded by the map. The print stylesheet hides everything else.
 */
export function PrintedReport() {
  const printJob = useUiStore((state) => state.printJob)
  const idu = useSelectionStore((state) => state.idu)
  if (!printJob || !idu) return null
  return <PrintedDocument idu={idu} printJob={printJob} />
}

function PrintedDocument({ idu, printJob }: { idu: string; printJob: PrintJob }) {
  const parcel = useParcel(idu).data
  const url = reportUrl(idu)

  // The page title serves as the PDF's file name.
  useEffect(() => {
    const title = document.title
    document.title = `Fiche parcelle ${idu}`
    return () => {
      document.title = title
    }
  }, [idu])

  return (
    // Never on screen: only the print stylesheet shows it.
    <article className="printed-report hidden flex-col gap-3 print:flex">
      <header className="flex flex-col gap-1 border-b pb-3">
        <p className="text-xs text-muted-foreground">Ma parcelle · fiche de parcelle</p>
        <h1 className="text-lg font-semibold">
          {parcel ? `${parcel.municipality.name}, parcelle ${parcel.cadastralReference}` : `Parcelle ${idu}`}
        </h1>
        <p className="text-xs text-muted-foreground">
          IDU <span className="font-mono">{idu}</span> · Imprimée le {dateTime.format(printJob.date)}
        </p>
        <p className="text-xs break-all text-muted-foreground">Fiche en ligne : {url}</p>
      </header>
      <MapFigure map={printJob.map} />
      <LazyReport idu={idu} />
    </article>
  )
}
