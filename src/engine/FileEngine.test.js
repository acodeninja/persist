import {EngineError, MissConfiguredError, NotFoundEngineError} from './Engine.js';
import {MainModel, getTestModelInstance, valid} from '../../test/fixtures/TestModel.js';
import FileEngine from './FileEngine.js';
import assertions from '../../test/assertions.js';
import fs from 'node:fs/promises';
import stubFs from '../../test/mocks/fs.js';
import test from 'ava';

test('FileEngine.configure(configuration) returns a new engine without altering the exising one', t => {
    const originalStore = FileEngine;
    const configuredStore = originalStore.configure({path: '/tmp/fileEngine'});

    t.deepEqual(configuredStore._configuration, {path: '/tmp/fileEngine', filesystem: fs});
    t.is(originalStore._configuration, undefined);
});

test('FileEngine.get(MainModel, id) when engine is not configured', async t => {
    const error = await t.throwsAsync(
        async () => await FileEngine.get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: MissConfiguredError,
        },
    );

    t.is(error.message, 'Engine is miss-configured');
});

test('FileEngine.get(MainModel, id) when id exists', async t => {
    const filesystem = stubFs({
        'MainModel/000000000000.json': getTestModelInstance(valid).toData(),
    });

    const model = await FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).get(MainModel, 'MainModel/000000000000');

    t.true(filesystem.readFile.calledWith('/tmp/fileEngine/MainModel/000000000000.json'));
    t.true(model instanceof MainModel);
    t.true(model.validate());
    t.like(model.toData(), {
        ...valid,
        stringSlug: 'string',
        requiredStringSlug: 'required-string',
    });
});

test('FileEngine.get(MainModel, id) when id does not exist', async t => {
    const filesystem = stubFs({});

    await t.throwsAsync(
        () => FileEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: NotFoundEngineError,
            message: 'FileEngine.get(MainModel/000000000000) model not found',
        },
    );
});

test('FileEngine.put(model)', async t => {
    const filesystem = stubFs({});

    const model = getTestModelInstance(valid);
    await t.notThrowsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/000000000000.json', JSON.stringify(model.toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_index.json', JSON.stringify({
        'MainModel/000000000000': {
            id: 'MainModel/000000000000',
            string: 'String',
            stringSlug: 'string',
            linked: {string: 'test'},
        },
    }));

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/_search_index_raw.json');
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify({
        'MainModel/000000000000': {
            id: 'MainModel/000000000000',
            string: 'String',
        },
    }));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify({
        version: '2.3.9',
        fields: ['string'],
        fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
        invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
        pipeline: ['stemmer'],
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedModel/000000000000.json', JSON.stringify(model.linked.toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedModel/111111111111.json', JSON.stringify(model.requiredLinked.toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedModel/_index.json', JSON.stringify({
        'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
        'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedManyModel/000000000000.json', JSON.stringify(model.linkedMany[0].toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedManyModel/_index.json', JSON.stringify({
        'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularModel/000000000000.json', JSON.stringify(model.circular.toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularModel/_index.json', JSON.stringify({
        'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularManyModel/000000000000.json', JSON.stringify(model.circularMany[0].toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularManyModel/_index.json', JSON.stringify({
        'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/_index.json', JSON.stringify({
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
    }));
});

test('FileEngine.put(model) updates existing search indexes', async t => {
    const filesystem = stubFs({
        'MainModel/_search_index_raw.json': {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    });

    const model = getTestModelInstance(valid);
    await t.notThrowsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model));

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/_search_index_raw.json');
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify({
        'MainModel/111111111111': {
            id: 'MainModel/111111111111',
            string: 'String',
        },
        'MainModel/000000000000': {
            id: 'MainModel/000000000000',
            string: 'String',
        },
    }));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify({
        version: '2.3.9',
        fields: ['string'],
        fieldVectors: [['string/MainModel/111111111111', [0, 0.182]], ['string/MainModel/000000000000', [0, 0.182]]],
        invertedIndex: [['string', {
            _index: 0,
            string: {'MainModel/111111111111': {}, 'MainModel/000000000000': {}},
        }]],
        pipeline: ['stemmer'],
    }));
});

test('FileEngine.put(model) updates existing indexes', async t => {
    const filesystem = stubFs({
        'MainModel/_index.json': {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    });

    const model = getTestModelInstance(valid);

    await t.notThrowsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_index.json', JSON.stringify({
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
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedModel/_index.json', JSON.stringify({
        'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
        'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedManyModel/_index.json', JSON.stringify({
        'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularModel/_index.json', JSON.stringify({
        'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularManyModel/_index.json', JSON.stringify({
        'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/_index.json', JSON.stringify({
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
    }));
});

test('FileEngine.put(model) when putting an index fails', async t => {
    const filesystem = stubFs({
        'MainModel/_index.json': {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    });

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('/_index.json')) {
            throw new Error();
        }
    });

    const model = getTestModelInstance(valid);

    await t.throwsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put file:///tmp/fileEngine/MainModel/_index.json',
    });

    t.is(filesystem.readFile.getCalls().filter(c => c.args[0].endsWith('/_index.json')).length, 1);
    t.is(filesystem.writeFile.getCalls().filter(c => c.args[0].endsWith('/_index.json')).length, 1);

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_index.json', JSON.stringify({
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
        },
    ));
});

