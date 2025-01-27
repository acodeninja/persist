import {CannotDeleteEngineError, EngineError, MissConfiguredError, NotFoundEngineError} from './Engine.js';
import {CircularManyModel, CircularModel, LinkedManyModel, LinkedModel, MainModel} from '../../test/fixtures/Models.js';
import HTTPEngine from './HTTPEngine.js';
import {Models} from '../../test/fixtures/ModelCollection.js';
import assertions from '../../test/assertions.js';
import stubFetch from '../../test/mocks/fetch.js';
import test from 'ava';

test('HTTPEngine.configure(configuration) returns a new engine without altering the exising one', t => {
    const fetch = stubFetch();
    const originalStore = HTTPEngine;
    const configuredStore = originalStore.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    });

    t.like(configuredStore.configuration, {
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    });
    t.assert(originalStore.configuration === undefined);
});

test('HTTPEngine.configure(configuration) with additional headers returns a new engine with the headers', t => {
    const fetch = stubFetch();
    const originalStore = HTTPEngine;
    const configuredStore = originalStore.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetchOptions: {
            headers: {Authorization: 'Bearer some-bearer-token-for-authentication'},
        },
        fetch,
    });

    t.assert(originalStore.configuration === undefined);
    t.like(configuredStore._getReadOptions(), {
        headers: {
            Authorization: 'Bearer some-bearer-token-for-authentication',
            Accept: 'application/json',
        },
    });
    t.like(configuredStore._getWriteOptions(), {
        headers: {
            Authorization: 'Bearer some-bearer-token-for-authentication',
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });
});

test('HTTPEngine.get(MainModel, id) when engine is not configured', async t => {
    const error = await t.throwsAsync(
        () =>  HTTPEngine.get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: MissConfiguredError,
        },
    );

    t.is(error.message, 'Engine is miss-configured');
});

test('HTTPEngine.get(MainModel, id) when id exists', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    const got = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).get(MainModel, 'MainModel/000000000000');

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});

    t.true(got instanceof MainModel);
    t.true(got.validate());
    t.like(got.toData(), model.toData());
});

test('HTTPEngine.get(MainModel, id) when id does not exist', async t => {
    const models = new Models();
    models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    await t.throwsAsync(
        () =>
            HTTPEngine.configure({
                host: 'https://example.com',
                prefix: 'test',
                fetch,
            }).get(MainModel, 'MainModel/999999999999'),
        {
            instanceOf: NotFoundEngineError,
            message: 'HTTPEngine.get(MainModel/999999999999) model not found',
        },
    );

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/999999999999.json'), {headers: {Accept: 'application/json'}});
});

test('HTTPEngine.put(model)', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).put(model);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(MainModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getRawSearchIndex(MainModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getSearchIndex(MainModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.linked.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000001.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.requiredLinked.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(LinkedModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.linkedMany[0].toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(LinkedManyModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.circular.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(CircularModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.circularMany[0].toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(CircularManyModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex()),
    });
});

test('HTTPEngine.put(model) when the engine fails to put a compiled search index', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    fetch.callsFake((url) => {
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

    await t.throwsAsync(() => HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put https://example.com/test/MainModel/_search_index.json',
    });

    t.is(fetch.getCalls().length, 4);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getRawSearchIndex(MainModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getSearchIndex(MainModel)),
    });
});

test('HTTPEngine.put(model) when the engine fails to put a raw search index', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    fetch.callsFake((url) => {
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

    await t.throwsAsync(() => HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put https://example.com/test/MainModel/_search_index_raw.json',
    });

    t.is(fetch.getCalls().length, 3);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getRawSearchIndex(MainModel)),
    });
});

test('HTTPEngine.put(model) when putting an index fails', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    fetch.callsFake((url) => {
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

    await t.throwsAsync(() => HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put https://example.com/test/MainModel/_index.json',
    });

    t.is(fetch.getCalls().length, 12);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(MainModel)),
    });
});

test('HTTPEngine.put(model) when the initial model put fails', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    fetch.callsFake((url) => {
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

    await t.throwsAsync(() => HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put https://example.com/test/MainModel/000000000000.json',
    });

    t.is(fetch.getCalls().length, 1);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.toData()),
    });
});

