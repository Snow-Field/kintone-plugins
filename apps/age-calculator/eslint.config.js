import sharedConfig from '@kintone-plugin/eslint-config';

export default [
  ...sharedConfig,
  {
    ignores: ['node_modules', 'lib', 'dist', '*.config.ts', '*.config.js'],
  },
];
