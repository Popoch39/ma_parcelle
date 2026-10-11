import { FichePanel } from '@/components/panel/FichePanel'
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
    </>
  )
}

export default App
