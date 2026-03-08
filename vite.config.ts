import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/firms': {
        target: 'https://firms.modaps.eosdis.nasa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/firms/, '')
      },
      '/api/news/bbc': {
        target: 'https://feeds.bbci.co.uk',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news\/bbc/, '')
      },
      '/api/news/un': {
        target: 'https://news.un.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news\/un/, '')
      },
      '/api/news/nyt': {
        target: 'https://rss.nytimes.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news\/nyt/, '')
      },
      '/api/news/aj': {
        target: 'https://www.aljazeera.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news\/aj/, '')
      },
      '/api/news/guardian': {
        target: 'https://www.theguardian.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news\/guardian/, '')
      },
      '/api/news/nasa-breaking': {
        target: 'https://www.nasa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news\/nasa-breaking/, '')
      },
      '/api/news/hn': {
        target: 'https://news.ycombinator.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news\/hn/, '')
      }
    }
  }
})
