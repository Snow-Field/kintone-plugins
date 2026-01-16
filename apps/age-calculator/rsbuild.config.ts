import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

export default defineConfig({
  plugins: [pluginReact(), pluginTypeCheck()],
  source: {
    entry: {
      desktop: { import: './src/desktop/index.ts', html: false },
      mobile: { import: './src/mobile/index.ts', html: false },
      config: { import: './src/config/index.tsx', html: false },
    },
    tsconfigPath: './tsconfig.json',
  },
  performance: {
    chunkSplit: { strategy: 'all-in-one' }, // Disable chunk splitting
  },
  output: {
    sourceMap: {
      js: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,
    },
    distPath: {
      root: 'dist',
      html: './',
      js: 'js',
      jsAsync: 'js',
      css: 'css',
      cssAsync: 'css',
      svg: 'svg',
      font: 'font',
      wasm: 'wasm',
      image: 'image',
      media: 'media',
      assets: 'assets',
    },
    dataUriLimit: Number.MAX_SAFE_INTEGER, // Inline all static assets
    filenameHash: false, // Disable filename hashing
    cleanDistPath: true, // Clean dist path
  },
});
