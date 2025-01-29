import {CannotDeleteEngineError, EngineError, MissConfiguredError, NotFoundEngineError} from './StorageEngine.js';
import {CircularManyModel, CircularModel, LinkedManyModel, LinkedModel, MainModel} from '../../../test/fixtures/Models.js';
import {describe, expect, test} from '@jest/globals';
import {Models} from '../../../test/fixtures/ModelCollection.js';
import {NoSuchKey} from '@aws-sdk/client-s3';
import S3StorageEngine from './S3StorageEngine.js';
import stubS3Client from '../../../test/mocks/s3.js';

describe('S3StorageEngine.configure', () => {
    test('S3StorageEngine.configure(undefined) returns a new engine with only default options set', () => {
        const configuredStore = S3StorageEngine.configure();

        expect(configuredStore.configuration).toStrictEqual({});
    });

    test('S3StorageEngine.configure(configuration) returns a new engine without altering the exising one', () => {
        const originalStore = S3StorageEngine;
        const configuredStore = originalStore.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client: stubS3Client(),
        });

        expect(configuredStore.configuration).toStrictEqual(expect.objectContaining({
            bucket: 'test-bucket',
            prefix: 'test',
        }));
        expect(originalStore.configuration).toBeUndefined();
    });
});

describe('S3StorageEngine.get', () => {
    test('S3StorageEngine.get(MainModel, id) when engine is not configured', async () => {
        await expect(() => S3StorageEngine.get(MainModel, 'MainModel/000000000000'))
            .rejects.toThrowError(
                {
                    instanceOf: MissConfiguredError,
                    message: 'StorageEngine is miss-configured',
                },
            );
    });

    test('S3StorageEngine.get(MainModel, id) when id exists', async () => {
        const models = new Models();
        models.createFullTestModel();

        const client = stubS3Client({}, {
            'test-bucket': Object.values(models.models),
        });

        const model = await S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).get(MainModel, 'MainModel/000000000000');

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/MainModel/000000000000.json',
            },
        }));

        expect(model).toBeInstanceOf(MainModel);
        expect(model.validate()).toBe(true);
        expect(model.toData()).toStrictEqual(models.models['MainModel/000000000000'].toData());
    });

    test('S3StorageEngine.get(MainModel, id) when id does not exist', async () => {
        const client = stubS3Client();

        await expect(() => S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).get(MainModel, 'MainModel/000000000000')).rejects.toThrowError({
            instanceOf: NotFoundEngineError,
            message: 'S3StorageEngine.get(MainModel/000000000000) model not found',
        });
    });
});

