export default {
    files: [
        '!test/**/*',
        'src/**/*.test.js',
        'exports/**/*.test.js',
        'test/acceptance/**/*.test.js',
    ],
    watchMode: {
        ignoreChanges: [
            'coverage',
            'test/fixtures/minified/*',
        ],
    },
};
