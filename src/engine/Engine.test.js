import Engine, {NotFoundEngineError, NotImplementedError} from './Engine.js';
import {MainModel} from '../../test/fixtures/TestModel.js';
import Type from '../type/index.js';
import stubFs from '../../test/mocks/fs.js';
import test from 'ava';

class UnimplementedEngine extends Engine {

}

test('Engine.configure returns a new store without altering the exising one', t => {
    const originalStore = Engine;
    const configuredStore = Engine.configure({});

    t.deepEqual(configuredStore._configuration, {});
    t.is(originalStore._configuration, undefined);
});

test('UnimplementedEngine.get(Model, id) raises a getById not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.get(Type.Model, 'TestModel/999999999999'),
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

test('UnimplementedEngine.find(Model, {param: value}) raises a findByValue not implemented error', async t => {
    const error = await t.throwsAsync(() =>
            UnimplementedEngine.find(Type.Model, {param: 'value'}),
        {instanceOf: NotImplementedError},
    );
    t.is(error.message, 'UnimplementedEngine does not implement .findByValue()');
});

class ImplementedEngine extends Engine {
    static getById(_model, _id) {
        return null;
    }
}

test('ImplementedEngine.get(MainModel, id) when id does not exist', async t => {
    const filesystem = stubFs();
    filesystem.readFile.rejects(new Error);

    await t.throwsAsync(
        () => ImplementedEngine.get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: NotFoundEngineError,
            message: 'ImplementedEngine.get(MainModel/000000000000) model not found',
        },
    );
});
