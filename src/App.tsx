import { PrintedReport } from '@/components/print/PrintedReport'
import { ReportPanel } from '@/components/panel/ReportPanel'
import { DocumentTitle } from '@/components/report/DocumentTitle'
import { SearchBar } from '@/components/search/SearchBar'
import { LocateButton } from '@/map/controls/LocateButton'
import { MapControls } from '@/map/controls/MapControls'
import { MapLayers } from '@/map/MapLayers'
import { MapView } from '@/map/MapView'
import { SelectionFraming } from '@/map/SelectionFraming'

function App() {
  return (
    <>
      {/* The page's heading, for screen readers and search engines: the map speaks for itself. */}
      <h1 className="sr-only">Ma parcelle : cadastre, PLU, risques et ventes de toute parcelle</h1>
      <DocumentTitle />
      <MapView />
      <MapLayers />
      <SelectionFraming />
      <MapControls />
      <ReportPanel />
      {/*
        On desktop, above the report panel and at its width (see PanelShell), so that the
        suggestions cover it. On mobile, full width, below the full-screen report.
      */}
      <div className="fixed inset-x-3 top-3 z-[5] flex items-start gap-2 md:right-auto md:z-20 md:w-panel">
        <SearchBar />
        <LocateButton />
      </div>
      <PrintedReport />
    </>
  )
}

export default App
