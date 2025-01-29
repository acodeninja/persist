import {MissConfiguredError, NotFoundEngineError} from './StorageEngine.js';
import {describe, expect, test} from '@jest/globals';
import FileStorageEngine from './FileStorageEngine.js';
import HTTPStorageEngine from './HTTPStorageEngine.js';
import {MainModel} from '../../../test/fixtures/Models.js';
import {Models} from '../../../test/fixtures/ModelCollection.js';
import S3StorageEngine from './S3StorageEngine.js';
import stubFetch from '../../../test/mocks/fetch.js';
import stubFs from '../../../test/mocks/fs.js';
import stubS3Client from '../../../test/mocks/s3.js';

const models = new Models();
const model = models.createFullTestModel();

const engines = [
    {
        engine: S3StorageEngine,
        configuration: () => ({
            bucket: 'test-bucket',
            prefix: 'test',
            client: stubS3Client({}, {'test-bucket': Object.values(models.models)}),
        }),
        configurationIgnores: ['client'],
    },
    {
        engine: FileStorageEngine,
        configuration: () => ({
            path: '/tmp/fileEngine',
            filesystem: stubFs({}, Object.values(models.models)),
        }),
        configurationIgnores: ['filesystem'],
    },
    {
        engine: HTTPStorageEngine,
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

describe.each(
    engines.map(({
                     engine,
                     configuration,
                     configurationIgnores,
                 }) => [engine, configuration, configurationIgnores]),
)('%s API', (engine, configuration, configurationIgnores) => {
    test(`${engine}.configure(options) returns a new engine without altering the exising one`, () => {
        const originalStore = engine;
        const configuredStore = originalStore.configure(configuration());

        const checkConfiguration = {...configuration()};

        if (configurationIgnores) {
            for (const ignored of configurationIgnores) {
                delete checkConfiguration[ignored];
            }
        }

        expect(configuredStore.configuration).toStrictEqual(expect.objectContaining(checkConfiguration));
        expect(originalStore.configuration).toBeUndefined();
    });

    test(`${engine}.get(MainModel, id) throws MissConfiguredError when engine is not configured`, async () => {
        await expect(() => engine.get(MainModel, 'MainModel/000000000000'))
            .rejects.toThrowError({
                instanceOf: MissConfiguredError,
                message: 'StorageEngine is miss-configured',
            });
    });

    test(`${engine}.get(MainModel, id) returns a model when one exists`, async () => {
        const store = engine.configure(configuration());

        const got = await store.get(MainModel, 'MainModel/000000000000');

        expect(got).toEqual(MainModel.fromData({
            ...model.toData(),
            date: new Date(model.date),
            requiredDate: new Date(model.requiredDate),
            arrayOfDate: [new Date(model.arrayOfDate[0])],
            requiredArrayOfDate: [new Date(model.requiredArrayOfDate[0])],
        }));
    });

    test(`${engine}.get(MainModel, id) throws NotFoundEngineError when no model exists`, async () => {
        const store = engine.configure(configuration());

        await expect(() => store.get(MainModel, 'MainModel/999999999999'))
            .rejects.toThrowError(
                {
                    instanceOf: NotFoundEngineError,
                    message: `${engine}.get(MainModel/999999999999) model not found`,
                },
            );
    });

    test(`${engine}.put(model) throws MissConfiguredError when engine is not configured`, async () => {
        await expect(() => engine.put(MainModel, {string: 'string'}))
            .rejects.toThrowError(
                {
                    instanceOf: MissConfiguredError,
                    message: 'StorageEngine is miss-configured',
                },
            );
    });

    test(`${engine}.put(model) puts a new model`, async () => {
        const store = engine.configure(configuration());
        const response = await store.put(MainModel.fromData({
            ...model.toData(),
            id: 'MainModel/111111111111',
        }));

        expect(response).toBeUndefined();
    });

    test(`${engine}.find(MainModel, parameters) throws MissConfiguredError when engine is not configured`, async () => {
        await expect(() => engine.find(MainModel, {string: 'string'}))
            .rejects.toThrowError(
                {
                    instanceOf: MissConfiguredError,
                    message: 'StorageEngine is miss-configured',
                },
            );
    });

    test(`${engine}.find(MainModel, parameters) returns an array of matching models`, async () => {
        const store = engine.configure(configuration());

        const found = await store.find(MainModel, {string: 'test'});

        expect(found).toEqual([MainModel.fromData(model.toIndexData())]);
    });

    test(`${engine}.search(MainModel, 'string') throws MissConfiguredError when engine is not configured`, async () => {
        await expect(() => engine.search(MainModel, 'string'))
            .rejects.toThrowError(
                {
                    instanceOf: MissConfiguredError,
                    message: 'StorageEngine is miss-configured',
                },
            );
    });

    test(`${engine}.search(MainModel, 'test') returns an array of matching models`, async () => {
        const store = engine.configure(configuration());

        const found = await store.search(MainModel, 'test');

        expect(found).toStrictEqual([
            expect.objectContaining({
                model: MainModel.fromData(model.toData(false)),
                ref: 'MainModel/000000000000',
                score: 0.364,
            }),
        ]);
    });

    test(`${engine}.hydrate(model) throws MissConfiguredError when engine is not configured`, async () => {
        await expect(() => engine.hydrate(new Models().createFullTestModel().toData()))
            .rejects.toThrowError(
                {
                    instanceOf: MissConfiguredError,
                    message: 'StorageEngine is miss-configured',
                },
            );
    });

    test(`${engine}.hydrate(model) returns a hydrated model when the input model comes from ${engine}.find(MainModel, parameters)`, async () => {
        const store = engine.configure(configuration());

        const [found] = await store.find(MainModel, {string: 'test'});

        const hydrated = await store.hydrate(found);

        expect(hydrated.linked.string).toBe('test');
    });

    test(`${engine}.hydrate(model) returns a hydrated model when the input model comes from ${engine}.search(MainModel, 'test')`, async () => {
        const store = engine.configure(configuration());

        const [found] = await store.search(MainModel, 'test');

        const hydrated = await store.hydrate(found.model);

        expect(hydrated.linked.string).toBe('test');
    });
});
