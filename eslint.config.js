import eslint from '@eslint/js';
import configPrettier from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import globals from 'globals';
import typescriptEslint, {
  configs as typescriptEslintConfigs,
  parser as typescriptEslintParser,
} from 'typescript-eslint';

export default typescriptEslint.config(
  {
    ignores: ['dist/', '.rollup.cache/'],
  },
  eslint.configs.recommended,
  typescriptEslintConfigs.recommendedTypeChecked,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  configPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        parser: typescriptEslintParser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{ts,js,mjs}'],
    extends: [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      pluginImport.flatConfigs.recommended,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      pluginImport.flatConfigs.typescript,
    ],
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          extensions: ['.mjs', '.js', '.ts', '.d.ts'],
        },
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          prefer: 'type-imports',
        },
      ],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
        },
      ],
      'import/no-extraneous-dependencies': 'off',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    name: 'test',
    files: ['**/*.test.ts'],
    rules: {
      'func-names': 'off',
    },
  },
);
