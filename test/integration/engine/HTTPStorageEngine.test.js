import {
    LinkedManyModelWithIndexFactory,
    LinkedModelWithSearchIndexFactory,
    SimpleModel,
    SimpleModelWithSearchIndex,
    SimpleModelWithSearchIndexFactory,
} from '../../fixtures/Model.js';
import {beforeAll, describe, expect, test} from '@jest/globals';
import HTTPStorageEngine from '../../../src/engine/storage/HTTPStorageEngine.js';
import {ModelNotFoundStorageEngineError} from '../../../src/engine/storage/StorageEngine.js';
import stubFetch from '../../mocks/fetch.js';

function EngineFactory(models = null) {
    const model = LinkedManyModelWithIndexFactory();
    const searchIndexModel = SimpleModelWithSearchIndexFactory();
    const fetch = stubFetch(models ?? [
        model,
        LinkedModelWithSearchIndexFactory(),
        searchIndexModel,
    ]);
    const engine = new HTTPStorageEngine({
        baseURL: 'https://example.com',
        prefix: 'api',
        fetch,
    });

    return {engine, model, fetch, searchIndexModel};
}

describe('HTTPStorageEngine integration with aws-sdk', () => {
    describe('.getModel()', () => {
        describe('when a model exists', () => {
            const {engine, model, fetch} = EngineFactory();

            test('the engine returns the model', async () => {
                expect(await engine.getModel(model.id)).toStrictEqual(model.toData());
            });

            test('the engine calls fetch with the model id', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL(`https://example.com/api/${model.id}`),
                    {headers: {Accept: 'application/json'}},
                );
            });
        });

        describe('when a model does not exist', () => {
            const {engine, fetch} = EngineFactory();

            test('it should throw a ModelNotFoundStorageEngineError', async () => {
                await expect(engine.getModel('NotAModel/000000000000')).rejects.toThrow({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: 'The model NotAModel/000000000000 was not found',
                });
            });

            test('the engine calls fetch with the model id', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL('https://example.com/api/NotAModel/000000000000'),
                    {headers: {Accept: 'application/json'}},
                );
            });
        });
    });

    describe('.putModel()', () => {
        const {engine, fetch} = EngineFactory();
        const model = SimpleModelWithSearchIndexFactory();

        beforeAll(() => engine.putModel(model.toData()));

        test('the engine calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/api/${model.id}`),
                {
                    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                    method: 'PUT',
                    body: JSON.stringify(model.toData()),
                },
            );
        });
    });

    describe('.deleteModel()', () => {
        describe('when a model exists', () => {
            const {engine, model, fetch} = EngineFactory();

            beforeAll(() => engine.deleteModel(model.id));

            test('the engine calls fetch with the model id', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL(`https://example.com/api/${model.id}`),
                    {
                        headers: {Accept: 'application/json'},
                        method: 'DELETE',
                    },
                );
            });
        });

        describe('when a model does not exist', () => {
            const {engine, fetch} = EngineFactory();

            test('it should throw a ModelNotFoundStorageEngineError', async () => {
                await expect(engine.deleteModel('NotAModel/000000000000')).rejects.toThrow({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: 'The model NotAModel/000000000000 was not found',
                });
            });

            test('the engine calls fetch with the model id', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL('https://example.com/api/NotAModel/000000000000'),
                    {
                        headers: {Accept: 'application/json'},
                        method: 'DELETE',
                    },
                );
            });
        });
    });

    describe('.getIndex()', () => {
        describe('when models exist', () => {
            const {engine, model, fetch} = EngineFactory();

            test('the engine returns the model index', async () => {
                expect(await engine.getIndex(model.constructor)).toStrictEqual({
                    [model.id]: model.toIndexData(),
                });
            });

            test('the engine calls fetch with the model constructor', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL(`https://example.com/api/${model.constructor.name}`),
                    {headers: {Accept: 'application/json'}},
                );
            });
        });

        describe('when models do not exist', () => {
            const {engine, fetch} = EngineFactory();

            test('the engine returns an empty model index', async () => {
                expect(await engine.getIndex(SimpleModel)).toStrictEqual({});
            });

            test('the engine calls fetch with DeleteObjectCommand', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL(`https://example.com/api/${SimpleModel}`),
                    {headers: {Accept: 'application/json'}},
                );
            });
        });
    });

    describe('.putIndex()', () => {
        describe('when no models exist', () => {
            const {engine, fetch} = EngineFactory([]);
            const model = SimpleModelWithSearchIndexFactory();

            beforeAll(() => engine.putIndex(model.constructor, {
                [model.id]: model.toIndexData(),
            }));

            test('the engine calls fetch with the model constructor', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL(`https://example.com/api/${model.constructor.name}`),
                    {
                        headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                        method: 'PUT',
                        body: JSON.stringify({[model.id]: model.toIndexData()}),
                    },
                );
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
            const {engine, fetch} = EngineFactory([model]);

            test('the engine returns the model search index', async () => {
                expect(await engine.getSearchIndex(model.constructor)).toStrictEqual({
                    [model.id]: model.toSearchData(),
                });
            });

            test('the engine calls fetch with the model constructor', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL(`https://example.com/api/${SimpleModel}/search`),
                    {headers: {Accept: 'application/json'}},
                );
            });
        });

        describe('when models do not exist', () => {
            const {engine, fetch} = EngineFactory([]);

            test('the engine returns an empty model search index', async () => {
                expect(await engine.getSearchIndex(SimpleModelWithSearchIndex)).toStrictEqual({});
            });

            test('the engine calls fetch with the model constructor', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL(`https://example.com/api/${SimpleModel}/search`),
                    {headers: {Accept: 'application/json'}},
                );
            });
        });

        describe('when search index does not exist', () => {
            const {engine, fetch} = EngineFactory();

            test('the engine returns an empty model search index', async () => {
                expect(await engine.getSearchIndex(SimpleModel)).toStrictEqual({});
            });

            test('the engine calls fetch with the model constructor', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL(`https://example.com/api/${SimpleModel}/search`),
                    {headers: {Accept: 'application/json'}},
                );
            });
        });
    });

    describe('.putSearchIndex()', () => {
        describe('when no models exist', () => {
            const {engine, fetch} = EngineFactory([]);
            const model = SimpleModelWithSearchIndexFactory();

            beforeAll(() => engine.putSearchIndex(model.constructor, {
                [model.id]: model.toSearchData(),
            }));

            test('the engine calls fetch with the model constructor', () => {
                expect(fetch).toHaveBeenCalledWith(
                    new URL(`https://example.com/api/${SimpleModel}/search`),
                    {
                        headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                        method: 'PUT',
                        body: JSON.stringify({[model.id]: model.toSearchData()}),
                    },
                );
            });

            test('the model index is then accessible', async () => {
                expect(await engine.getSearchIndex(model.constructor)).toStrictEqual({
                    [model.id]: model.toSearchData(),
                });
            });
        });
    });
});
