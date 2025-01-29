import StorageEngine, {NotFoundEngineError, NotImplementedError} from './StorageEngine.js';
import {describe, expect, jest, test} from '@jest/globals';
import {MainModel} from '../../../test/fixtures/Models.js';
import {Models} from '../../../test/fixtures/ModelCollection.js';
import Type from '../../type/index.js';

class UnimplementedEngine extends StorageEngine {

}

test('StorageEngine.configure returns a new store without altering the exising one', () => {
    const originalStore = StorageEngine;
    const configuredStore = StorageEngine.configure({});

    expect(configuredStore.configuration).toEqual({});
    expect(originalStore.configuration).toBe(undefined);
});

describe('UnimplementedEngine', () => {
    test('UnimplementedEngine.get(Model, id) raises a getById not implemented error', async () => {
        await expect(() => UnimplementedEngine.get(MainModel, 'TestModel/999999999999'))
            .rejects.toThrowError(new NotImplementedError('UnimplementedEngine must implement .getById()'));
    });

    test('UnimplementedEngine.put(model) raises a putModel not implemented error', async () => {
        await expect(() => UnimplementedEngine.put(new Type.Model()))
            .rejects.toThrowError(new NotImplementedError('UnimplementedEngine must implement .putModel()'));
    });

    test('UnimplementedEngine.delete(model) raises a getById not implemented error', async () => {
        await expect(() => UnimplementedEngine.delete(new Type.Model()))
            .rejects.toThrowError(new NotImplementedError('UnimplementedEngine must implement .getById()'));
    });

    test('UnimplementedEngine.delete(model) raises a deleteById not implemented error when getById is implemented', async () => {
        class WithGetById extends StorageEngine {
            static getById() {
                return Promise.resolve(new Type.Model());
            }
        }

        await expect(() => WithGetById.delete(new Type.Model()))
            .rejects.toThrowError(new NotImplementedError('WithGetById must implement .deleteById()'));
    });

    test('UnimplementedEngine.putIndex(model) raises a putIndex not implemented error', async () => {
        await expect(() => UnimplementedEngine.putIndex(new Type.Model()))
            .rejects.toThrowError(new NotImplementedError('UnimplementedEngine does not implement .putIndex()'));
    });

    test('UnimplementedEngine.find(Model, {param: value}) raises a getIndex not implemented error', async () => {
        await expect(() => UnimplementedEngine.find(MainModel, {param: 'value'}))
            .rejects.toThrowError(new NotImplementedError('UnimplementedEngine does not implement .getIndex()'));
    });

    test('UnimplementedEngine.getSearchIndexCompiled(Model) raises a getSearchIndexCompiled not implemented error', async () => {
        await expect(() => UnimplementedEngine.getSearchIndexCompiled(MainModel))
            .rejects.toThrowError(new NotImplementedError('UnimplementedEngine does not implement .getSearchIndexCompiled()'));
    });

    test('UnimplementedEngine.getSearchIndexRaw(Model) raises a getSearchIndexRaw not implemented error', async () => {
        await expect(() => UnimplementedEngine.getSearchIndexRaw(MainModel))
            .rejects.toThrowError(new NotImplementedError('UnimplementedEngine does not implement .getSearchIndexRaw()'));
    });

    test('UnimplementedEngine.putSearchIndexCompiled(Model, {param: value}) raises a putSearchIndexCompiled not implemented error', async () => {
        await expect(() => UnimplementedEngine.putSearchIndexCompiled(MainModel, {param: 'value'}))
            .rejects.toThrowError(new NotImplementedError('UnimplementedEngine does not implement .putSearchIndexCompiled()'));
    });

    test('UnimplementedEngine.putSearchIndexRaw(Model, {param: value}) raises a putSearchIndexRaw not implemented error', async () => {
        await expect(() => UnimplementedEngine.putSearchIndexRaw(MainModel, {param: 'value'}))
            .rejects.toThrowError(new NotImplementedError('UnimplementedEngine does not implement .putSearchIndexRaw()'));
    });
});

describe('ImplementedEngine', () => {
    test('ImplementedEngine.get(MainModel, id) when id does not exist', async () => {
        class ImplementedEngine extends StorageEngine {
            static getById(_id) {
                return null;
            }
        }

        await expect(() => ImplementedEngine.get(MainModel, 'MainModel/000000000000'))
            .rejects.toThrowError(new NotFoundEngineError('ImplementedEngine.get(MainModel/000000000000) model not found'));
    });

    test('ImplementedEngine.search(MainModel, "test") when caching is off calls ImplementedEngine.getSearchIndexCompiled every time', async () => {
        class ImplementedEngine extends StorageEngine {
            static getById(id) {
                const models = new Models();
                models.createFullTestModel();
                return models.models[id] || null;
            }

            static getSearchIndexCompiled = jest.fn().mockImplementation((model) => {
                const models = new Models();
                models.createFullTestModel();
                return Promise.resolve(JSON.parse(JSON.stringify(models.getSearchIndex(model))));
            });
        }

        const engine = ImplementedEngine.configure({});

        await engine.search(MainModel, 'test');
        await engine.search(MainModel, 'test');

        expect(engine.getSearchIndexCompiled).toHaveBeenCalledTimes(2);
    });

    test('ImplementedEngine.search(MainModel, "test") when caching is on calls ImplementedEngine.getSearchIndexCompiled once', async () => {
        const models = new Models();
        models.createFullTestModel();

        class ImplementedEngine extends StorageEngine {
            static getById(id) {
                return models.models[id];
            }

            static getSearchIndexCompiled = jest.fn().mockImplementation((model) =>
                Promise.resolve(JSON.parse(JSON.stringify(models.getSearchIndex(model)))),
            );
        }

        const engine = ImplementedEngine.configure({cache: {search: 5000}});

        await engine.search(MainModel, 'test');
        await engine.search(MainModel, 'test');

        expect(engine.getSearchIndexCompiled).toHaveBeenCalledTimes(1);
    });

    test('ImplementedEngine.put(partialModel) does not put dry models', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const partialModel = MainModel.fromData(model.toData());

        class ImplementedEngine extends StorageEngine {
            static getById(id) {
                return models.models[id];
            }

            static getSearchIndexCompiled = jest.fn().mockImplementation((model) =>
                Promise.resolve(JSON.parse(JSON.stringify(models.getSearchIndex(model)))),
            );

            static getSearchIndexRaw = jest.fn().mockImplementation((model) =>
                Promise.resolve(JSON.parse(JSON.stringify(models.getRawSearchIndex(model)))),
            );

            static putSearchIndexRaw = jest.fn();

            static putSearchIndexCompiled = jest.fn();

            static putIndex = jest.fn();

            static putModel = jest.fn();
        }

        const engine = ImplementedEngine.configure({cache: {search: 5000}});

        await engine.put(partialModel);

        expect(engine.putModel).toHaveBeenCalledTimes(1);
    });
});
