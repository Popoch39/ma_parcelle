import { LoaderCircle, LocateFixed } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useMapStore } from '@/stores/map-store'

type LocateState = { status: 'idle' | 'pending' } | { status: 'error'; message: string }

function geolocationMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Localisation refusée : autorisez-la dans les réglages du navigateur pour ce site.'
    case error.TIMEOUT:
      return 'Votre position met trop de temps à arriver.'
    default:
      return 'Votre position est indisponible pour le moment.'
  }
}

/** « Me localiser » : centre la carte sur la position de l'appareil. */
export function LocateButton() {
  const centerOn = useMapStore((state) => state.centerOn)
  const [state, setState] = useState<LocateState>({ status: 'idle' })

  const locate = () => {
    if (state.status === 'pending') return
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', message: 'Ce navigateur ne sait pas donner votre position.' })
      return
    }
    setState({ status: 'pending' })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setState({ status: 'idle' })
        centerOn({ lon: coords.longitude, lat: coords.latitude })
      },
      (error) => setState({ status: 'error', message: geolocationMessage(error) }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    )
  }

  return (
    <div className="relative shrink-0">
      <Button
        variant="outline"
        size="icon-lg"
        onClick={locate}
        aria-busy={state.status === 'pending'}
        aria-label="Me localiser"
        title="Me localiser"
        className="size-11 rounded-xl bg-background/85 shadow-lg backdrop-blur-md"
      >
        {state.status === 'pending' ? <LoaderCircle aria-hidden className="animate-spin" /> : <LocateFixed aria-hidden />}
      </Button>
      {state.status === 'error' && (
        <p
          role="alert"
          className="absolute top-full right-0 mt-1 w-64 rounded-xl border bg-background/95 px-3 py-2 text-sm text-destructive shadow-lg backdrop-blur-md"
        >
          {state.message}
        </p>
      )}
    </div>
  )
}
