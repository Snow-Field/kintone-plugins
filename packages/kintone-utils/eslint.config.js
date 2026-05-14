import baseConfig from '@kintone-plugin/eslint-config';

export default [
  ...baseConfig,
  {
    ignores: ['node_modules', 'dist', '*.config.ts', '*.config.js'],
  },
  {
    // グローバル型定義ファイルでは namespace が必要
    files: ['src/types/**/global.ts', 'src/types/**/events.ts', 'src/types/**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
];
