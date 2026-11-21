import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['**/node_modules', '**/dist', '**/coverage', '.claude/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  { languageOptions: { globals: globals.node } },
  { files: ['apps/web/**'], languageOptions: { globals: globals.browser } },
  {
    rules: {
      // `_name` marks an intentionally unused variable (e.g. omitting a key when destructuring).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
    },
  },
]);
