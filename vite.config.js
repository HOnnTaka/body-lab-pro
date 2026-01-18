import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/cdn-proxy': {
        target: 'https://mp-3f56fc6a-bbec-4426-a407-1bcc974e221a.cdn.bspapp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cdn-proxy/, '')
      }
    }
  }
})
