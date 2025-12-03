import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { youwareVitePlugin } from "@youware/vite-plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [youwareVitePlugin(), react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    // Desactivar sourcemaps en build para evitar requests a archivos locales en HA ingress
    sourcemap: false,
    // Configurar rollupOptions para empaquetar todas las dependencias
    rollupOptions: {
      output: {
        // Estrategia de chunking manual para mejor control
        manualChunks: undefined,
      },
    },
    // Asegurar que las dependencias se incluyan en el bundle
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  // Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'framer-motion',
      'lucide-react',
      'gsap',
      'three',
      'i18next',
      'react-i18next',
    ],
  },
});
