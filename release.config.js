/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
    // Temporary, and the whole point of it is that it must be removed: main was
    // rewritten to undo a rebase-merge, and nothing should reach npm until the
    // repaired branches and the new promotion flow have been seen to work.
    dryRun: true,
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
