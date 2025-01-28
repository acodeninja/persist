import {CannotDeleteEngineError, EngineError, MissConfiguredError, NotFoundEngineError} from './StorageEngine.js';
import {CircularManyModel, CircularModel, LinkedManyModel, LinkedModel, MainModel} from '../../../test/fixtures/Models.js';
import FileStorageEngine from './FileStorageEngine.js';
import {Models} from '../../../test/fixtures/ModelCollection.js';
import assertions from '../../../test/assertions.js';
import fs from 'node:fs/promises';
import stubFs from '../../../test/mocks/fs.js';
import test from 'ava';

test('FileStorageEngine.configure(configuration) returns a new engine without altering the exising one', t => {
    const originalStore = FileStorageEngine;
    const configuredStore = originalStore.configure({path: '/tmp/fileEngine'});

    t.deepEqual(configuredStore.configuration, {path: '/tmp/fileEngine', filesystem: fs});
    t.assert(originalStore.configuration === undefined);
});

test('FileStorageEngine.get(MainModel, id) when engine is not configured', async t => {
    const error = await t.throwsAsync(
        () =>  FileStorageEngine.get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: MissConfiguredError,
        },
    );

    t.is(error.message, 'StorageEngine is miss-configured');
});

test('FileStorageEngine.get(MainModel, id) when id exists', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const filesystem = stubFs({}, Object.values(models.models));

    const got = await FileStorageEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).get(MainModel, 'MainModel/000000000000');

    t.true(filesystem.readFile.calledWith('/tmp/fileEngine/MainModel/000000000000.json'));
    t.true(got instanceof MainModel);
    t.true(got.validate());
    t.like(got.toData(), model.toData());
});

test('FileStorageEngine.get(MainModel, id) when id does not exist', async t => {
    const filesystem = stubFs();

    await t.throwsAsync(
        () => FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: NotFoundEngineError,
            message: 'FileStorageEngine.get(MainModel/000000000000) model not found',
        },
    );
});

