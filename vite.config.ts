import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  plugins: [
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Sistema Solar AR',
        short_name: 'Sistema Solar',
        description: 'Sistema Solar 3D interactivo en Realidad Aumentada WebXR + PWA',
        theme_color: '#070b19',
        background_color: '#070b19',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,glb,usdz,ktx2}'] }
    })
  ]
});