import {EngineError, MissConfiguredError, NotFoundEngineError} from './Engine.js';
import {MainModel, getTestModelInstance, valid} from '../../test/fixtures/TestModel.js';
import HTTPEngine from './HTTPEngine.js';
import assertions from '../../test/assertions.js';
import stubFetch from '../../test/mocks/fetch.js';
import test from 'ava';

test('HTTPEngine.configure(configuration) returns a new engine without altering the exising one', t => {
    const fetch = stubFetch({}, [getTestModelInstance(valid)]);
    const originalStore = HTTPEngine;
    const configuredStore = originalStore.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    });

    t.is(originalStore._configuration, undefined);
    t.like(configuredStore._configuration, {
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    });
});

test('HTTPEngine.configure(configuration) with additional headers returns a new engine with the headers', t => {
    const fetch = stubFetch({}, [getTestModelInstance(valid)]);
    const originalStore = HTTPEngine;
    const configuredStore = originalStore.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetchOptions: {
            headers: {Authorization: 'Bearer some-bearer-token-for-authentication'},
        },
        fetch,
    });

    t.is(originalStore._configuration, undefined);
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
        async () => await HTTPEngine.get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: MissConfiguredError,
        },
    );

    t.is(error.message, 'Engine is miss-configured');
});

test('HTTPEngine.get(MainModel, id) when id exists', async t => {
    const fetch = stubFetch({}, [getTestModelInstance(valid)]);

    const model = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).get(MainModel, 'MainModel/000000000000');

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});

    t.true(model instanceof MainModel);
    t.true(model.validate());
    t.like(model.toData(), {
        ...valid,
        stringSlug: 'string',
        requiredStringSlug: 'required-string',
    });
});

test('HTTPEngine.get(MainModel, id) when id does not exist', async t => {
    const fetch = stubFetch({}, [getTestModelInstance(valid)]);

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
    const fetch = stubFetch({}, [getTestModelInstance(valid)]);

    const model = getTestModelInstance(valid);

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
        body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
            },
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            version: '2.3.9',
            fields: ['string'],
            fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
            invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
            pipeline: ['stemmer'],
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.linked.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/111111111111.json'), {
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
        body: JSON.stringify({
            'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
            'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
        }),
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
        body: JSON.stringify({
            'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
        }),
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
        body: JSON.stringify({
            'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
        }),
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
        body: JSON.stringify({
            'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
            },
            'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
            'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
            'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
            'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
            'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
        }),
    });
});

test('HTTPEngine.put(model) when the engine fails to put a compiled search index', async t => {
    const fetch = stubFetch({}, [getTestModelInstance(valid)]);

    fetch.callsFake((url) => {
        if (url.pathname.endsWith('/_search_index.json')) {
            return Promise.resolve({
                ok: false,
                status: 500,
                json: async () => {
                    throw new Error();
                },
            });
        }

        return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => {
            },
        });
    });

    const model = getTestModelInstance(valid);

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
        body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            version: '2.3.9',
            fields: ['string'],
            fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
            invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
            pipeline: ['stemmer'],
        }),
    });
});

test('HTTPEngine.put(model) when the engine fails to put a raw search index', async t => {
    const fetch = stubFetch({}, [getTestModelInstance(valid)], {
        'MainModel/_search_index_raw.json': undefined,
    });

    const model = getTestModelInstance(valid);
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
        body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
            },
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index_raw.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
    });
});

test('HTTPEngine.put(model) when putting an index fails', async t => {
    const fetch = stubFetch({}, [getTestModelInstance(valid)], {
        'MainModel/_index.json': undefined,
    });

    const model = getTestModelInstance(valid);
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
        body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
            },
        }),
    });
});

test('HTTPEngine.put(model) when the initial model put fails', async t => {
    const fetch = stubFetch({}, [getTestModelInstance(valid)]);

    fetch.callsFake((url) => {
        if (url.pathname.endsWith('MainModel/000000000000.json')) {
            return Promise.resolve({
                ok: false,
                status: 500,
                json: async () => {
                    throw new Error();
                },
            });
        }

        return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => {
            },
        });
    });

    const model = getTestModelInstance(valid);
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
    const fetch = stubFetch({}, [getTestModelInstance(valid)]);

    fetch.callsFake((url) => {
        if (url.pathname.endsWith('LinkedModel/000000000000.json')) {
            return Promise.resolve({
                ok: false,
                status: 500,
                json: async () => {
                    throw new Error();
                },
            });
        }

        return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => {
            },
        });
    });

    const model = getTestModelInstance(valid);

    await t.throwsAsync(() => HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put https://example.com/test/LinkedModel/000000000000.json',
    });

    t.is(fetch.getCalls().length, 6);

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
        body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            version: '2.3.9',
            fields: ['string'],
            fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
            invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
            pipeline: ['stemmer'],
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.linked.toData()),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/000000000000.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(model.circular.toData()),
    });
});

