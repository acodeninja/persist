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

    expect(model.name).toBe('MainModel');

    expect(model.custom.name).toBe('Custom');

    expect(model.string.name).toBe('String');
    expect(model.stringSlug.name).toBe('SlugOf(string)');
    expect(model.requiredString.name).toBe('RequiredString');
    expect(model.arrayOfString.name).toBe('ArrayOf(String)');
    expect(model.requiredArrayOfString.name).toBe('RequiredArrayOf(String)');

    expect(model.boolean.name).toBe('Boolean');
    expect(model.requiredBoolean.name).toBe('RequiredBoolean');
    expect(model.arrayOfBoolean.name).toBe('ArrayOf(Boolean)');
    expect(model.requiredArrayOfBoolean.name).toBe('RequiredArrayOf(Boolean)');

    expect(model.number.name).toBe('Number');
    expect(model.requiredNumber.name).toBe('RequiredNumber');
    expect(model.arrayOfNumber.name).toBe('ArrayOf(Number)');
    expect(model.requiredArrayOfNumber.name).toBe('RequiredArrayOf(Number)');

    expect(model.date.name).toBe('Date');
    expect(model.requiredDate.name).toBe('RequiredDate');
    expect(model.arrayOfDate.name).toBe('ArrayOf(Date)');
    expect(model.requiredArrayOfDate.name).toBe('RequiredArrayOf(Date)');

    expect(model.linked.name).toBe('LinkedModel');
    expect(model.linkedMany.name).toBe('ArrayOf(LinkedManyModel)');

    expect(model.circular.name).toBe('CircularModel');
    expect(model.circularMany.name).toBe('ArrayOf(CircularManyModel)');
}, 30 * 1000);
