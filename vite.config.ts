/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages では https://<ユーザー名>.github.io/<リポジトリ名>/ で公開されるため、
// 公開時のビルドでは BASE_PATH=/<リポジトリ名>/ を渡す（ローカル開発では / のまま）
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '北京語 単語カード',
        short_name: '単語カード',
        description: '新HSK1級の単語を間隔反復で覚える',
        lang: 'ja',
        start_url: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fffaf5',
        theme_color: '#c2410c',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
