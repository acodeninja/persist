import {CircularManyModel, CircularModel, LinkedManyModel, LinkedModel, MainModel} from '../../test/fixtures/Models.js';
import {EngineError, MissConfiguredError, NotFoundEngineError} from './Engine.js';
import FileEngine from './FileEngine.js';
import {Models} from '../../test/fixtures/ModelCollection.js';
import assertions from '../../test/assertions.js';
import fs from 'node:fs/promises';
import stubFs from '../../test/mocks/fs.js';
import test from 'ava';

test('FileEngine.configure(configuration) returns a new engine without altering the exising one', t => {
    const originalStore = FileEngine;
    const configuredStore = originalStore.configure({path: '/tmp/fileEngine'});

    t.deepEqual(configuredStore.configuration, {path: '/tmp/fileEngine', filesystem: fs});
    t.assert(originalStore.configuration === undefined);
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
    const models = new Models();
    const model = models.createFullTestModel();

    const filesystem = stubFs({}, Object.values(models.models));

    const got = await FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).get(MainModel, 'MainModel/000000000000');

    t.true(filesystem.readFile.calledWith('/tmp/fileEngine/MainModel/000000000000.json'));
    t.true(got instanceof MainModel);
    t.true(got.validate());
    t.like(got.toData(), model.toData());
});

test('FileEngine.get(MainModel, id) when id does not exist', async t => {
    const filesystem = stubFs();

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
    const filesystem = stubFs();

    const models = new Models();
    const model = models.createFullTestModel();

    await t.notThrowsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/000000000000.json', JSON.stringify(model.toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_index.json', JSON.stringify(models.getIndex(MainModel)));

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/_search_index_raw.json');
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(models.getRawSearchIndex(MainModel)));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify(models.getSearchIndex(MainModel)));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedModel/000000000000.json', JSON.stringify(model.linked.toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedModel/000000000001.json', JSON.stringify(model.requiredLinked.toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedModel/_index.json', JSON.stringify(models.getIndex(LinkedModel)));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedManyModel/000000000000.json', JSON.stringify(model.linkedMany[0].toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedManyModel/_index.json', JSON.stringify(models.getIndex(LinkedManyModel)));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularModel/000000000000.json', JSON.stringify(model.circular.toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularModel/_index.json', JSON.stringify(models.getIndex(CircularModel)));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularManyModel/000000000000.json', JSON.stringify(model.circularMany[0].toData()));
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularManyModel/_index.json', JSON.stringify(models.getIndex(CircularManyModel)));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/_index.json', JSON.stringify(models.getIndex()));
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

    const models = new Models();
    const model = models.createFullTestModel();

    await t.notThrowsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model));

    t.is(filesystem.readFile.getCalls().length, 7);
    t.is(filesystem.writeFile.getCalls().length, 14);

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/_search_index_raw.json');

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(models.getRawSearchIndex(
        MainModel,
        {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    )));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify(models.getSearchIndex(
        MainModel,
        {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    )));
});

test('FileEngine.put(model) updates existing indexes', async t => {
    const filesystem = stubFs({
        'MainModel/_index.json': {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
        '_index.json': {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.notThrowsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model));

    t.is(filesystem.readFile.getCalls().length, 7);
    t.is(filesystem.writeFile.getCalls().length, 14);

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/_index.json');
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_index.json', JSON.stringify(models.getIndex(
        MainModel,
        {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    )));

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/_index.json');
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/_index.json', JSON.stringify(models.getIndex(undefined, {
        'MainModel/111111111111': {
            id: 'MainModel/111111111111',
            string: 'String',
        },
    })));
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

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put file:///tmp/fileEngine/MainModel/_index.json',
    });

    t.is(filesystem.readFile.getCalls().filter(c => c.args[0].endsWith('/_index.json')).length, 1);
    t.is(filesystem.writeFile.getCalls().filter(c => c.args[0].endsWith('/_index.json')).length, 1);

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_index.json', JSON.stringify(models.getIndex(
        MainModel,
        {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        },
    )));
});

