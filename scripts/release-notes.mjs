#!/usr/bin/env node

// Writes the body of the standing next to main release pull request.
//
// A fast-forward promotion leaves no merge commit to describe the release, and
// the version is computed by semantic-release rather than carried in the tree,
// so the commit range is the only account of what is about to be published.
// Grouping it by conventional type is enough to approve against.
//
// The range is read with git rather than passed in, because a commit subject
// containing a backtick or a $() would otherwise run as part of whatever shell
// assembled the arguments.

import {execFileSync} from 'node:child_process';

const RANGE = 'origin/main..origin/next';

const SECTIONS = [
    {heading: 'Features', types: ['feat']},
    {heading: 'Fixes', types: ['fix']},
    {heading: 'Everything else', types: null},
];

const subjects = execFileSync(
    'git',
    ['log', RANGE, '--no-merges', '--pretty=format:%s%x09%an'],
    {encoding: 'utf8'},
);

const changedFiles = execFileSync('git', ['diff', '--stat', RANGE], {encoding: 'utf8'});

const commits = subjects
    .split('\n')
    .filter(Boolean)
    .map((line) => {
        const [subject, author] = line.split('\t');

        return {subject, author, type: /^([a-z]+)(\([^)]*\))?!?:/.exec(subject)?.[1]};
    });

const named = SECTIONS.flatMap(({types}) => types ?? []);

const matching = (types) =>
    commits.filter(({type}) => (types ? types.includes(type) : !named.includes(type)));

const lines = [
    `Promotes ${commits.length} commit${commits.length === 1 ? '' : 's'} from \`next\`.`,
    '',
    'Approving this fast-forwards `main` to `next`, then semantic-release',
    'publishes to the npm `latest` tag. No commit is rewritten, so what ships is',
    'what was tested.',
];

for (const {heading, types} of SECTIONS) {
    const found = matching(types);

    if (found.length === 0) continue;

    lines.push('', `### ${heading}`, '');
    for (const {subject, author} of found) lines.push(`- ${subject} (${author})`);
}

lines.push('', '<details><summary>Changed files</summary>', '', '```');
lines.push(changedFiles.trimEnd(), '```', '</details>');

process.stdout.write(`${lines.join('\n')}\n`);
