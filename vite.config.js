import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project sites live under /<repo>/; Vercel and local preview use /.
const base =
  process.env.GITHUB_ACTIONS === 'true'
    ? '/FARAI_FaceAttendanceRecognition/'
    : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
