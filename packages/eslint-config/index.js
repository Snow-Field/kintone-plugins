import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import presetsReactTypescriptPrettier from '@cybozu/eslint-config/flat/presets/react-typescript-prettier.js';
import globals from 'globals';
import kintoneGlobals from '@cybozu/eslint-config/flat/globals/kintone.js';

export default [
  // ESLint公式
  ...eslint.configs.recommended,
  // TypeScript ESLint公式
  ...tseslint.configs.recommended,
  // React公式
  pluginReact.configs.flat.recommended,
  // cybozu公式（React + TS + Prettier + kintone前提）
  ...presetsReactTypescriptPrettier,
  {
    ignores: ['node_modules', 'dist'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...kintoneGlobals,
      },
    },
  },
];