test('FileEngine.put(model) when the engine fails to put a compiled search index', async t => {
    const filesystem = stubFs({
        'MainModel/_index.json': {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    });

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('/_search_index.json')) {
            throw new Error();
        }
    });

    const model = getTestModelInstance(valid);

    await t.throwsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put file:///tmp/fileEngine/MainModel/_search_index.json',
    });

    t.is(filesystem.readFile.callCount, 1);
    t.is(filesystem.writeFile.getCalls().filter(c => c.args[0].endsWith('/_search_index.json')).length, 1);

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify({
        version: '2.3.9',
        fields: ['string'],
        fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
        invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
        pipeline: ['stemmer'],
    }));
});

test('FileEngine.put(model) when the engine fails to put a raw search index', async t => {
    const filesystem = stubFs({
        'MainModel/_index.json': {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    });

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('_search_index_raw.json')) {
            throw new Error();
        }
    });

    const model = getTestModelInstance(valid);

    await t.throwsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put file:///tmp/fileEngine/MainModel/_search_index_raw.json',
    });

    t.is(filesystem.readFile.callCount, 1);
    t.is(filesystem.writeFile.getCalls().filter(c => c.args[0].endsWith('/_search_index_raw.json')).length, 1);

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify({
        'MainModel/000000000000': {
            id: 'MainModel/000000000000',
            string: 'String',
        },
    }));
});

test('FileEngine.put(model) when the initial model put fails', async t => {
    const filesystem = stubFs({});

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('MainModel/000000000000.json')) {
            throw new Error();
        }
    });

    const model = getTestModelInstance(valid);

    await t.throwsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put file:///tmp/fileEngine/MainModel/000000000000.json',
    });

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/000000000000.json', JSON.stringify(model.toData()));
    t.is(filesystem.readFile.callCount, 0);
    t.is(filesystem.writeFile.callCount, 1);
});

test('FileEngine.put(model) when the engine fails to put a linked model', async t => {
    const filesystem = stubFs({});

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('LinkedModel/000000000000.json')) {
            throw new Error();
        }
    });

    const model = getTestModelInstance(valid);

    await t.throwsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put file:///tmp/fileEngine/LinkedModel/000000000000.json',
    });

    t.is(filesystem.readFile.callCount, 1);
    t.is(filesystem.writeFile.callCount, 5);

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/_search_index_raw.json');

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/000000000000.json', JSON.stringify(model.toData()));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify({
        'MainModel/000000000000': {
            id: 'MainModel/000000000000',
            string: 'String',
        },
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify({
        version: '2.3.9',
        fields: ['string'],
        fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
        invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
        pipeline: ['stemmer'],
    }));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedModel/000000000000.json', JSON.stringify(model.linked.toData()));
});

test('FileEngine.find(MainModel, {string: "test"}) when a matching model exists', async t => {
    const filesystem = stubFs({}, [
        getTestModelInstance(valid),
        getTestModelInstance({
            id: 'MainModel/1111111111111',
            string: 'another string',
        }),
    ]);

    const models = await FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).find(MainModel, {string: 'String'});

    t.like(models, [{id: 'MainModel/000000000000', string: 'String'}]);
});

test('FileEngine.find(MainModel, {string: "test"}) when a matching model does not exist', async t => {
    const filesystem = stubFs({'MainModel/_index.json': {}});

    const models = await FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).find(MainModel, {string: 'String'});

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/_index.json');

    t.deepEqual(models, []);
});

test('FileEngine.find(MainModel, {string: "test"}) when no index exists', async t => {
    const filesystem = stubFs({}, []);

    const models = await FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).find(MainModel, {string: 'String'});

    t.deepEqual(models, []);
});

test('FileEngine.search(MainModel, "Str") when a matching model exists', async t => {
    const filesystem = stubFs({}, [
        getTestModelInstance(valid),
        getTestModelInstance({
            id: 'MainModel/1111111111111',
            string: 'another string',
        }),
    ]);

    const configuration = {
        path: '/tmp/fileEngine',
        filesystem,
    };

    const model0 = await FileEngine.configure(configuration).get(MainModel, 'MainModel/000000000000');

    const model1 = await FileEngine.configure(configuration).get(MainModel, 'MainModel/1111111111111');

    const models = await FileEngine.configure(configuration).search(MainModel, 'Str');

    t.like(models, [{
        ref: 'MainModel/000000000000',
        score: 0.211,
        model: model0,
    }, {
        ref: 'MainModel/1111111111111',
        score: 0.16,
        model: model1,
    }]);
});

test('FileEngine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async t => {
    const filesystem = stubFs({}, [
        getTestModelInstance(valid),
        getTestModelInstance({
            id: 'MainModel/1111111111111',
            string: 'another string',
        }),
    ]);

    const configuration = {
        path: '/tmp/fileEngine',
        filesystem,
    };

    const models = await FileEngine.configure(configuration).search(MainModel, 'not-even-close-to-a-match');

    t.deepEqual(models, []);
});

test('FileEngine.search(MainModel, "Str") when no index exists for the model', async t => {
    const filesystem = stubFs({}, []);

    const configuration = {
        path: '/tmp/fileEngine',
        filesystem,
    };

    await t.throwsAsync(async () => await FileEngine.configure(configuration).search(MainModel, 'Str'), {
        instanceOf: EngineError,
        message: 'The model MainModel does not have a search index available.',
    });
});

test('FileEngine.hydrate(model)', async t => {
    const model = getTestModelInstance(valid);

    const dryModel = new MainModel();
    dryModel.id = 'MainModel/000000000000';

    const filesystem = stubFs({}, [model]);

    const hydratedModel = await FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).hydrate(dryModel);

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/CircularModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedModel/111111111111.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedManyModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/CircularManyModel/000000000000.json');

    t.is(filesystem.readFile.getCalls().length, 6);
    t.deepEqual(hydratedModel, model);
});
