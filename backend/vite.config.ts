import { defineConfig } from 'vite';
import { nodeExternals } from 'rollup-plugin-node-externals';

export default defineConfig({
  plugins: [nodeExternals()],
  build: {
    target: 'node22',
    lib: {
      entry: 'src/server.ts',
      formats: ['cjs'],
      fileName: () => 'server.js',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['bcrypt', 'sharp'], // sometimes native modules need explicit externalization even with plugin
    },
    outDir: 'dist',
    sourcemap: true,
  },
});
