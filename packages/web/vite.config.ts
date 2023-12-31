/// <reference types="vitest" />
import react from '@vitejs/plugin-react-swc'
import dotenv from 'dotenv'
import { join } from 'path'
import { PluginOption, defineConfig } from 'vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import filenamesToType from './vitePluginFilenamesToType'
import { appName } from './utils/const'

dotenv.config({ path: join(__dirname, '../../.env') })
const IS_ELECTRON = process.env.IS_ELECTRON
const ELECTRON_DEV_NETEASE_API_PORT = Number(process.env.ELECTRON_DEV_NETEASE_API_PORT || 30001)
const ELECTRON_WEB_SERVER_PORT = Number(process.env.ELECTRON_WEB_SERVER_PORT || 42710)

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  // clearScreen: IS_ELECTRON ? false : true,
  clearScreen: false,
  mode: process.env.NODE_ENV,
  root: './',
  base: '/',
  resolve: {
    alias: {
      '@': join(__dirname, '..'),
      'hls.js': 'hls.js/dist/hls.min.js',
    },
  },
  plugins: [
    visualizer({
      emitFile: true,
      filename: "stats.html",
    }) as PluginOption,
    react(),
    filenamesToType([
      {
        dictionary: './assets/icons',
        typeFile: './components/Icon/iconNamesType.ts',
      },
    ]),

    /**
     * @see https://vite-plugin-pwa.netlify.app/guide/generate.html
     */
    IS_ELECTRON
      ? VitePWA({
          registerType: 'autoUpdate',
          manifest: {
            name: appName,
            short_name: appName,
            description: 'Description of your app',
            theme_color: '#000',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable',
              },
            ],
          },
        })
      : undefined,

    /**
     * @see https://github.com/vbenjs/vite-plugin-svg-icons
     */
    createSvgIconsPlugin({
      iconDirs: [join(__dirname, './assets/icons')],
      symbolId: 'icon-[name]',
    }),
  ],
  build: {
    target: IS_ELECTRON ? 'esnext' : 'modules',
    sourcemap: true,
    outDir: './dist',
    emptyOutDir: true,
    rollupOptions: {
      plugins: [
      ],
    },
  },
  server: {
    port: ELECTRON_WEB_SERVER_PORT,
    strictPort: IS_ELECTRON ? true : false,
    proxy: {
      '/netease/': {
        target: `http://127.0.0.1:${ELECTRON_DEV_NETEASE_API_PORT}`,
        changeOrigin: true,
        rewrite: path => (IS_ELECTRON ? path : path.replace(/^\/netease/, '')),
      },
      '/r3playx/': {
        target: `http://127.0.0.1:${ELECTRON_DEV_NETEASE_API_PORT}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: ELECTRON_WEB_SERVER_PORT,
  },
  test: {
    environment: 'jsdom',
  },
})
