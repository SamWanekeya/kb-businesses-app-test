import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
    js.configs.recommended,

    ...tseslint.configs.strictTypeChecked,

    jsxA11y.flatConfigs.recommended,

    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],

    {
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
            },
        },

        settings: {
            react: {
                version: '19.2.6',
            },
        },

        plugins: {
            'react-hooks': reactHooks,
            import: importPlugin,
        },

        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@/utils',
                            message:
                                'Barrel imports are not allowed. Import directly from the file instead.',
                        },
                        {
                            name: '@/components',
                            message:
                                'Barrel imports are not allowed. Import directly from the file instead.',
                        },
                        {
                            name: '@/hooks',
                            message:
                                'Barrel imports are not allowed. Import directly from the file instead.',
                        },
                    ],
                    patterns: [
                        {
                            group: [
                                '@/utils/**/index',
                                '@components/**/index',
                                '@/hooks/**/index',
                            ],
                            message:
                                'Barrel imports are not allowed. Import directly from the file instead.',
                        },
                    ],
                },
            ],
            'import/no-cycle': 'error',
            'import/no-self-import': 'error',
            'import/no-useless-path-segments': 'warn',
        },
    },

    {
        ignores: ['vendor/**', 'node_modules/**', 'public/static/**', 'bootstrap/ssr/**', '*.config.{js,ts}'],
    },
];
