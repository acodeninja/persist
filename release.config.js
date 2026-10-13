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
        // npm first: publish steps run in order, so a registry that rejects the
        // publish stops the run before a GitHub release announces the version.
        // The git tag is created by semantic-release itself, ahead of both.
        '@semantic-release/npm',
        '@semantic-release/github',
    ],
};
