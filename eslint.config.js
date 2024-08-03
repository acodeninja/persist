import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
    {ignores: ['coverage/', 'node_modules/']},
    {languageOptions: {globals: globals.node}},
    pluginJs.configs.recommended,
    {
        rules: {
            'comma-dangle': ['error', 'always-multiline'],
            'default-param-last': ['error'],
            'eol-last': ['error', 'always'],
            'no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            'quote-props': ['error', 'as-needed'],
            semi: ['error', 'always'],
            'sort-imports': ['error', {}],
            quotes: ['error', 'single'],
        },
    },
];
