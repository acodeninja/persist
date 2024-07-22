/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
    branches: ['main'],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/github',
            {
                draftRelease: true,
            },
        ],
        [
            '@semantic-release/npm',
            {
                npmPublish: false,
            },
        ],
    ]
};