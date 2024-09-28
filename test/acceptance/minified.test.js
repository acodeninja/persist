import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import test from 'ava';

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

test('model and type names are not mangled when minified', async t => {
    t.timeout(30 * 1000);

    await run('npm', 'i');
    await run('npm', 'run', 'webpack');

    const {getModel} = await import('../fixtures/minified/main.bundle.js');
    const model = getModel();

    t.is(model.name, 'MainModel');

    t.is(model.custom.name, 'Custom');

    t.is(model.string.name, 'String');
    t.is(model.stringSlug.name, 'SlugOf(string)');
    t.is(model.requiredString.name, 'RequiredString');
    t.is(model.arrayOfString.name, 'ArrayOf(String)');
    t.is(model.requiredArrayOfString.name, 'RequiredArrayOf(String)');

    t.is(model.boolean.name, 'Boolean');
    t.is(model.requiredBoolean.name, 'RequiredBoolean');
    t.is(model.arrayOfBoolean.name, 'ArrayOf(Boolean)');
    t.is(model.requiredArrayOfBoolean.name, 'RequiredArrayOf(Boolean)');

    t.is(model.number.name, 'Number');
    t.is(model.requiredNumber.name, 'RequiredNumber');
    t.is(model.arrayOfNumber.name, 'ArrayOf(Number)');
    t.is(model.requiredArrayOfNumber.name, 'RequiredArrayOf(Number)');

    t.is(model.date.name, 'Date');
    t.is(model.requiredDate.name, 'RequiredDate');
    t.is(model.arrayOfDate.name, 'ArrayOf(Date)');
    t.is(model.requiredArrayOfDate.name, 'RequiredArrayOf(Date)');

    t.is(model.linked.name, 'LinkedModel');
    t.is(model.linkedMany.name, 'ArrayOf(LinkedManyModel)');

    t.is(model.circular.name, 'CircularModel');
    t.is(model.circularMany.name, 'ArrayOf(CircularManyModel)');
});
