import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Must match the GitHub repo name so asset URLs work on GitHub Pages.
  base: '/FARAI_FaceAttendanceRecognition/',
})
