import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

export default defineConfig({
  plugins: [pluginReact(), pluginTypeCheck()],
  source: {
    entry: {
      config: { import: './src/config/index.tsx', html: false },
    },
    tsconfigPath: './tsconfig.json',
  },
  // kintone は1画面につき1つの JS ファイルを読み込むため、チャンクに分割しない
  splitChunks: false,
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
    dataUriLimit: Number.MAX_SAFE_INTEGER,
    filenameHash: false,
    cleanDistPath: true,
  },
});
