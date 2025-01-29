import {
    CannotDeleteEngineError,
    EngineError,
    MissConfiguredError,
    NotFoundEngineError,
} from './StorageEngine.js';
import {
    CircularManyModel,
    CircularModel,
    LinkedManyModel,
    LinkedModel,
    MainModel,
} from '../../../test/fixtures/Models.js';
import {describe, expect, test} from '@jest/globals';
import HTTPStorageEngine from './HTTPStorageEngine.js';
import {Models} from '../../../test/fixtures/ModelCollection.js';
import stubFetch from '../../../test/mocks/fetch.js';

describe('HTTPStorageEngine.configure', () => {
    test('HTTPStorageEngine.configure(undefined) returns a new engine with only fetch options set', () => {
        const configuredStore = HTTPStorageEngine.configure();

        expect(configuredStore.configuration).toStrictEqual({
            fetchOptions: {
                headers: {
                    Accept: 'application/json',
                },
            },
        });
    });

    test('HTTPStorageEngine.configure(configuration) returns a new engine without altering the exising one', () => {
        const fetch = stubFetch();
        const originalStore = HTTPStorageEngine;
        const configuredStore = originalStore.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        });

        expect(originalStore.configuration).toBe(undefined);
        expect(configuredStore.configuration).toStrictEqual({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
            fetchOptions: {
                headers: {
                    Accept: 'application/json',
                },
            },
        });
    });

    test('HTTPStorageEngine.configure(configuration) with additional headers returns a new engine with the headers', () => {
        const fetch = stubFetch();
        const originalStore = HTTPStorageEngine;
        const configuredStore = originalStore.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetchOptions: {
                headers: {Authorization: 'Bearer some-bearer-token-for-authentication'},
            },
            fetch,
        });

        expect(originalStore.configuration).toBe(undefined);
        expect(configuredStore._getReadOptions()).toStrictEqual({
            headers: {
                Authorization: 'Bearer some-bearer-token-for-authentication',
                Accept: 'application/json',
            },
        });
        expect(configuredStore._getWriteOptions()).toStrictEqual({
            headers: {
                Authorization: 'Bearer some-bearer-token-for-authentication',
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
        });
    });
});

describe('HTTPStorageEngine.get', () => {

    test('HTTPStorageEngine.get(MainModel, id) when engine is not configured', async () => {
        await expect(() => HTTPStorageEngine.get(MainModel, 'MainModel/000000000000'))
            .rejects.toThrow({
                instanceOf: MissConfiguredError,
                message: 'StorageEngine is miss-configured',
            });
    });

    test('HTTPStorageEngine.get(MainModel, id) when id exists', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        const got = await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).get(MainModel, 'MainModel/000000000000');

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});

        expect(got instanceof MainModel).toBe(true);
        expect(got.validate()).toBe(true);
        expect(got.toData()).toStrictEqual(model.toData());
    });

    test('HTTPStorageEngine.get(MainModel, id) when id does not exist', async () => {
        const models = new Models();
        models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        await expect(() => HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).get(MainModel, 'MainModel/999999999999')).rejects.toThrowError(
            {
                instanceOf: NotFoundEngineError,
                message: 'HTTPStorageEngine.get(MainModel/999999999999) model not found',
            },
        );

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/999999999999.json'), {headers: {Accept: 'application/json'}});
    });
});

describe('HTTPStorageEngine.put', () => {

    test('HTTPStorageEngine.put(model)', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).put(model);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(MainModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getRawSearchIndex(MainModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getSearchIndex(MainModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.linked.toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/000000000001.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.requiredLinked.toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(LinkedModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedManyModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.linkedMany[0].toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedManyModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedManyModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(LinkedManyModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.circular.toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(CircularModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularManyModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.circularMany[0].toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularManyModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularManyModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(CircularManyModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex()),
        });
    });

    test('HTTPStorageEngine.put(model) when the engine fails to put a compiled search index', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        fetch.mockImplementation((url) => {
            if (url.pathname.endsWith('/_search_index.json')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.reject(new Error()),
                });
            }

            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            });
        });

        await expect(() => HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put https://example.com/test/MainModel/_search_index.json',
        });

        expect(fetch).toHaveBeenCalledTimes(4);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getRawSearchIndex(MainModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getSearchIndex(MainModel)),
        });
    });

    test('HTTPStorageEngine.put(model) when the engine fails to put a raw search index', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        fetch.mockImplementation((url) => {
            if (url.pathname.endsWith('/_search_index_raw.json')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.reject(new Error()),
                });
            }

            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            });
        });

        await expect(() => HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put https://example.com/test/MainModel/_search_index_raw.json',
        });

        expect(fetch).toHaveBeenCalledTimes(3);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getRawSearchIndex(MainModel)),
        });
    });

    test('HTTPStorageEngine.put(model) when putting an index fails', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        fetch.mockImplementation((url) => {
            if (url.pathname.endsWith('/_index.json')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.reject(new Error()),
                });
            }

            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            });
        });

        await expect(() => HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put https://example.com/test/MainModel/_index.json',
        });

        expect(fetch).toHaveBeenCalledTimes(12);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(MainModel)),
        });
    });

    test('HTTPStorageEngine.put(model) when the initial model put fails', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        fetch.mockImplementation((url) => {
            if (url.pathname.endsWith('MainModel/000000000000.json')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.reject(new Error()),
                });
            }

            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            });
        });

        await expect(() => HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put https://example.com/test/MainModel/000000000000.json',
        });

        expect(fetch).toHaveBeenCalledTimes(1);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.toData()),
        });
    });

    test('HTTPStorageEngine.put(model) when the engine fails to put a linked model', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        fetch.mockImplementation((url) => {
            if (url.pathname.endsWith('LinkedModel/000000000000.json')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.reject(new Error()),
                });
            }

            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            });
        });

        await expect(() => HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put https://example.com/test/LinkedModel/000000000000.json',
        });

        expect(fetch).toHaveBeenCalledTimes(5);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.toData()),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getRawSearchIndex(MainModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getSearchIndex(MainModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/000000000000.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(model.linked.toData()),
        });
    });

    test('HTTPStorageEngine.put(model) updates existing search indexes', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({
            'MainModel/_search_index_raw.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        }, Object.values(models.models));

        await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).put(model);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getRawSearchIndex(MainModel, {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            })),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getSearchIndex(MainModel, {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            })),
        });
    });

    test('HTTPStorageEngine.put(model) updates existing indexes', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({
            'MainModel/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        }, Object.values(models.models));

        await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).put(model);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(MainModel, {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            })),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(LinkedModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedManyModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedManyModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(LinkedManyModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(CircularModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularManyModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularManyModel/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex(CircularManyModel)),
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/_index.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/_index.json'), {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(models.getIndex()),
        });
    });
});