test('HTTPEngine.put(model) when the engine fails to put a linked model', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    fetch.callsFake((url) => {
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

    await t.throwsAsync(() => HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put https://example.com/test/LinkedModel/000000000000.json',
    });

    t.is(fetch.getCalls().length, 5);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getRawSearchIndex(MainModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getSearchIndex(MainModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.linked.toData()),
    });
});

test('HTTPEngine.put(model) updates existing search indexes', async t => {
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

    await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).put(model);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
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

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {
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

test('HTTPEngine.put(model) updates existing indexes', async t => {
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

    await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).put(model);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {
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

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(LinkedModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(LinkedManyModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(CircularModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex(CircularManyModel)),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(models.getIndex()),
    });
});

test('HTTPEngine.find(MainModel, {string: "test"}) when a matching model exists', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    const found = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).find(MainModel, {string: 'test'});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

    t.like(found, [model.toIndexData()]);
});

test('HTTPEngine.find(MainModel, {string: "not-even-close-to-a-match"}) when a matching model does not exist', async t => {
    const models = new Models();
    models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    const found = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).find(MainModel, {string: 'not-even-close-to-a-match'});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

    t.deepEqual(found, []);
});

test('HTTPEngine.find(MainModel, {string: "test"}) when no search index exists', async t => {
    const fetch = stubFetch({}, []);

    const models = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).find(MainModel, {string: 'String'});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

    t.deepEqual(models, []);
});

test('HTTPEngine.search(MainModel, "test") when a matching model exists', async t => {
    const models = new Models();
    const model1 = models.createFullTestModel();
    const model2 = models.createFullTestModel();

    model2.string = 'moving tests';

    const fetch = stubFetch({}, Object.values(models.models));

    const found = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).search(MainModel, 'test');

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000001.json'), {headers: {Accept: 'application/json'}});

    t.like(found, [{
        ref: 'MainModel/000000000000',
        score: 0.666,
        model: model1.toData(false),
    }, {
        ref: 'MainModel/000000000001',
        score: 0.506,
        model: model2.toData(false),
    }]);
});

test('HTTPEngine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async t => {
    const models = new Models();
    models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    const found = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).search(MainModel, 'not-even-close-to-a-match');

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {headers: {Accept: 'application/json'}});

    t.deepEqual(found, []);
});

test('HTTPEngine.search(MainModel, "tes") when no index exists for the model', async t => {
    const fetch = stubFetch({}, []);

    await t.throwsAsync(() =>  HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).search(MainModel, 'tes'), {
        instanceOf: EngineError,
        message: 'The model MainModel does not have a search index available.',
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {headers: {Accept: 'application/json'}});
});

test('HTTPEngine.hydrate(model)', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    const dryModel = new MainModel();
    dryModel.id = 'MainModel/000000000000';

    const hydratedModel = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).hydrate(dryModel);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularRequiredModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000001.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});

    t.is(fetch.getCalls().length, 7);

    t.deepEqual(hydratedModel, model);
});

test('HTTPEngine.delete(model)', async t => {
    const models = new Models();
    const modelToBeDeleted = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));

    await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).delete(modelToBeDeleted);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularRequiredModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000001.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularRequiredModel/000000000000.json'), {headers: {Accept: 'application/json'}, method: 'DELETE'});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}, method: 'DELETE'});

    t.is(fetch.getCalls().length, 32);

    t.falsy(Object.keys(fetch.resolvedFiles).includes('MainModel/000000000000.json'));
});

test('HTTPEngine.delete(model) when fetch(method=DELETE) throws an error', async t => {
    const models = new Models();
    const modelToBeDeleted = models.createFullTestModel();

    const fetch = stubFetch({}, Object.values(models.models));
    const patchedFetch = stubFetch({}, Object.values(models.models));
    patchedFetch.callsFake((url, opts) => {
        if (opts.method === 'DELETE') {
            return Promise.reject(new Error('fetch failed'));
        }
        return fetch(url, opts);
    });

    await t.throwsAsync(() => HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch: patchedFetch,
    }).delete(modelToBeDeleted), {
        instanceOf: CannotDeleteEngineError,
        message: 'HTTPEngine.delete(MainModel/000000000000) model cannot be deleted',
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularRequiredModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000001.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, patchedFetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}, method: 'DELETE'});

    t.is(fetch.getCalls().length, 10);
    t.is(patchedFetch.getCalls().length, 11);

    t.falsy(Object.keys(fetch.resolvedFiles).includes('MainModel/000000000000.json'));
});
