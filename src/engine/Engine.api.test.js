import {MainModel, getTestModelInstance, valid} from '../../test/fixtures/TestModel.js';
import {MissConfiguredError, NotFoundEngineError} from './Engine.js';
import FileEngine from './FileEngine.js';
import HTTPEngine from './HTTPEngine.js';
import S3Engine from './S3Engine.js';
import stubFetch from '../../test/mocks/fetch.js';
import stubFs from '../../test/mocks/fs.js';
import stubS3Client from '../../test/mocks/s3.js';
import test from 'ava';

const model = getTestModelInstance(valid);
const engines = [
    {
        engine: S3Engine,
        configuration: () => ({
            bucket: 'test-bucket',
            prefix: 'test',
            client: stubS3Client({}, {'test-bucket': [model]}),
        }),
        configurationIgnores: ['client'],
    },
    {
        engine: FileEngine,
        configuration: () => ({
            path: '/tmp/fileEngine',
            filesystem: stubFs({}, [model]),
        }),
        configurationIgnores: ['filesystem'],
    },
    {
        engine: HTTPEngine,
        configuration: () => {
            const fetch = stubFetch({}, [getTestModelInstance(valid)]);

            return ({
                host: 'https://example.com',
                prefix: 'test',
                fetch,
            });
        },
        configurationIgnores: ['fetch'],
    },
];

for (const {engine, configuration, configurationIgnores} of engines) {
    test(`${engine.toString()}.configure(options) returns a new engine without altering the exising one`, t => {
        const originalStore = engine;
        const configuredStore = originalStore.configure(configuration());

        const checkConfiguration = {...configuration()};

        if (configurationIgnores) {
            for (const ignored of configurationIgnores) {
                delete checkConfiguration[ignored];
            }
        }

        t.like(configuredStore.configuration, checkConfiguration);
        t.assert(originalStore.configuration === undefined);
    });

    test(`${engine.toString()}.get(MainModel, id) throws MissConfiguredError when engine is not configured`, async t => {
        const error = await t.throwsAsync(
            async () => await engine.get(MainModel, 'MainModel/000000000000'),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.get(MainModel, id) returns a model when one exists`, async t => {
        const store = engine.configure(configuration());

        const got = await store.get(MainModel, 'MainModel/000000000000');

        t.like(got, {
            ...getTestModelInstance(valid).toData(),
            date: new Date(valid.date),
            requiredDate: new Date(valid.requiredDate),
            arrayOfDate: [new Date(valid.arrayOfDate[0])],
            requiredArrayOfDate: [new Date(valid.requiredArrayOfDate[0])],
        });
    });

    test(`${engine.toString()}.get(MainModel, id) throws NotFoundEngineError when no model exists`, async t => {
        const store = engine.configure(configuration());

        const error = await t.throwsAsync(
            async () => await store.get(MainModel, 'MainModel/999999999999'),
            {
                instanceOf: NotFoundEngineError,
            },
        );

        t.is(error.message, `${engine.toString()}.get(MainModel/999999999999) model not found`);
    });

    test(`${engine.toString()}.put(model) throws MissConfiguredError when engine is not configured`, async t => {
        const error = await t.throwsAsync(
            async () => await engine.put(MainModel, {string: 'string'}),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.put(model) puts a new model`, async t => {
        const store = engine.configure(configuration());
        const response = await store.put(getTestModelInstance({...valid, id: 'MainModel/111111111111'}));

        t.is(response, undefined);
    });

    test(`${engine.toString()}.find(MainModel, parameters) throws MissConfiguredError when engine is not configured`, async t => {
        const error = await t.throwsAsync(
            async () => await engine.find(MainModel, {string: 'string'}),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.find(MainModel, parameters) returns an array of matching models`, async t => {
        const store = engine.configure(configuration());

        const found = await store.find(MainModel, {string: 'String'});

        t.like(found, [{
            id: 'MainModel/000000000000',
            string: 'String',
        }]);
    });

    test(`${engine.toString()}.search(MainModel, 'string') throws MissConfiguredError when engine is not configured`, async t => {
        const error = await t.throwsAsync(
            async () => await engine.search(MainModel, 'string'),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.search(MainModel, 'Str') returns an array of matching models`, async t => {
        const store = engine.configure(configuration());

        const found = await store.search(MainModel, 'Str');

        t.like(found, [{
            model: {
                id: 'MainModel/000000000000',
                string: 'String',
                number: 24.3,
                boolean: false,
            },
        }]);
    });

    test(`${engine.toString()}.hydrate(model) throws MissConfiguredError when engine is not configured`, async t => {
        const error = await t.throwsAsync(
            async () => await engine.hydrate(getTestModelInstance().toData()),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.hydrate(model) returns a hydrated model when the input model comes from ${engine.toString()}.find(MainModel, parameters)`, async t => {
        const store = engine.configure(configuration());

        const [found] = await store.find(MainModel, {string: 'String'});

        const hydrated = await store.hydrate(found);

        t.is(hydrated.linked.string, 'test');
    });

    test(`${engine.toString()}.hydrate(model) returns a hydrated model when the input model comes from ${engine.toString()}.search(MainModel, 'Str')`, async t => {
        const store = engine.configure(configuration());

        const [found] = await store.search(MainModel, 'Str');

        const hydrated = await store.hydrate(found.model);

        t.is(hydrated.linked.string, 'test');
    });
}
