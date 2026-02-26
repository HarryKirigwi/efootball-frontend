import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // Suppress noisy "ws proxy socket error: write ECONNABORTED" when client disconnects (refresh/navigate/tab close)
    {
      name: 'suppress-ws-proxy-socket-error',
      configResolved(config) {
        const orig = config.logger.error;
        config.logger.error = (msg, options) => {
          if (typeof msg === 'string' && msg.includes('ws proxy socket error') && options?.error?.message?.includes('ECONNABORTED')) return;
          orig(msg, options);
        };
      },
    },
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        configure: (proxy) => {
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.once('error', () => {
              try {
                socket.destroy();
              } catch (_) {}
            });
          });
        },
      },
    },
  },
});