describe('S3StorageEngine.put', () => {
    test('S3StorageEngine.put(model)', async () => {
        const client = stubS3Client();

        const models = new Models();
        const model = models.createFullTestModel();
        await S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).put(model);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/000000000000.json',
                Body: JSON.stringify(model.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(MainModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index.json',
                Body: JSON.stringify(models.getSearchIndex(MainModel)),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedModel/000000000000.json',
                Body: JSON.stringify(model.linked.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedModel/000000000001.json',
                Body: JSON.stringify(model.requiredLinked.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(LinkedModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedManyModel/000000000000.json',
                Body: JSON.stringify(model.linkedMany[0].toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedManyModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedManyModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(LinkedManyModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularModel/000000000000.json',
                Body: JSON.stringify(model.circular.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(CircularModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularManyModel/000000000000.json',
                Body: JSON.stringify(model.circularMany[0].toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularManyModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularManyModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(CircularManyModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex()),
            },
        }));
    });

    test('S3StorageEngine.put(model) updates existing search indexes', async () => {
        const models = new Models();
        const existingModel = models.createFullTestModel();
        const model = models.createFullTestModel();

        const client = stubS3Client({}, {'test-bucket': [existingModel]});

        await S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).put(model);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/MainModel/_search_index_raw.json',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/MainModel/_search_index.json',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getSearchIndex(MainModel)),
            },
        }));
    });

    test('S3StorageEngine.put(model) updates existing indexes', async () => {
        const client = stubS3Client({
            'test-bucket': {
                'test/MainModel/_index.json': {
                    'MainModel/111111111111': {
                        id: 'MainModel/111111111111',
                        string: 'String',
                    },
                },
                'test/_index.json': {
                    'MainModel/111111111111': {
                        id: 'MainModel/111111111111',
                        string: 'String',
                    },
                },
            },
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).put(model);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(
                    MainModel,
                    {
                        'MainModel/111111111111': {
                            id: 'MainModel/111111111111',
                            string: 'String',
                        },
                    },
                )),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(LinkedModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedManyModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedManyModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(LinkedManyModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(CircularModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularManyModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularManyModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(CircularManyModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(
                    undefined,
                    {
                        'MainModel/111111111111': {
                            id: 'MainModel/111111111111',
                            string: 'String',
                        },
                    },
                )),
            },
        }));
    });

    test('S3StorageEngine.put(model) when the engine fails to put a compiled search index', async () => {
        const client = stubS3Client({
            'test-bucket': {
                'MainModel/_index.json': {
                    'MainModel/111111111111': {
                        id: 'MainModel/111111111111',
                        string: 'String',
                    },
                },
            },
        });

        client.send.mockImplementation(command => {
            if (command.input.Key.endsWith('_search_index.json')) {
                return Promise.reject(new Error());
            }
            return Promise.resolve();
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await expect(() => S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put s3://test-bucket/test/MainModel/_search_index.json',
        });

        expect(client.send).toHaveBeenCalledTimes(4);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/000000000000.json',
                Body: JSON.stringify(model.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index.json',
                Body: JSON.stringify(models.getSearchIndex(MainModel)),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));
    });

    test('S3StorageEngine.put(model) when the engine fails to put a raw search index', async () => {
        const client = stubS3Client({
            'test-bucket': {
                'MainModel/_index.json': {
                    'MainModel/111111111111': {
                        id: 'MainModel/111111111111',
                        string: 'String',
                    },
                },
            },
        });

        client.send.mockImplementation(command => {
            if (command.input.Key.endsWith('_search_index_raw.json')) {
                return Promise.reject(new Error());
            }
            return Promise.resolve();
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await expect(() => S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put s3://test-bucket/test/MainModel/_search_index_raw.json',
        });

        expect(client.send).toHaveBeenCalledTimes(3);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/000000000000.json',
                Body: JSON.stringify(model.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));
    });

    test('S3StorageEngine.put(model) when putting an index fails', async () => {
        const client = stubS3Client({
            'test-bucket': {
                'MainModel/_index.json': {
                    'MainModel/111111111111': {
                        id: 'MainModel/111111111111',
                        string: 'String',
                    },
                },
            },
        });

        client.send.mockImplementation(command => {
            if (command.input.Key.endsWith('/_index.json')) {
                return Promise.reject(new Error());
            }
            return Promise.resolve();
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await expect(() => S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put s3://test-bucket/test/MainModel/_index.json',
        });

        expect(client.send).toHaveBeenCalledTimes(12);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/000000000000.json',
                Body: JSON.stringify(model.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_index.json',
                Bucket: 'test-bucket',
                ContentType: 'application/json',
                Body: JSON.stringify(models.getIndex(MainModel)),
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index.json',
                Body: JSON.stringify(models.getSearchIndex(MainModel)),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedModel/000000000000.json',
                Body: JSON.stringify(model.linked.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: `test/${model.requiredLinked.id}.json`,
                Body: JSON.stringify(model.requiredLinked.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedManyModel/000000000000.json',
                Body: JSON.stringify(model.linkedMany[0].toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularModel/000000000000.json',
                Body: JSON.stringify(model.circular.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularRequiredModel/000000000000.json',
                Body: JSON.stringify(model.circularRequired.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/CircularManyModel/000000000000.json',
                Body: JSON.stringify(model.circularMany[0].toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));
    });

    test('S3StorageEngine.put(model) when the initial model put fails', async () => {
        const client = stubS3Client({
            'test-bucket': {
                'MainModel/_index.json': {
                    'MainModel/111111111111': {
                        id: 'MainModel/111111111111',
                        string: 'String',
                    },
                },
            },
        });
        const models = new Models();
        const model = models.createFullTestModel();

        client.send.mockImplementation(command => {
            if (command.input.Key.endsWith('MainModel/000000000000.json')) {
                return Promise.reject(new Error());
            }
            return Promise.resolve();
        });

        await expect(() => S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put s3://test-bucket/test/MainModel/000000000000.json',
        });

        expect(client.send).toHaveBeenCalledTimes(1);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/000000000000.json',
                Body: JSON.stringify(model.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));
    });

    test('S3StorageEngine.put(model) when the engine fails to put a linked model', async () => {
        const client = stubS3Client({
            'test-bucket': {
                'MainModel/_index.json': {
                    'MainModel/111111111111': {
                        id: 'MainModel/111111111111',
                        string: 'String',
                    },
                },
            },
        });
        const models = new Models();
        const model = models.createFullTestModel();

        client.send.mockImplementation(command => {
            if (command.input.Key.endsWith('LinkedModel/000000000000.json')) {
                return Promise.reject(new Error());
            }
            return Promise.resolve();
        });

        await expect(() => S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put s3://test-bucket/test/LinkedModel/000000000000.json',
        });

        expect(client.send).toHaveBeenCalledTimes(5);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/000000000000.json',
                Body: JSON.stringify(model.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index_raw.json',
                Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_search_index.json',
                Body: JSON.stringify(models.getSearchIndex(MainModel)),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/LinkedModel/000000000000.json',
                Body: JSON.stringify(model.linked.toData()),
                Bucket: 'test-bucket',
                ContentType: 'application/json',
            },
        }));
    });
});

describe('S3StorageEngine.find', () => {
    test('S3StorageEngine.find(MainModel, {string: "test"}) when a matching model exists', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const client = stubS3Client({}, {
            'test-bucket': Object.values(models.models),
        });

        const found = await S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).find(MainModel, {string: 'test'});

        expect(found).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('S3StorageEngine.find(MainModel, {string: "test"}) when a matching model does not exist', async () => {
        const client = stubS3Client({'test-bucket': {'MainModel/_index.json': {}}});

        const models = await S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).find(MainModel, {string: 'test'});

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Key: 'test/MainModel/_index.json',
                Bucket: 'test-bucket',
            },
        }));

        expect(models).toEqual([]);
    });

    test('S3StorageEngine.find(MainModel, {string: "test"}) when no index exists', async () => {
        const client = stubS3Client();

        const models = await S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).find(MainModel, {string: 'test'});

        expect(models).toEqual([]);
    });
});

