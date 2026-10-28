import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import queryPlugin from '@tanstack/eslint-plugin-query'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  ...queryPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // P3-E38 (ADR-020): a calendar date from toISOString() is the UTC date — tomorrow after
      // ~8 pm in Ontario. Use todayInZone / calendarDateOf / addDays from @freshnest/shared.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name=/^(split|slice|substring)$/][callee.object.callee.property.name='toISOString']",
          message: 'toISOString() gives the UTC date. Use todayInZone / calendarDateOf / addDays from @freshnest/shared (ADR-020).',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
])
