import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    proxy: {
      '/api/paymongo': {
        target: 'https://api.paymongo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/paymongo/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // Remove Origin header to prevent API from rejecting localhost
            proxyReq.removeHeader('Origin');
          });
        },
      },
    },
  },
})
