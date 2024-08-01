import {MainModel, getTestModelInstance, valid} from '../../test/fixtures/TestModel.js';
import FileEngine from './FileEngine.js';
import {NotFoundEngineError} from './Engine.js';
import assertions from '../../test/assertions.js';
import fs from 'node:fs/promises';
import stubFs from '../../test/mocks/fs.js';
import test from 'ava';

test('FileEngine.configure returns a new engine without altering the exising one', t => {
    const originalStore = FileEngine;
    const configuredStore = originalStore.configure({path: '/tmp/fileEngine'});

    t.deepEqual(configuredStore._configuration, {path: '/tmp/fileEngine', filesystem: fs});
    t.is(originalStore._configuration, undefined);
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
        },
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
        },
        'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
        'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
        'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
        'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
        'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
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
        },
        'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
        'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
        'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
        'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
        'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
    }));
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
    const filesystem = stubFs();

    const models = await FileEngine.configure({
        path: '/tmp/fileEngine',
        filesystem,
    }).find(MainModel, {string: 'String'});

    t.deepEqual(models, []);
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

    t.deepEqual(hydratedModel, model);
});
