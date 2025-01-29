/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
    branches: [
        'main',
        {name: 'next', prerelease: true},
    ],
    plugins: [
        [
            '@semantic-release/commit-analyzer',
            {
                preset: 'conventionalcommits',
                parserOpts: {
                    noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
                },
            },
        ],
        '@semantic-release/release-notes-generator',
        '@semantic-release/github',
        '@semantic-release/npm',
    ],
};
