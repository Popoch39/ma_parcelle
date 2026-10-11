import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { suivreImpressions } from './components/impression/imprimer-fiche'
import { queryClient } from './queries/query-client'
import { syncSelectionWithUrl } from './stores/selection-url'
import { applyThemeToDocument, followSystemColorScheme } from './stores/ui-store'

followSystemColorScheme()
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
