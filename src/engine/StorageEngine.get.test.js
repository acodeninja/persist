import {
    ModelNotFoundStorageEngineError,
    ModelNotRegisteredStorageEngineError,
} from './StorageEngine.js';
import {SimpleModel, SimpleModelFactory} from '../../test/fixtures/Model.js';
import {beforeAll, describe, expect, test} from '@jest/globals';
import {TestStorageEngine} from '../../test/fixtures/Engine.js';

describe('StorageEngine.get(modelId)', () => {
    describe('when the model is not registered', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({}, []);

        test('.get(modelId) throws a ModelNotRegisteredStorageEngineError', async () => {
            await expect(() => engine.get(model.id))
                .rejects.toThrowError({
                    instanceOf: ModelNotRegisteredStorageEngineError,
                    message: 'The model SimpleModel is not registered in the storage engine TestStorageEngine',
                });
        });
    });

    describe('when a model does not exist', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({}, [SimpleModel]);

        test('.get(modelId) throws a ModelNotFoundStorageEngineError', async () => {
            await expect(() => engine.get(model.id))
                .rejects.toThrowError({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: `The model ${model.id} was not found`,
                });
        });
    });

    describe('when a simple model exists', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({}, [SimpleModel]);

        beforeAll(() => {
            engine._getModel.mockResolvedValue(model);
        });

        test('.get(modelId) returns the expected model', async () => {
            expect(await engine.get(model.id)).toBe(model);
        });
    });
});
