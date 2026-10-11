import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { queryClient } from './queries/query-client'
import { syncSelectionWithUrl } from './stores/selection-url'
import { followSystemColorScheme } from './stores/ui-store'

followSystemColorScheme()
syncSelectionWithUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
