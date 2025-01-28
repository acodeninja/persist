import StorageEngine from './StorageEngine.js';
import Type from '../type/index.js';
import test from 'ava';

/**
 * @class TestModel
 * @extends Type.Model
 */
class TestModel extends Type.Model {
    static {
        this.setMinifiedName('TestModel');
    }
}

function getUnimplementedStorageEngine(configuration = {}, models = [TestModel]) {
    return new StorageEngine(configuration, models);
}

test('StorageEngine keeps configuration', t => {
    const configuration = {test: true};
    const engine = getUnimplementedStorageEngine(configuration);

    t.is(engine.configuration, configuration);
});

test('StorageEngine allows registering models', t => {
    const engine = getUnimplementedStorageEngine();

    t.deepEqual(engine.models, {TestModel});
});

test('StorageEngine without any models', t => {
    const engine = new StorageEngine({});

    t.deepEqual(engine.models, {});
});

