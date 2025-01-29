import {expect, test} from '@jest/globals';
import StorageEngine from './StorageEngine.js';
import Type from '../type/index.js';

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

test('StorageEngine keeps configuration', () => {
    const configuration = {test: true};
    const engine = getUnimplementedStorageEngine(configuration);

    expect(engine.configuration).toBe(configuration);
});

test('StorageEngine allows registering models', () => {
    const engine = getUnimplementedStorageEngine();

    expect(engine.models).toEqual({TestModel});
});

test('StorageEngine without any models', () => {
    const engine = new StorageEngine({});

    expect(engine.models).toEqual({});
});
