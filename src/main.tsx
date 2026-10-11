import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { queryClient } from './queries/query-client'
import { suivreImpressions } from './stores/imprimer-fiche'
import { syncSelectionWithUrl } from './stores/selection-url'
import { applyThemeToDocument, followDesktopLayout, followSystemColorScheme } from './stores/ui-store'

followSystemColorScheme()
followDesktopLayout()
applyThemeToDocument()
syncSelectionWithUrl()
suivreImpressions()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
