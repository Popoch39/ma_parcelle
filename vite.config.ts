import { fileURLToPath, URL } from 'node:url'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // MapLibre pèse à lui seul ~1 Mo minifié (280 ko gzip) : indivisible et nécessaire dès le
    // premier écran, il vit dans son propre chunk, gardé en cache d'un déploiement à l'autre. Le
    // code de l'app reste bien en deçà de 500 ko ; la fiche se charge à la première sélection.
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'maplibre', test: /node_modules[\\/]maplibre-gl/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    // Les worktrees d'agents vivent sous .claude/ et contiennent des copies des tests.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
})
