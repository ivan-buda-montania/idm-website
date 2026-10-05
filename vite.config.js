import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import aiContent from './vite-plugins/ai-content.js'

// The catalog (public/data/catalog.json) and its images (public/media/) ship with the build.
// ai-content derives llms-full.txt and the /md/ Markdown pages from the catalog.
export default defineConfig({
  plugins: [react(), tailwindcss(), aiContent()],
})
