import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://homeassistant.local:8123',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const host = req.headers.host || 'localhost:5173';
            proxyReq.setHeader('X-Forwarded-Host', host);
            proxyReq.setHeader('X-Forwarded-Proto', 'http');
          });
        },
      },
      '/api': {
        target: 'http://homeassistant.local:8123',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const host = req.headers.host || 'localhost:5173';
            proxyReq.setHeader('X-Forwarded-Host', host);
            proxyReq.setHeader('X-Forwarded-Proto', 'http');
          });
        },
      },
      '/frontend_latest': {
        target: 'http://homeassistant.local:8123',
        changeOrigin: true,
        secure: false,
      },
      '/static': {
        target: 'http://homeassistant.local:8123',
        changeOrigin: true,
        secure: false,
      },
      '/sw-modern.js': {
        target: 'http://homeassistant.local:8123',
        changeOrigin: true,
        secure: false,
      },
      '/service_worker.js': {
        target: 'http://homeassistant.local:8123',
        changeOrigin: true,
        secure: false,
      },
      '/cdn-cgi': {
        target: 'http://homeassistant.local:8123',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
