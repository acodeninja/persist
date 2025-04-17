import HTTPStorageEngine, {HTTPRequestFailedError} from './HTTPStorageEngine.js';
import {MisconfiguredStorageEngineError, ModelNotFoundStorageEngineError} from './StorageEngine.js';
import {SimpleModelFactory, SimpleModelWithSearchIndexFactory} from '../../../test/fixtures/Model.js';
import {beforeAll, describe, expect, jest, test} from '@jest/globals';

describe('new HTTPStorageEngine', () => {
    describe('when no configuration is provided', () => {
        test('throws a misconfigured error', () => {
            expect(() => new HTTPStorageEngine({}, [])).toThrow({
                instanceOf: MisconfiguredStorageEngineError,
                message: 'Incorrect configuration given for storage engine HTTPStorageEngine: both baseURL and fetch must be provided',
            });
        });
    });

    describe('when required configuration is provided', () => {
        test('throws a misconfigured error', () => {
            expect(() => new HTTPStorageEngine({
                baseURL: 'https://example.com',
                fetch,
            }, [])).not.toThrow();
        });
    });
});

describe('HTTPStorageEngine.getModel()', () => {
    describe('when a model exists', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.json(model.toData()));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('returns an object with the model data', async () => {
            expect(await engine.getModel(model.id)).toEqual(model.toData());
        });

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.id}`),
                {headers: {Accept: 'application/json'}},
            );
        });
    });

    describe('when a model does not exist', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(new Response(undefined, {status: 404}));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('throws ModelNotFoundStorageEngineError', async () => {
            await expect(() => engine.getModel(model.id)).rejects.toThrow({
                instanceOf: ModelNotFoundStorageEngineError,
                message: `The model ${model.id} was not found`,
            });
        });

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.id}`),
                {headers: {Accept: 'application/json'}},
            );
        });
    });

    describe('when an unknown error is thrown', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.error());
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('throws the error', async () => {
            await expect(() => engine.getModel(model.id)).rejects.toThrow({
                instanceOf: HTTPRequestFailedError,
                message: `Failed to get https://example.com/${model.id}`,
            });
        });

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.id}`),
                {headers: {Accept: 'application/json'}},
            );
        });
    });
});

describe('HTTPStorageEngine.putModel()', () => {
    describe('when no error occurs', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.json({}, {status: 201}));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        beforeAll(() => engine.putModel(model.toData()));

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.id}`),
                {
                    body: JSON.stringify(model.toData()),
                    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                    method: 'PUT',
                },
            );
        });
    });

    describe('when an error occurs', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.error());
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('throws the error', async () => {
            await expect(() => engine.putModel(model.toData())).rejects.toThrow({
                instanceOf: HTTPRequestFailedError,
                message: `Failed to put https://example.com/${model.id}`,
            });
        });

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.id}`),
                {
                    body: JSON.stringify(model.toData()),
                    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                    method: 'PUT',
                },
            );
        });
    });
});

describe('HTTPStorageEngine.deleteModel()', () => {
    describe('when no error occurs', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(new Response(JSON.stringify({}), {status: 200}));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        beforeAll(() => engine.deleteModel(model.id));

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.id}`),
                {headers: {Accept: 'application/json'}, method: 'DELETE'},
            );
        });
    });

    describe('when a model does not exist', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(new Response(undefined, {status: 404}));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('throws ModelNotFoundStorageEngineError', async () => {
            await expect(() => engine.deleteModel(model.id)).rejects.toThrow({
                instanceOf: ModelNotFoundStorageEngineError,
                message: `The model ${model.id} was not found`,
            });
        });

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.id}`),
                {headers: {Accept: 'application/json'}, method: 'DELETE'},
            );
        });
    });

    describe('when an unknown error occurs', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.error());
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('throws the received error', async () => {
            await expect(() => engine.deleteModel(model.id)).rejects.toThrow({
                instanceOf: HTTPRequestFailedError,
                message: `Failed to delete https://example.com/${model.id}`,
            });
        });

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.id}`),
                {headers: {Accept: 'application/json'}, method: 'DELETE'});
        });
    });
});

describe('HTTPStorageEngine.getIndex()', () => {
    describe('when an index exists', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.json({
            [model.id]: model.toIndexData(),
        }));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('returns an object with the index data', async () => {
            expect(await engine.getIndex(model.constructor)).toEqual({
                [model.id]: model.toIndexData(),
            });
        });

        test('calls fetch with the model constructor', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL('https://example.com/SimpleModel/_index.json'),
                {headers: {Accept: 'application/json'}},
            );
        });
    });

    describe('when an index does not exist', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(new Response(undefined, {status: 404}));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('returns an empty index', async () => {
            expect(await engine.getIndex(model.constructor)).toEqual({});
        });

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL('https://example.com/SimpleModel/_index.json'),
                {headers: {Accept: 'application/json'}},
            );
        });
    });
});

describe('HTTPStorageEngine.putIndex()', () => {
    describe('when no error occurs', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.json({}, {status: 201}));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        beforeAll(() => engine.putIndex(model.constructor, {[model.id]: model.toIndexData()}));

        test('calls fetch with the model constructor', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.constructor.name}/_index`),
                {
                    body: JSON.stringify({[model.id]: model.toIndexData()}),
                    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                    method: 'PUT',
                },
            );
        });
    });

    describe('when an error occurs', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.error());
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('throws the error', async () => {
            await expect(() =>
                engine.putIndex(model.constructor, {[model.id]: model.toIndexData()}),
            ).rejects.toThrow({
                instanceOf: HTTPRequestFailedError,
                message: 'Failed to put https://example.com/SimpleModel',
            });
        });

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.constructor.name}/_index`),
                {
                    body: JSON.stringify({[model.id]: model.toIndexData()}),
                    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                    method: 'PUT',
                },
            );
        });
    });
});

describe('HTTPStorageEngine.getSearchIndex()', () => {
    describe('when an index exists', () => {
        const model = SimpleModelWithSearchIndexFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.json({
            [model.id]: model.toSearchData(),
        }));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('returns the model\'s search index', async () => {
            expect(await engine.getSearchIndex(model.constructor)).toEqual({
                [model.id]: model.toSearchData(),
            });
        });

        test('calls fetch with the model constructor', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.constructor.name}/_search_index`),
                {headers: {Accept: 'application/json'}},
            );
        });
    });

    describe('when an index does not exist', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.error());
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('returns an empty index', async () => {
            expect(await engine.getSearchIndex(model.constructor)).toEqual({});
        });

        test('calls fetch with the model constructor', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.constructor.name}/_search_index`),
                {headers: {Accept: 'application/json'}},
            );
        });
    });
});

describe('HTTPStorageEngine.putSearchIndex()', () => {
    describe('when no error occurs', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.json({}));
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        beforeAll(() => engine.putSearchIndex(model.constructor, {[model.id]: model.toIndexData()}));

        test('calls fetch with the model constructor', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.constructor.name}/_search_index`),
                {
                    body: JSON.stringify({[model.id]: model.toSearchData()}),
                    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                    method: 'PUT',
                },
            );
        });
    });

    describe('when an error occurs', () => {
        const model = SimpleModelFactory();
        const fetch = jest.fn();
        fetch.mockResolvedValue(Response.error());
        const engine = new HTTPStorageEngine({
            baseURL: 'https://example.com',
            fetch,
        }, []);

        test('throws the error', async () => {
            await expect(() =>
                engine.putSearchIndex(model.constructor, {[model.id]: model.toSearchData()}),
            ).rejects.toThrow({
                instanceOf: HTTPRequestFailedError,
                message: `Failed to put https://example.com/${model.constructor.name}/search`,
            });
        });

        test('calls fetch with the model id', () => {
            expect(fetch).toHaveBeenCalledWith(
                new URL(`https://example.com/${model.constructor.name}/search`),
                {
                    body: JSON.stringify({[model.id]: model.toSearchData()}),
                    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                    method: 'PUT',
                },
            );
        });
    });
});
