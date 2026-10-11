import { FichePanel } from '@/components/panel/FichePanel'
import { SearchBar } from '@/components/search/SearchBar'
import { LocateButton } from '@/map/controls/LocateButton'
import { MapLayers } from '@/map/MapLayers'
import { MapView } from '@/map/MapView'
import { SelectionFraming } from '@/map/SelectionFraming'

function App() {
  return (
    <>
      <MapView />
      <MapLayers />
      <SelectionFraming />
      <FichePanel />
      {/* Au-dessus de la fiche, et de sa largeur sur desktop (voir PanelShell). */}
      <div className="fixed inset-x-3 top-3 z-20 flex items-start gap-2 md:right-auto md:w-[420px]">
        <SearchBar />
        <LocateButton />
      </div>
    </>
  )
}

export default App
