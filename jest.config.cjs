/** @type {import('jest').Config} */
const config = {
    collectCoverage: true,
    coveragePathIgnorePatterns: ['test/fixtures/minified/'],
    collectCoverageFrom: [
        '**/*.js',
        '!{node_modules,coverage,exports}/**',
        '!*.config.js',
    ],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    testMatch: ['**/*.test.js'],
    watchPathIgnorePatterns: ['coverage/', 'test/fixtures/minified'],
};

module.exports = config;
