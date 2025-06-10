
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/mp-test/',
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://test.lila.com.ar', // Using the test server
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            // Log headers for debugging
            console.log('Request Headers:', req.headers);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            console.log('Response Headers:', proxyRes.headers);
            
            // Check content type of response
            const contentType = proxyRes.headers['content-type'];
            if (contentType && contentType.includes('text/html')) {
              console.warn('WARNING: Received HTML response instead of expected JSON:', req.url);
            }
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
