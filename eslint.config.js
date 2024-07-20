import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
    {ignores: ['coverage/', 'node_modules/']},
    {languageOptions: {globals: globals.node}},
    pluginJs.configs.recommended,
    {
        rules: {
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'quote-props': ['error', 'as-needed'],
            quotes: ['error', 'single']
        }
    }
];
