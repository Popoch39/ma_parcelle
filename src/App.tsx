import { FichePanel } from '@/components/panel/FichePanel'
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
    </>
  )
}

export default App
