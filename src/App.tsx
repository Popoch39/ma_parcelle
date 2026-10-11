import { PrintedReport } from '@/components/print/PrintedReport'
import { ReportPanel } from '@/components/panel/ReportPanel'
import { SearchBar } from '@/components/search/SearchBar'
import { LocateButton } from '@/map/controls/LocateButton'
import { MapControls } from '@/map/controls/MapControls'
import { MapLayers } from '@/map/MapLayers'
import { MapView } from '@/map/MapView'
import { SelectionFraming } from '@/map/SelectionFraming'

function App() {
  return (
    <>
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
