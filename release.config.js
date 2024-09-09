/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
    branches: ['main'],
    plugins: [
        [
            '@semantic-release/commit-analyzer',
            {
              preset: 'conventionalcommits',
            },
        ],
        '@semantic-release/release-notes-generator',
        '@semantic-release/github',
        '@semantic-release/npm',
    ],
};
