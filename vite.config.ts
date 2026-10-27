import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  // Keep '/' for Vercel/Netlify. For GitHub Pages, change this to
  // '/roukverse-3d/' before building (see README.md).
  base: '/',
})
