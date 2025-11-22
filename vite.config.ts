import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Include specific polyfills
      include: ['crypto', 'stream', 'util', 'buffer'],
      // Exclude modules that aren't needed
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add crypto polyfill alias
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      // Exclude Node.js-specific Turbo SDK modules
      '@ardrive/turbo-sdk/node': path.resolve(__dirname, './src/lib/turbo-stub.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['buffer', '@ardrive/turbo-sdk'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      external: ['fs', 'path', 'os', 'http', 'https', 'zlib', 'vm'],
      output: {
        manualChunks: {
          'arweave-vendor': ['@ardrive/turbo-sdk', 'arweave'],
        },
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  publicDir: 'public', // This should copy public files to dist
});
