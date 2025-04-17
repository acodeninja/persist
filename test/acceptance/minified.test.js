import {dirname, resolve} from 'node:path';
import {expect, test} from '@jest/globals';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const run = (command, ...args) =>
    new Promise((done, failed) => {
        const execution = spawn(command, args, {
            cwd: resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures/minified'),
            env: process.env,
            shell: true,
        });

        const output = [];

        execution.stdout.on('data', (data) => {
            output.push(`stdout: ${data}`);
        });

        execution.stderr.on('data', (data) => {
            output.push(`stderr: ${data}`);
        });

        execution.on('close', (_) => {
            done();
        });

        execution.on('error', (error) => {
            console.error(output.join('\n'));
            failed(error);
        });
    });

test('model and type names are not mangled when minified', async () => {
    await run('npm', 'i');
    await run('npm', 'run', 'webpack');

    const {getModel} = await import('../fixtures/minified/main.bundle.js');
    const model = getModel();

    expect(model.toString()).toBe('TestModel');
    expect(model.string.toString()).toBe('String');
}, 30 * 1000);
