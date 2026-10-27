import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site lives at /roukverse-3d/, so assets must
  // be served under that path. For a root-domain host (Vercel/Netlify),
  // change this back to '/'.
  base: '/roukverse-3d/',
})
