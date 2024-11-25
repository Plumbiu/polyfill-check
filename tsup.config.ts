import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['cjs'],
  clean: true,
  dts: true,
  minify: 'terser',
  banner: {
    js: '#! /usr/bin/env node',
  },
  noExternal: [/(.*)/],
})
