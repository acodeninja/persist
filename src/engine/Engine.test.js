import Engine, {NotFoundEngineError, NotImplementedError} from './Engine.js';
import {MainModel} from '../../test/fixtures/Models.js';
import {Models} from '../../test/fixtures/ModelCollection.js';
import Type from '../type/index.js';
import sinon from 'sinon';
import test from 'ava';

class UnimplementedEngine extends Engine {

}

test('Engine.configure returns a new store without altering the exising one', t => {
    const originalStore = Engine;
    const configuredStore = Engine.configure({});

    t.deepEqual(configuredStore.configuration, {});
    t.assert(originalStore.configuration === undefined);
});

test('UnimplementedEngine.get(Model, id) raises a getById not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.get(MainModel, 'TestModel/999999999999'),
        {instanceOf: NotImplementedError},
    );
    t.is(error.message, 'UnimplementedEngine must implement .getById()');
});

test('UnimplementedEngine.put(model) raises a putModel not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.put(new Type.Model()),
        {instanceOf: NotImplementedError},
    );
    t.is(error.message, 'UnimplementedEngine must implement .putModel()');
});

test('UnimplementedEngine.putIndex(model) raises a putIndex not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.putIndex(new Type.Model()),
        {instanceOf: NotImplementedError},
    );
    t.is(error.message, 'UnimplementedEngine does not implement .putIndex()');
});

test('UnimplementedEngine.find(Model, {param: value}) raises a getIndex not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.find(MainModel, {param: 'value'}),
        {instanceOf: NotImplementedError},
    );
    t.is(error.message, 'UnimplementedEngine does not implement .getIndex()');
});

test('UnimplementedEngine.getSearchIndexCompiled(Model) raises a getSearchIndexCompiled not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.getSearchIndexCompiled(MainModel),
        {instanceOf: NotImplementedError},
    );
    t.is(error.message, 'UnimplementedEngine does not implement .getSearchIndexCompiled()');
});

test('UnimplementedEngine.getSearchIndexRaw(Model) raises a getSearchIndexRaw not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.getSearchIndexRaw(MainModel),
        {instanceOf: NotImplementedError},
    );
    t.is(error.message, 'UnimplementedEngine does not implement .getSearchIndexRaw()');
});

test('UnimplementedEngine.putSearchIndexCompiled(Model, {param: value}) raises a putSearchIndexCompiled not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.putSearchIndexCompiled(MainModel, {param: 'value'}),
        {instanceOf: NotImplementedError},
    );
    t.is(error.message, 'UnimplementedEngine does not implement .putSearchIndexCompiled()');
});

test('UnimplementedEngine.putSearchIndexRaw(Model, {param: value}) raises a putSearchIndexRaw not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.putSearchIndexRaw(MainModel, {param: 'value'}),
        {instanceOf: NotImplementedError},
    );
    t.is(error.message, 'UnimplementedEngine does not implement .putSearchIndexRaw()');
});

test('ImplementedEngine.get(MainModel, id) when id does not exist', async t => {
    class ImplementedEngine extends Engine {
        static getById(_id) {
            return null;
        }
    }

    await t.throwsAsync(
        () => ImplementedEngine.get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: NotFoundEngineError,
            message: 'ImplementedEngine.get(MainModel/000000000000) model not found',
        },
    );
});

test('ImplementedEngine.search(MainModel, "test") when caching is off calls ImplementedEngine.getSearchIndexCompiled every time', async t => {
    class ImplementedEngine extends Engine {
        static getById(id) {
            const models = new Models();
            models.createFullTestModel();
            return models.models[id] || null;
        }

        static getSearchIndexCompiled = sinon.stub().callsFake((model) => {
            const models = new Models();
            models.createFullTestModel();
            return Promise.resolve(JSON.parse(JSON.stringify(models.getSearchIndex(model))));
        });
    }

    const engine = ImplementedEngine.configure({});

    await engine.search(MainModel, 'test');
    await engine.search(MainModel, 'test');

    t.is(engine.getSearchIndexCompiled.getCalls().length, 2);
});

test('ImplementedEngine.search(MainModel, "test") when caching is on calls ImplementedEngine.getSearchIndexCompiled once', async t => {
    const models = new Models();
    models.createFullTestModel();

    class ImplementedEngine extends Engine {
        static getById(id) {
            return models.models[id];
        }

        static getSearchIndexCompiled = sinon.stub().callsFake((model) =>
            Promise.resolve(JSON.parse(JSON.stringify(models.getSearchIndex(model)))),
        );
    }

    const engine = ImplementedEngine.configure({cache: {search: 5000}});

    await engine.search(MainModel, 'test');
    await engine.search(MainModel, 'test');

    t.is(engine.getSearchIndexCompiled.getCalls().length, 1);
});
