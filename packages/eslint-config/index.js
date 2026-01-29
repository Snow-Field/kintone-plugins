import presetsReactTypescriptPrettier from '@cybozu/eslint-config/flat/presets/react-typescript-prettier.js';
import globals from 'globals';
import kintoneGlobals from '@cybozu/eslint-config/flat/globals/kintone.js';

export default [
  {
    ignores: ['node_modules', 'dist'],
  },
  ...presetsReactTypescriptPrettier,
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
