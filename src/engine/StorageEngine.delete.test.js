import {
    ModelNotFoundStorageEngineError,
    ModelNotRegisteredStorageEngineError,
} from './StorageEngine.js';
import {SimpleModel, SimpleModelFactory} from '../../test/fixtures/Model.js';
import {beforeAll, describe, expect, test} from '@jest/globals';
import {TestStorageEngine} from '../../test/fixtures/Engine.js';

describe('StorageEngine.delete()', () => {
    describe('when the model is not registered', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({}, []);

        test('.delete() throws a ModelNotRegisteredStorageEngineError', async () => {
            await expect(() => engine.delete(model))
                .rejects.toThrowError({
                    instanceOf: ModelNotRegisteredStorageEngineError,
                    message: 'The model SimpleModel is not registered in the storage engine TestStorageEngine',
                });
        });
    });

    describe('when a model does not exist', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({}, [SimpleModel]);

        test('.delete() throws a ModelNotFoundStorageEngineError', async () => {
            await expect(() => engine.delete(model))
                .rejects.toThrowError({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: `The model ${model.id} was not found`,
                });
        });
    });

    describe('when a simple model exists', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({}, [SimpleModel]);

        beforeAll(async () => {
            engine._getModel.mockResolvedValue(model);
            await engine.delete(model);
        });

        test('._getModel() is called once', () => {
            expect(engine._getModel).toHaveBeenCalledTimes(1);
        });

        test('._getModel() is called with the model id', () => {
            expect(engine._getModel).toHaveBeenCalledWith(model.id);
        });

        test('._deleteModel() is called once', () => {
            expect(engine._deleteModel).toHaveBeenCalledTimes(1);
        });

        test('._deleteModel() is called with the model', () => {
            expect(engine._deleteModel).toHaveBeenCalledWith(model.id);
        });
    });
});
