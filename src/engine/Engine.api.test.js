import {MissConfiguredError, NotFoundEngineError} from './Engine.js';
import FileEngine from './FileEngine.js';
import HTTPEngine from './HTTPEngine.js';
import {MainModel} from '../../test/fixtures/Models.js';
import {Models} from '../../test/fixtures/ModelCollection.js';
import S3Engine from './S3Engine.js';
import stubFetch from '../../test/mocks/fetch.js';
import stubFs from '../../test/mocks/fs.js';
import stubS3Client from '../../test/mocks/s3.js';
import test from 'ava';

const models = new Models();
const model = models.createFullTestModel();

const engines = [
    {
        engine: S3Engine,
        configuration: () => ({
            bucket: 'test-bucket',
            prefix: 'test',
            client: stubS3Client({}, {'test-bucket': Object.values(models.models)}),
        }),
        configurationIgnores: ['client'],
    },
    {
        engine: FileEngine,
        configuration: () => ({
            path: '/tmp/fileEngine',
            filesystem: stubFs({}, Object.values(models.models)),
        }),
        configurationIgnores: ['filesystem'],
    },
    {
        engine: HTTPEngine,
        configuration: () => {
            const fetch = stubFetch({}, Object.values(models.models));

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
            () =>  engine.get(MainModel, 'MainModel/000000000000'),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.get(MainModel, id) returns a model when one exists`, async t => {
        const store = engine.configure(configuration());

        const got = await store.get(MainModel, 'MainModel/000000000000');

        t.deepEqual(got, MainModel.fromData({
            ...model.toData(),
            date: new Date(model.date),
            requiredDate: new Date(model.requiredDate),
            arrayOfDate: [new Date(model.arrayOfDate[0])],
            requiredArrayOfDate: [new Date(model.requiredArrayOfDate[0])],
        }));
    });

    test(`${engine.toString()}.get(MainModel, id) throws NotFoundEngineError when no model exists`, async t => {
        const store = engine.configure(configuration());

        const error = await t.throwsAsync(
            () =>  store.get(MainModel, 'MainModel/999999999999'),
            {
                instanceOf: NotFoundEngineError,
            },
        );

        t.is(error.message, `${engine.toString()}.get(MainModel/999999999999) model not found`);
    });

    test(`${engine.toString()}.put(model) throws MissConfiguredError when engine is not configured`, async t => {
        const error = await t.throwsAsync(
            () =>  engine.put(MainModel, {string: 'string'}),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.put(model) puts a new model`, async t => {
        const store = engine.configure(configuration());
        const response = await store.put(MainModel.fromData({...model.toData(), id: 'MainModel/111111111111'}));

        t.assert(response === undefined);
    });

    test(`${engine.toString()}.find(MainModel, parameters) throws MissConfiguredError when engine is not configured`, async t => {
        const error = await t.throwsAsync(
            () =>  engine.find(MainModel, {string: 'string'}),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.find(MainModel, parameters) returns an array of matching models`, async t => {
        const store = engine.configure(configuration());

        const found = await store.find(MainModel, {string: 'test'});

        t.deepEqual(found, [MainModel.fromData(model.toIndexData())]);
    });

    test(`${engine.toString()}.search(MainModel, 'string') throws MissConfiguredError when engine is not configured`, async t => {
        const error = await t.throwsAsync(
            () =>  engine.search(MainModel, 'string'),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.search(MainModel, 'test') returns an array of matching models`, async t => {
        const store = engine.configure(configuration());

        const found = await store.search(MainModel, 'test');

        t.like(found, [{
            model: MainModel.fromData(model.toData(false)),
            ref: 'MainModel/000000000000',
            score: 0.364,
        }]);
    });

    test(`${engine.toString()}.hydrate(model) throws MissConfiguredError when engine is not configured`, async t => {
        const error = await t.throwsAsync(
            () =>  engine.hydrate(new Models().createFullTestModel().toData()),
            {
                instanceOf: MissConfiguredError,
            },
        );

        t.is(error.message, 'Engine is miss-configured');
    });

    test(`${engine.toString()}.hydrate(model) returns a hydrated model when the input model comes from ${engine.toString()}.find(MainModel, parameters)`, async t => {
        const store = engine.configure(configuration());

        const [found] = await store.find(MainModel, {string: 'test'});

        const hydrated = await store.hydrate(found);

        t.is(hydrated.linked.string, 'test');
    });

    test(`${engine.toString()}.hydrate(model) returns a hydrated model when the input model comes from ${engine.toString()}.search(MainModel, 'test')`, async t => {
        const store = engine.configure(configuration());

        const [found] = await store.search(MainModel, 'test');

        const hydrated = await store.hydrate(found.model);

        t.is(hydrated.linked.string, 'test');
    });
}
