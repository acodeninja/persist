/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
    // Remove to resume publishing. Held while the repaired branches and the
    // new promotion flow are proven.
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
        // npm first: publish steps run in order, so a rejected publish stops
        // before a GitHub release announces a version that does not exist.
        '@semantic-release/npm',
        '@semantic-release/github',
    ],
};
