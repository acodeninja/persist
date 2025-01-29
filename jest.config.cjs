/** @type {import('jest').Config} */
const config = {
    coveragePathIgnorePatterns: [
        'test/fixtures',
        'node_modules',
        'test/mocks',
    ],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    testMatch: [
        '**/*.test.js',
    ],
    watchPathIgnorePatterns: [
        'coverage/',
        'test/fixtures/minified',
    ],
};

module.exports = config;
