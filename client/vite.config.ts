import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip', ext: '.gz' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':      ['lucide-react'],
          'vendor-charts':  ['recharts'],
          'vendor-utils':   ['axios', 'date-fns'],
          'pages-admin':    [
            './src/pages/admin/UserManagement',
            './src/pages/admin/CategoryManagement',
            './src/pages/admin/CoachList',
            './src/pages/admin/LicenseManagement',
            './src/pages/admin/StageManagement',
            './src/pages/admin/ClubSettingsPage',
          ],
          'pages-coach':    [
            './src/pages/coach/CoachDashboard',
            './src/pages/coach/SportifList',
            './src/pages/coach/SportifDetails',
            './src/pages/coach/EventsPage',
            './src/pages/coach/AttendancePage',
            './src/pages/coach/CoachTeam',
            './src/pages/coach/MessagesPage',
            './src/pages/coach/CoachProfile',
          ],
          'pages-sportif':  [
            './src/pages/sportif/SportifDashboard',
            './src/pages/sportif/SportifEvents',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  preview: {
    allowedHosts: ['g1club.fr', 'www.g1club.fr'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('connection', 'keep-alive');
          });
        },
      },
    },
  },
})
