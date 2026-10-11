import { FicheImprimee } from '@/components/impression/FicheImprimee'
import { FichePanel } from '@/components/panel/FichePanel'
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
      <FichePanel />
      {/*
        Sur desktop, au-dessus du panneau de la fiche et de sa largeur (voir PanelShell), pour que
        les suggestions le recouvrent. Sur mobile, toute la largeur, sous la fiche en plein écran.
      */}
      <div className="fixed inset-x-3 top-3 z-[5] flex items-start gap-2 md:right-auto md:z-20 md:w-panneau">
        <SearchBar />
        <LocateButton />
      </div>
      <FicheImprimee />
    </>
  )
}

export default App
