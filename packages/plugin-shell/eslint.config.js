import baseConfig from '@kintone-plugin/eslint-config';

export default [
  ...baseConfig,
  {
    ignores: ['node_modules', 'dist', '*.config.ts', '*.config.js'],
  },
];
