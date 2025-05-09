import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handlePropertyDataRequest } from './src/server/api/propertyData';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'property-data-api',
      configureServer(server) {
        server.middlewares.use('/api/propertyData', async (req, res) => {
          if (req.method === 'GET') {
            try {
              const result = await handlePropertyDataRequest();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ 
                error: 'Failed to fetch property data',
                details: error instanceof Error ? error.message : 'Unknown error'
              }));
            }
          } else {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  assetsInclude: ['**/*.json'],
  json: {
    stringify: false
  }
});