test('HTTPEngine.put(model) updates existing search indexes', async t => {
    const fetch = stubFetch({
        'MainModel/_search_index_raw.json': {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    }, [getTestModelInstance(valid)]);

    const model = getTestModelInstance(valid);
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
        body: JSON.stringify({
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            version: '2.3.9',
            fields: ['string'],
            fieldVectors: [['string/MainModel/111111111111', [0, 0.182]], ['string/MainModel/000000000000', [0, 0.182]]],
            invertedIndex: [['string', {
                _index: 0,
                string: {'MainModel/111111111111': {}, 'MainModel/000000000000': {}},
            }]],
            pipeline: ['stemmer'],
        }),
    });
});

test('HTTPEngine.put(model) updates existing indexes', async t => {
    const fetch = stubFetch({
        'MainModel/_index.json': {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    }, [getTestModelInstance(valid)]);

    const model = getTestModelInstance(valid);
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
        body: JSON.stringify({
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
            },
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
            'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
        }),
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/_index.json'), {headers: {Accept: 'application/json'}});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/_index.json'), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
            },
            'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
            'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
            'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
            'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
            'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
        }),
    });
});

test('HTTPEngine.find(MainModel, {string: "test"}) when a matching model exists', async t => {
    const fetch = stubFetch({}, [getTestModelInstance(valid)]);

    const models = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).find(MainModel, {string: 'String'});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

    t.like(models, [{id: 'MainModel/000000000000', string: 'String'}]);
});

test('HTTPEngine.find(MainModel, {string: "test"}) when a matching model does not exist', async t => {
    const fetch = stubFetch({}, [getTestModelInstance({id: 'MainModel/999999999999'})]);

    const models = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).find(MainModel, {string: 'String'});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

    t.deepEqual(models, []);
});

test('HTTPEngine.find(MainModel, {string: "test"}) when no index exists', async t => {
    const fetch = stubFetch({}, []);

    const models = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).find(MainModel, {string: 'String'});

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_index.json'), {headers: {Accept: 'application/json'}});

    t.deepEqual(models, []);
});

test('HTTPEngine.search(MainModel, "Str") when a matching model exists', async t => {
    const model0 = getTestModelInstance(valid);
    const model1 = getTestModelInstance({
        id: 'MainModel/111111111111',
        string: 'another string',
    });
    const fetch = stubFetch({}, [model0, model1]);

    const models = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).search(MainModel, 'Str');

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/111111111111.json'), {headers: {Accept: 'application/json'}});

    t.like(models, [{
        ref: 'MainModel/000000000000',
        score: 0.211,
        model: {
            ...model0.toData(),
            date: new Date(model0.date),
            requiredDate: new Date(model0.requiredDate),
            arrayOfDate: model0.arrayOfDate[0] ? [new Date(model0.arrayOfDate[0])] : [],
            requiredArrayOfDate: [new Date(model0.requiredArrayOfDate[0])],
        },
    }, {
        ref: 'MainModel/111111111111',
        score: 0.16,
        model: model1.toData(),
    }]);
});

test('HTTPEngine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async t => {
    const fetch = stubFetch({}, [
        getTestModelInstance(valid),
        getTestModelInstance({
            id: 'MainModel/1111111111111',
            string: 'another string',
        }),
    ]);

    const models = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).search(MainModel, 'not-even-close-to-a-match');

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {headers: {Accept: 'application/json'}});

    t.deepEqual(models, []);
});

test('HTTPEngine.search(MainModel, "Str") when no index exists for the model', async t => {
    const fetch = stubFetch({}, []);

    await t.throwsAsync(async () => await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).search(MainModel, 'Str'), {
        instanceOf: EngineError,
        message: 'The model MainModel does not have a search index available.',
    });

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/_search_index.json'), {headers: {Accept: 'application/json'}});
});

test('HTTPEngine.hydrate(model)', async t => {
    const model = getTestModelInstance(valid);

    const dryModel = new MainModel();
    dryModel.id = 'MainModel/000000000000';

    const fetch = stubFetch({}, [getTestModelInstance(valid)]);

    const hydratedModel = await HTTPEngine.configure({
        host: 'https://example.com',
        prefix: 'test',
        fetch,
    }).hydrate(dryModel);

    assertions.calledWith(t, fetch, new URL('https://example.com/test/MainModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedModel/111111111111.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/LinkedManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});
    assertions.calledWith(t, fetch, new URL('https://example.com/test/CircularManyModel/000000000000.json'), {headers: {Accept: 'application/json'}});

    t.is(fetch.getCalls().length, 6);

    t.deepEqual(hydratedModel, model);
});
