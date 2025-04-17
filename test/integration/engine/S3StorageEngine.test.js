import {
    LinkedManyModelWithIndexFactory,
    LinkedModelWithSearchIndexFactory,
    SimpleModel,
    SimpleModelWithSearchIndex,
    SimpleModelWithSearchIndexFactory,
} from '../../fixtures/Model.js';
import {beforeAll, describe, expect, test} from '@jest/globals';
import {ModelNotFoundStorageEngineError} from '../../../src/engine/storage/StorageEngine.js';
import {NoSuchBucket} from '@aws-sdk/client-s3';
import S3StorageEngine from '../../../src/engine/storage/S3StorageEngine';
import stubS3Client from '../../mocks/s3.js';

function EngineFactory(models = null) {
    const model = LinkedManyModelWithIndexFactory();
    const searchIndexModel = SimpleModelWithSearchIndexFactory();
    const client = stubS3Client({
        's3-bucket': models ?? [
            model,
            LinkedModelWithSearchIndexFactory(),
            searchIndexModel,
        ],
    });
    const engine = new S3StorageEngine({
        bucket: 's3-bucket',
        prefix: 'files',
        client,
    });

    return {engine, model, client, searchIndexModel};
}

describe('S3StorageEngine integration with aws-sdk', () => {
    describe('.getModel()', () => {
        describe('when a model exists', () => {
            const {engine, model, client} = EngineFactory();

            test('the engine returns the model', async () => {
                expect(await engine.getModel(model.id)).toStrictEqual(model.toData());
            });

            test('the engine calls client.send with GetObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: `files/${model.id}.json`,
                    },
                }));
            });
        });

        describe('when a model does not exist', () => {
            const {engine, client} = EngineFactory();

            test('it should throw a ModelNotFoundStorageEngineError', async () => {
                await expect(engine.getModel('NotAModel/000000000000')).rejects.toThrow({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: 'The model NotAModel/000000000000 was not found',
                });
            });

            test('the engine calls client.send with GetObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: 'files/NotAModel/000000000000.json',
                    },
                }));
            });
        });

        describe('when a bucket does not exist', () => {
            const {engine, model, client} = EngineFactory();
            engine.configuration.bucket = 'not-a-bucket';

            test('it should throw a NoSuchBucket error', async () => {
                await expect(engine.getModel(model.id)).rejects.toThrow(NoSuchBucket);
            });

            test('the engine calls client.send with GetObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 'not-a-bucket',
                        Key: `files/${model.id}.json`,
                    },
                }));
            });
        });
    });

    describe('.putModel()', () => {
        const {engine, client} = EngineFactory();
        const model = SimpleModelWithSearchIndexFactory();

        beforeAll(() => engine.putModel(model.toData()));

        test('the engine calls client.send with PutObjectCommand', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `files/${model.id}.json`,
                    Body: JSON.stringify(model.toData()),
                    ContentType: 'application/json',
                },
            }));
        });
    });

    describe('.deleteModel()', () => {
        describe('when a model exists', () => {
            const {engine, model, client} = EngineFactory();

            beforeAll(() => engine.deleteModel(model.id));

            test('the engine calls client.send with DeleteObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: `files/${model.id}.json`,
                    },
                }));
            });
        });

        describe('when a model does not exist', () => {
            const {engine, client} = EngineFactory();

            test('it should throw a ModelNotFoundStorageEngineError', async () => {
                await expect(engine.deleteModel('NotAModel/000000000000')).rejects.toThrow({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: 'The model NotAModel/000000000000 was not found',
                });
            });

            test('the engine calls client.send with DeleteObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: 'files/NotAModel/000000000000.json',
                    },
                }));
            });
        });
    });

    describe('.getIndex()', () => {
        describe('when models exist', () => {
            const {engine, model, client} = EngineFactory();

            test('the engine returns the model index', async () => {
                expect(await engine.getIndex(model.constructor)).toStrictEqual({
                    [model.id]: model.toIndexData(),
                });
            });

            test('the engine calls client.send with GetObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: `files/${model.constructor}/_index.json`,
                    },
                }));
            });
        });

        describe('when models do not exist', () => {
            const {engine, client} = EngineFactory();

            test('the engine returns an empty model index', async () => {
                expect(await engine.getIndex(SimpleModel)).toStrictEqual({});
            });

            test('the engine calls client.send with DeleteObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: 'files/SimpleModel/_index.json',
                    },
                }));
            });
        });
    });

    describe('.putIndex()', () => {
        describe('when no models exist', () => {
            const {engine, client} = EngineFactory([]);
            const model = SimpleModelWithSearchIndexFactory();

            beforeAll(() => engine.putIndex(model.constructor, {
                [model.id]: model.toIndexData(),
            }));

            test('the engine calls client.send with GetObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: `files/${model.constructor}/_index.json`,
                        Body: JSON.stringify({[model.id]: model.toIndexData()}),
                        ContentType: 'application/json',
                    },
                }));
            });

            test('the model index is then accessible', async () => {
                expect(await engine.getIndex(model.constructor)).toStrictEqual({
                    [model.id]: model.toIndexData(),
                });
            });
        });
    });

    describe('.getSearchIndex()', () => {
        describe('when models exist', () => {
            const model = SimpleModelWithSearchIndexFactory();
            const {engine, client} = EngineFactory([model]);

            test('the engine returns the model search index', async () => {
                expect(await engine.getSearchIndex(model.constructor)).toStrictEqual({
                    [model.id]: model.toSearchData(),
                });
            });

            test('the engine calls client.send with GetObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: `files/${model.constructor}/_search_index.json`,
                    },
                }));
            });
        });

        describe('when models do not exist', () => {
            const {engine, client} = EngineFactory([]);

            test('the engine returns an empty model search index', async () => {
                expect(await engine.getSearchIndex(SimpleModelWithSearchIndex)).toStrictEqual({});
            });

            test('the engine calls client.send with DeleteObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: 'files/SimpleModelWithSearchIndex/_search_index.json',
                    },
                }));
            });
        });

        describe('when search index does not exist', () => {
            const {engine, client} = EngineFactory();

            test('the engine returns an empty model search index', async () => {
                expect(await engine.getSearchIndex(SimpleModel)).toStrictEqual({});
            });

            test('the engine calls client.send with DeleteObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: 'files/SimpleModel/_search_index.json',
                    },
                }));
            });
        });
    });

    describe('.putSearchIndex()', () => {
        describe('when no models exist', () => {
            const {engine, client} = EngineFactory([]);
            const model = SimpleModelWithSearchIndexFactory();

            beforeAll(() => engine.putSearchIndex(model.constructor, {
                [model.id]: model.toSearchData(),
            }));

            test('the engine calls client.send with GetObjectCommand', () => {
                expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: 's3-bucket',
                        Key: `files/${model.constructor}/_search_index.json`,
                        Body: JSON.stringify({[model.id]: model.toSearchData()}),
                        ContentType: 'application/json',
                    },
                }));
            });

            test('the model index is then accessible', async () => {
                expect(await engine.getSearchIndex(model.constructor)).toStrictEqual({
                    [model.id]: model.toSearchData(),
                });
            });
        });
    });
});
