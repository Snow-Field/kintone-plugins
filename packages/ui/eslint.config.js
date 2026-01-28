import { defineConfig } from 'eslint/config';
import sharedConfig from '@kintone-plugin/eslint-config';

export default defineConfig([
  ...sharedConfig,
  {
    ignores: ['node_modules', 'dist', '*.config.ts', '*.config.js'],
  },
]);
