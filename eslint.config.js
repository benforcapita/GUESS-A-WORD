import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly',
        document: 'readonly',
        requestAnimationFrame: 'readonly',
        sessionStorage: 'readonly',
        innerWidth: 'readonly',
        process: 'readonly',
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      eqeqeq: 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  // Core ESLint does not count JSX tag references as variable usage.
  {
    files: ['**/*.jsx'],
    rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z]' }] },
  },
];
