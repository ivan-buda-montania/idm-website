import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The catalog (public/data/catalog.json) and its images (public/media/) ship with the build.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