test('FileStorageEngine.put(model)', async t => {
    const filesystem = stubFs();

    const models = new Models();
    const model = models.createFullTestModel();

    await t.notThrowsAsync(() => FileStorageEngine.configure({
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

test('FileStorageEngine.put(model) updates existing search indexes', async t => {
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

    await t.notThrowsAsync(() => FileStorageEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model));

    t.is(filesystem.readFile.getCalls().length, 8);
    t.is(filesystem.writeFile.getCalls().length, 16);

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

test('FileStorageEngine.put(model) updates existing indexes', async t => {
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

    await t.notThrowsAsync(() => FileStorageEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).put(model));

    t.is(filesystem.readFile.getCalls().length, 8);
    t.is(filesystem.writeFile.getCalls().length, 16);

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

test('FileStorageEngine.put(model) when putting an index fails', async t => {
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

    await t.throwsAsync(() => FileStorageEngine.configure({
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

test('FileStorageEngine.put(model) when the engine fails to put a compiled search index', async t => {
    const filesystem = stubFs();

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('/_search_index.json')) {
            throw new Error();
        }
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => FileStorageEngine.configure({
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

test('FileStorageEngine.put(model) when the engine fails to put a raw search index', async t => {
    const filesystem = stubFs();

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('_search_index_raw.json')) {
            throw new Error();
        }
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => FileStorageEngine.configure({
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

test('FileStorageEngine.put(model) when the initial model put fails', async t => {
    const filesystem = stubFs();

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('MainModel/000000000000.json')) {
            throw new Error();
        }
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => FileStorageEngine.configure({
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

test('FileStorageEngine.put(model) when the engine fails to put a linked model', async t => {
    const filesystem = stubFs();

    filesystem.writeFile.callsFake(path => {
        if (path.endsWith('LinkedModel/000000000000.json')) {
            throw new Error();
        }
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => FileStorageEngine.configure({
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

test('FileStorageEngine.find(MainModel, {string: "test"}) when a matching model exists', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const filesystem = stubFs({}, Object.values(models.models));

    const found = await FileStorageEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).find(MainModel, {string: 'test'});

    t.like(found, [model.toIndexData()]);
});

test('FileStorageEngine.find(MainModel, {string: "test"}) when a matching model does not exist', async t => {
    const filesystem = stubFs({'MainModel/_index.json': {}});

    const models = await FileStorageEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).find(MainModel, {string: 'test'});

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/_index.json');

    t.deepEqual(models, []);
});

test('FileStorageEngine.find(MainModel, {string: "test"}) when no index exists', async t => {
    const filesystem = stubFs({}, []);

    const models = await FileStorageEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).find(MainModel, {string: 'String'});

    t.deepEqual(models, []);
});

test('FileStorageEngine.search(MainModel, "test") when matching models exist', async t => {
    const models = new Models();
    const model1 = models.createFullTestModel();
    const model2 = models.createFullTestModel();

    model2.string = 'moving tests';

    const filesystem = stubFs({}, Object.values(models.models));

    const configuration = {
        path: '/tmp/fileEngine',
        filesystem,
    };

    const found = await FileStorageEngine.configure(configuration).search(MainModel, 'test');

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

test('FileStorageEngine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async t => {
    const models = new Models();
    models.createFullTestModel();

    const filesystem = stubFs({}, Object.values(models.models));

    const configuration = {
        path: '/tmp/fileEngine',
        filesystem,
    };

    const found = await FileStorageEngine.configure(configuration).search(MainModel, 'not-even-close-to-a-match');

    t.deepEqual(found, []);
});

test('FileStorageEngine.search(MainModel, "test") when no index exists for the model', async t => {
    const filesystem = stubFs({}, []);

    const configuration = {
        path: '/tmp/fileEngine',
        filesystem,
    };

    await t.throwsAsync(() =>  FileStorageEngine.configure(configuration).search(MainModel, 'test'), {
        instanceOf: EngineError,
        message: 'The model MainModel does not have a search index available.',
    });
});

test('FileStorageEngine.hydrate(model)', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const dryModel = new MainModel();
    dryModel.id = 'MainModel/000000000000';

    const filesystem = stubFs({}, [model]);

    const hydratedModel = await FileStorageEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).hydrate(dryModel);

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/CircularModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/CircularRequiredModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedModel/000000000001.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedManyModel/000000000000.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/CircularManyModel/000000000000.json');

    t.is(filesystem.readFile.getCalls().length, 7);
    t.deepEqual(hydratedModel, model);
});

test('FileStorageEngine.delete(model)', async t => {
    const models = new Models();
    models.createFullTestModel();
    const modelToBeDeleted = models.createFullTestModel();

    const filesystem = stubFs({}, Object.values(models.models));

    await FileStorageEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).delete(modelToBeDeleted);

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/000000000001.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/CircularModel/000000000001.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/CircularRequiredModel/000000000001.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedModel/000000000002.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedModel/000000000003.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/LinkedManyModel/000000000001.json');
    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/CircularManyModel/000000000001.json');

    t.is(filesystem.readFile.getCalls().length, 17);

    const searchIndexWithout = models.getRawSearchIndex(MainModel);
    delete searchIndexWithout[modelToBeDeleted.id];
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(searchIndexWithout));

    const mainModelIndexWithout = models.getIndex(MainModel);
    delete mainModelIndexWithout[modelToBeDeleted.id];
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/MainModel/_index.json', JSON.stringify(mainModelIndexWithout));

    const globalModelIndexWithout = models.getIndex();
    delete globalModelIndexWithout[modelToBeDeleted.id];
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/_index.json', JSON.stringify(globalModelIndexWithout));

    const circularModelWithout = modelToBeDeleted.circular.toData();
    delete circularModelWithout.linked;
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularModel/000000000001.json', JSON.stringify(circularModelWithout));

    const circularMany1ModelWithout = modelToBeDeleted.circularMany[0].toData();
    circularMany1ModelWithout.linked = [];
    assertions.calledWith(t, filesystem.writeFile, '/tmp/fileEngine/CircularManyModel/000000000001.json', JSON.stringify(circularMany1ModelWithout));

    t.falsy(Object.keys(filesystem.resolvedFiles).includes('MainModel/000000000001.json'));

    assertions.calledWith(t, filesystem.rm, '/tmp/fileEngine/MainModel/000000000001.json');
    assertions.calledWith(t, filesystem.rm, '/tmp/fileEngine/CircularRequiredModel/000000000001.json');

    t.is(filesystem.rm.getCalls().length, 2);
});

test('FileStorageEngine.delete(model) when rm throws an error', async t => {
    const models = new Models();
    const model = models.createFullTestModel();
    const modelToBeDeleted = models.createFullTestModel();

    const filesystem = stubFs({}, [model, modelToBeDeleted]);

    modelToBeDeleted.id = 'MainModel/999999999999';

    await t.throwsAsync(() => FileStorageEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).delete(modelToBeDeleted), {
        instanceOf: CannotDeleteEngineError,
        message: 'FileStorageEngine.delete(MainModel/999999999999) model cannot be deleted',
    });

    assertions.calledWith(t, filesystem.readFile, '/tmp/fileEngine/MainModel/999999999999.json');

    t.is(filesystem.readFile.getCalls().length, 1);

    t.truthy(Object.keys(filesystem.resolvedFiles).includes('MainModel/000000000001.json'));

    t.is(filesystem.rm.getCalls().length, 0);
});