describe('S3StorageEngine.search', () => {
    test('S3StorageEngine.search(MainModel, "test") when matching models exist', async () => {
        const models = new Models();
        const model1 = models.createFullTestModel();
        const model2 = models.createFullTestModel();

        model2.string = 'moving tests';

        const client = stubS3Client({}, {
            'test-bucket': Object.values(models.models),
        });

        const configuration = {
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        };

        const found = await S3StorageEngine.configure(configuration).search(MainModel, 'test');

        expect(found).toStrictEqual([
            expect.objectContaining({
                ref: 'MainModel/000000000000',
                score: 0.666,
                model: expect.objectContaining(model1.toData(false)),
            }),
            expect.objectContaining({
                ref: 'MainModel/000000000001',
                score: 0.506,
                model: expect.objectContaining(model2.toData(false)),
            }),
        ]);
    });

    test('S3StorageEngine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async () => {
        const models = new Models();
        models.createFullTestModel();
        models.createFullTestModel();

        const client = stubS3Client({}, {
            'test-bucket': Object.values(models.models),
        });

        const configuration = {
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        };

        const found = await S3StorageEngine.configure(configuration).search(MainModel, 'not-even-close-to-a-match');

        expect(found).toEqual([]);
    });

    test('S3StorageEngine.search(MainModel, "test") when no search index exists for the model', async () => {
        const client = stubS3Client({}, {});

        const configuration = {
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        };

        await expect(() => S3StorageEngine.configure(configuration).search(MainModel, 'test'))
            .rejects.toThrowError({
                instanceOf: EngineError,
                message: 'The model MainModel does not have a search index available.',
            });
    });
});

describe('S3StorageEngine.hydrate', () => {
    test('S3StorageEngine.hydrate(model)', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const dryModel = new MainModel();
        dryModel.id = 'MainModel/000000000000';

        const client = stubS3Client({}, {'test-bucket': Object.values(models.models)});

        const hydratedModel = await S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).hydrate(dryModel);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/MainModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/CircularRequiredModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/CircularModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/LinkedModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/LinkedModel/000000000001.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/LinkedManyModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/MainModel/000000000000.json',
            },
        }));

        expect(client.send).toHaveBeenCalledTimes(7);
        expect(hydratedModel).toEqual(model);
    });
});

describe('S3StorageEngine.delete', () => {
    test('S3StorageEngine.delete(model)', async () => {
        const models = new Models();
        const modelToBeDeleted = models.createFullTestModel();

        const client = stubS3Client({}, {'test-bucket': Object.values(models.models)});

        await S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).delete(modelToBeDeleted);

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/MainModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/CircularModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/CircularRequiredModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/LinkedModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/LinkedModel/000000000001.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/LinkedManyModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/CircularManyModel/000000000000.json',
            },
        }));

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/CircularManyModel/000000000000.json',
            },
        }));

        expect(client.send).toHaveBeenCalledTimes(32);

        expect(
            Object.keys(client.resolvedBuckets['test-bucket']).includes('MainModel/000000000000.json'),
        ).toBeFalsy();
    });

    test('S3StorageEngine.delete(model) when DeleteObjectsCommand throws an error', async () => {
        const models = new Models();
        const modelToBeDeleted = models.createFullTestModel();

        const client = stubS3Client({}, {'test-bucket': Object.values(models.models)});
        const patchedClient = stubS3Client({}, {'test-bucket': Object.values(models.models)});

        patchedClient.send.mockImplementation(command => {
            if (command?.constructor?.name === 'DeleteObjectCommand') {
                return Promise.reject(new NoSuchKey({message: `${command.input.Key} does not exist`}));
            }
            return client.send(command);
        });

        await expect(() => S3StorageEngine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client: patchedClient,
        }).delete(modelToBeDeleted)).rejects.toThrowError({
            instanceOf: CannotDeleteEngineError,
            message: 'S3StorageEngine.delete(MainModel/000000000000) model cannot be deleted',
        });

        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/MainModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/CircularRequiredModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/CircularModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/LinkedModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/LinkedModel/000000000001.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/LinkedManyModel/000000000000.json',
            },
        }));
        expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/CircularManyModel/000000000000.json',
            },
        }));

        expect(patchedClient.send).toHaveBeenCalledWith(expect.objectContaining({
            input: {
                Bucket: 'test-bucket',
                Key: 'test/MainModel/000000000000.json',
            },
        }));

        expect(client.send).toHaveBeenCalledTimes(10);
        expect(patchedClient.send).toHaveBeenCalledTimes(11);

        expect(
            Object.keys(patchedClient.resolvedBuckets['test-bucket']).includes('MainModel/000000000000.json'),
        ).toBeTruthy();
    });
});