describe('HTTPStorageEngine.find', () => {
    test('HTTPStorageEngine.find(MainModel, {string: "test"}) when a matching model exists', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        const found = await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).find(MainModel, {string: 'test'});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(found).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('HTTPStorageEngine.find(MainModel, {string: "not-even-close-to-a-match"}) when a matching model does not exist', async () => {
        const models = new Models();
        models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        const found = await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).find(MainModel, {string: 'not-even-close-to-a-match'});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(found).toEqual([]);
    });

    test('HTTPStorageEngine.find(MainModel, {string: "test"}) when no search index exists', async () => {
        const fetch = stubFetch({}, []);

        const models = await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).find(MainModel, {string: 'String'});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

        expect(models).toEqual([]);
    });
});

describe('HTTPStorageEngine.search', () => {
    test('HTTPStorageEngine.search(MainModel, "test") when a matching model exists', async () => {
        const models = new Models();
        const model1 = models.createFullTestModel();
        const model2 = models.createFullTestModel();

        model2.string = 'moving tests';

        const fetch = stubFetch({}, Object.values(models.models));

        const found = await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).search(MainModel, 'test');

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000001.json'), {headers: {Accept: 'application/json'}});

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

    test('HTTPStorageEngine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async () => {
        const models = new Models();
        models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        const found = await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).search(MainModel, 'not-even-close-to-a-match');

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index.json'), {headers: {Accept: 'application/json'}});

        expect(found).toEqual([]);
    });

    test('HTTPStorageEngine.search(MainModel, "tes") when no index exists for the model', async () => {
        const fetch = stubFetch({}, []);

        await expect(() => HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).search(MainModel, 'tes')).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'The model MainModel does not have a search index available.',
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/_search_index.json'), {headers: {Accept: 'application/json'}});
    });
});

describe('HTTPStorageEngine.hydrate', () => {
    test('HTTPStorageEngine.hydrate(model)', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        const dryModel = new MainModel();
        dryModel.id = 'MainModel/000000000000';

        const hydratedModel = await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).hydrate(dryModel);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularRequiredModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/000000000001.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledTimes(7);

        expect(hydratedModel).toEqual(model);
    });
});

describe('HTTPStorageEngine.delete', () => {

    test('HTTPStorageEngine.delete(model)', async () => {
        const models = new Models();
        const modelToBeDeleted = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));

        await HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch,
        }).delete(modelToBeDeleted);

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularRequiredModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/000000000001.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularRequiredModel/000000000000.json'), {
            headers: {Accept: 'application/json'},
            method: 'DELETE',
        });
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {
            headers: {Accept: 'application/json'},
            method: 'DELETE',
        });

        expect(fetch).toHaveBeenCalledTimes(32);

        expect(Object.keys(fetch.resolvedFiles).includes('MainModel/000000000000.json')).toBeFalsy();
    });

    test('HTTPStorageEngine.delete(model) when fetch(method=DELETE) throws an error', async () => {
        const models = new Models();
        const modelToBeDeleted = models.createFullTestModel();

        const fetch = stubFetch({}, Object.values(models.models));
        const patchedFetch = stubFetch({}, Object.values(models.models));
        patchedFetch.mockImplementation((url, opts) => {
            if (opts.method === 'DELETE') {
                return Promise.reject(new Error('fetch failed'));
            }
            return fetch(url, opts);
        });

        await expect(() => HTTPStorageEngine.configure({
            host: 'https://example.com',
            prefix: 'test',
            fetch: patchedFetch,
        }).delete(modelToBeDeleted)).rejects.toThrowError({
            instanceOf: CannotDeleteEngineError,
            message: 'HTTPStorageEngine.delete(MainModel/000000000000) model cannot be deleted',
        });

        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularRequiredModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedModel/000000000001.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/LinkedManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});
        expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/test/CircularManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});

        expect(patchedFetch).toHaveBeenCalledWith(new URL('https://example.com/test/MainModel/000000000000.json'), {
            headers: {Accept: 'application/json'},
            method: 'DELETE',
        });

        expect(fetch).toHaveBeenCalledTimes(10);
        expect(patchedFetch).toHaveBeenCalledTimes(11);

        expect(Object.keys(fetch.resolvedFiles).includes('MainModel/000000000000.json')).toBeFalsy();
    });
});
