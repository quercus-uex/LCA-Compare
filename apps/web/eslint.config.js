import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import { defineConfig, globalIgnores } from 'eslint/config'

// Clases de DaisyUI que ya cubre la librería de components/ui: fuera de ella se usa su componente
// (Button, Badge, Field/Input, Card, Tabs, Dialog…). Catálogo en /dev/ui
const UI_CLASS_PATTERN = String.raw`(?:^|\s)(?:[\w-]+:)*(?:btn|badge|input|select(?!-(?:none|text|all|auto)(?:\s|$))|textarea|toggle|checkbox|alert|card|tabs?|menu|modal|join|loading|skeleton|dropdown)(?:-[\w-]+)?(?:\s|$)`
const UI_CLASS_MESSAGE = 'Usa el componente de components/ui en lugar de la clase de DaisyUI (catálogo en /dev/ui).'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      'react-refresh/only-export-components': 'off',
      'jsx-a11y/label-has-associated-control': ['error', {
        controlComponents: ['IdLookupField'],
        assert: 'either',
      }],
      'no-restricted-syntax': ['error',
        { selector: `JSXAttribute[name.name="className"] Literal[value=/${UI_CLASS_PATTERN}/]`, message: UI_CLASS_MESSAGE },
        { selector: `JSXAttribute[name.name="className"] TemplateElement[value.raw=/${UI_CLASS_PATTERN}/]`, message: UI_CLASS_MESSAGE },
      ],
      'import/order': ['warn', {
        'newlines-between': 'never',
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
    },
  },
  {
    // La librería es la única que pinta las clases de DaisyUI que envuelve
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['*.config.{ts,js}', '*.config.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },
])