test('FileEngine.put(model) when the engine fails to put a compiled search index', async t => {
    const filesystem = stubFs();

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('/_search_index.json')) {
            throw new Error();
        }
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put file:///tmp/fileEngine/MainModel/_search_index.json',
    });

    t.is(filesystem.readFile.callCount, 1);
    t.is(filesystem.writeFile.getCalls().filter(c => c.args[0].endsWith('/_search_index.json')).length, 1);

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify(models.getSearchIndex(MainModel)));
});

test('FileEngine.put(model) when the engine fails to put a raw search index', async t => {
    const filesystem = stubFs();

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('_search_index_raw.json')) {
            throw new Error();
        }
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put file:///tmp/fileEngine/MainModel/_search_index_raw.json',
    });

    t.is(filesystem.readFile.callCount, 1);
    t.is(filesystem.writeFile.getCalls().filter(c => c.args[0].endsWith('/_search_index_raw.json')).length, 1);

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(models.getRawSearchIndex(MainModel)));
});

test('FileEngine.put(model) when the initial model put fails', async t => {
    const filesystem = stubFs();

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('MainModel/000000000000.json')) {
            throw new Error();
        }
    });

    const models = new Models();
    const model = models.createFullTestModel();

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
    const filesystem = stubFs();

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('LinkedModel/000000000000.json')) {
            throw new Error();
        }
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put file:///tmp/fileEngine/LinkedModel/000000000000.json',
    });

    t.is(filesystem.readFile.callCount, 1);
    t.is(filesystem.writeFile.callCount, 4);

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/_search_index_raw.json');

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/000000000000.json', JSON.stringify(model.toData()));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(models.getRawSearchIndex(MainModel)));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify(models.getSearchIndex(MainModel)));

    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/LinkedModel/000000000000.json', JSON.stringify(model.linked.toData()));
});

test('FileEngine.find(MainModel, {string: "test"}) when a matching model exists', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const filesystem = stubFs({}, Object.values(models.models));

    const found = await FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).find(MainModel, {string: 'test'});

    t.like(found, [model.toIndexData()]);
});

test('FileEngine.find(MainModel, {string: "test"}) when a matching model does not exist', async t => {
    const filesystem = stubFs({'MainModel/_index.json': {}});

    const models = await FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).find(MainModel, {string: 'test'});

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

test('FileEngine.search(MainModel, "test") when matching models exist', async t => {
    const models = new Models();
    const model1 = models.createFullTestModel();
    const model2 = models.createFullTestModel();

    model2.string = 'moving tests';

    const filesystem = stubFs({}, Object.values(models.models));

    const configuration = {
        path: '/tmp/fileEngine',
        filesystem,
    };

    const found = await FileEngine.configure(configuration).search(MainModel, 'test');

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

test('FileEngine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async t => {
    const models = new Models();
    models.createFullTestModel();

    const filesystem = stubFs({}, Object.values(models.models));

    const configuration = {
        path: '/tmp/fileEngine',
        filesystem,
    };

    const found = await FileEngine.configure(configuration).search(MainModel, 'not-even-close-to-a-match');

    t.deepEqual(found, []);
});

test('FileEngine.search(MainModel, "test") when no index exists for the model', async t => {
    const filesystem = stubFs({}, []);

    const configuration = {
        path: '/tmp/fileEngine',
        filesystem,
    };

    await t.throwsAsync(async () => await FileEngine.configure(configuration).search(MainModel, 'test'), {
        instanceOf: EngineError,
        message: 'The model MainModel does not have a search index available.',
    });
});

test('FileEngine.hydrate(model)', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

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
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedModel/000000000001.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedManyModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/CircularManyModel/000000000000.json');

    t.is(filesystem.readFile.getCalls().length, 6);
    t.deepEqual(hydratedModel, model);
});
