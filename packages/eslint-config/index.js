import kintoneGlobalConfig from '@cybozu/eslint-config/flat/globals/kintone.js';
import presetsReactTypescriptPrettier from '@cybozu/eslint-config/flat/presets/react-typescript-prettier.js';

export default [
  ...presetsReactTypescriptPrettier,
  {
    ignores: ['node_modules', 'lib', 'dist', '*.config.ts', '*.config.js'],
  },
  {
    languageOptions: {
      globals: kintoneGlobalConfig,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
];
