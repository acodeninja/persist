import {
    CircularLinkedModel,
    CircularLinkedModelFactory,
    CircularLinkedModelWithSearchIndex,
    CircularLinkedModelWithSearchIndexFactory,
    CircularRequiredLinkedModelWithSearchIndex,
    CircularRequiredLinkedModelWithSearchIndexFactory,
    LinkedModel,
    LinkedModelFactory,
    RequiredLinkedModelWithSearchIndex,
    RequiredLinkedModelWithSearchIndexFactory,
    SimpleModel,
    SimpleModelFactory,
    SimpleModelWithIndex,
    SimpleModelWithIndexFactory,
    SimpleModelWithSearchIndex,
    SimpleModelWithSearchIndexFactory,
} from '../../test/fixtures/Model.js';
import {
    ModelNotFoundStorageEngineError,
    ModelNotRegisteredStorageEngineError,
} from './StorageEngine.js';
import {beforeAll, describe, expect, test} from '@jest/globals';
import {TestStorageEngine} from '../../test/fixtures/Engine.js';
import _ from 'lodash';

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

    describe('when a one way linked model exists', () => {
        const model = LinkedModelFactory();
        const engine = new TestStorageEngine({}, [LinkedModel, SimpleModel]);

        beforeAll(async () => {
            engine._getModel.mockResolvedValue(model);
            engine._getIndex.mockImplementation((constructor) => {
                if (constructor === LinkedModel)
                    return Promise.resolve({[model.id]: model.toIndexData()});
                if (constructor === SimpleModel)
                    return Promise.resolve({[model.linked.id]: model.linked.toIndexData()});
                return Promise.resolve({});
            });
            await engine.delete(model);
        });

        test('._getModel() is called once', () => {
            expect(engine._getModel).toHaveBeenCalledTimes(1);
        });

        test('._getModel() is called with the main model id', () => {
            expect(engine._getModel).toHaveBeenCalledWith(model.id);
        });

        test('._deleteModel() is called once', () => {
            expect(engine._deleteModel).toHaveBeenCalledTimes(1);
        });

        test('._deleteModel() is called with the main model', () => {
            expect(engine._deleteModel).toHaveBeenCalledWith(model.id);
        });
    });

    describe('when a model with an index exists', () => {
        const model = SimpleModelWithIndexFactory();
        const engine = new TestStorageEngine({}, [SimpleModelWithIndex]);

        beforeAll(async () => {
            engine._getModel.mockResolvedValue(model);
            engine._getIndex.mockResolvedValue({
                [model.id]: model.toIndexData(),
            });
            await engine.delete(model);
        });

        test('._getModel() is called once', () => {
            expect(engine._getModel).toHaveBeenCalledTimes(1);
        });

        test('._getModel() is called with the main model id', () => {
            expect(engine._getModel).toHaveBeenCalledWith(model.id);
        });

        test('._deleteModel() is called once', () => {
            expect(engine._deleteModel).toHaveBeenCalledTimes(1);
        });

        test('._deleteModel() is called with the main model', () => {
            expect(engine._deleteModel).toHaveBeenCalledWith(model.id);
        });

        test('._getIndex() is called once', () => {
            expect(engine._getIndex).toHaveBeenCalledTimes(1);
        });

        test('._getIndex() is called with the main model constructor', () => {
            expect(engine._getIndex).toHaveBeenCalledWith(model.constructor);
        });

        test('._putIndex() is called once', () => {
            expect(engine._putIndex).toHaveBeenCalledTimes(1);
        });

        test('._putIndex() is called with the main model removed', () => {
            expect(engine._putIndex).toHaveBeenCalledWith(model.constructor, {});
        });
    });

    describe('when a model with a search index exists', () => {
        const model = SimpleModelWithSearchIndexFactory();
        const engine = new TestStorageEngine({}, [SimpleModelWithSearchIndex]);

        beforeAll(async () => {
            engine._getModel.mockResolvedValue(model);
            engine._getIndex.mockResolvedValue({
                [model.id]: model.toIndexData(),
            });
            engine._getSearchIndex.mockResolvedValue({
                [model.id]: model.toSearchData(),
            });
            await engine.delete(model);
        });

        test('._getModel() is called once', () => {
            expect(engine._getModel).toHaveBeenCalledTimes(1);
        });

        test('._getModel() is called with the main model id', () => {
            expect(engine._getModel).toHaveBeenCalledWith(model.id);
        });

        test('._deleteModel() is called once', () => {
            expect(engine._deleteModel).toHaveBeenCalledTimes(1);
        });

        test('._deleteModel() is called with the main model', () => {
            expect(engine._deleteModel).toHaveBeenCalledWith(model.id);
        });

        test('._getIndex() is called once', () => {
            expect(engine._getIndex).toHaveBeenCalledTimes(1);
        });

        test('._getIndex() is called with the main model constructor', () => {
            expect(engine._getIndex).toHaveBeenCalledWith(model.constructor);
        });

        test('._putIndex() is called once', () => {
            expect(engine._putIndex).toHaveBeenCalledTimes(1);
        });

        test('._putIndex() is called with the main model removed', () => {
            expect(engine._putIndex).toHaveBeenCalledWith(model.constructor, {});
        });

        test('._getSearchIndex() is called once', () => {
            expect(engine._getSearchIndex).toHaveBeenCalledTimes(1);
        });

        test('._getSearchIndex() is called with the main model constructor', () => {
            expect(engine._getSearchIndex).toHaveBeenCalledWith(model.constructor);
        });

        test('._putSearchIndex() is called once', () => {
            expect(engine._putSearchIndex).toHaveBeenCalledTimes(1);
        });

        test('._putSearchIndex() is called with the main model removed', () => {
            expect(engine._putSearchIndex).toHaveBeenCalledWith(model.constructor, {});
        });
    });

    describe('when a model with a non-required circular link exists', () => {
        const model = CircularLinkedModelFactory();
        const engine = new TestStorageEngine({}, [CircularLinkedModel]);

        beforeAll(async () => {
            engine._getModel.mockImplementation((id) => {
                if (id === model.id) return Promise.resolve(model);
                if (id === model.linked.id) return Promise.resolve(model.linked);
                return Promise.reject(new ModelNotFoundStorageEngineError(id));
            });
            engine._getIndex.mockResolvedValue({
                [model.id]: model.toIndexData(),
                [model.linked.id]: model.linked.toIndexData(),
            });
            await engine.delete(model);
        });

        test('._getModel() is called twice', () => {
            expect(engine._getModel).toHaveBeenCalledTimes(2);
        });

        test('._getModel() is called with the main model id', () => {
            expect(engine._getModel).toHaveBeenCalledWith(model.id);
        });

        test('._getModel() is called with the linked model id', () => {
            expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
        });

        test('._deleteModel() is called once', () => {
            expect(engine._deleteModel).toHaveBeenCalledTimes(1);
        });

        test('._deleteModel() is called with the main model', () => {
            expect(engine._deleteModel).toHaveBeenCalledWith(model.id);
        });

        test('._putModel() is called once', () => {
            expect(engine._putModel).toHaveBeenCalledTimes(1);
        });

        test('._putModel() is called with the linked model without the linked property', () => {
            expect(engine._putModel).toHaveBeenCalledWith({
                id: model.linked.id,
                string: model.linked.string,
                linked: undefined,
            });
        });

        test('._getIndex() is called once', () => {
            expect(engine._getIndex).toHaveBeenCalledTimes(1);
        });

        test('._getIndex() is called with the circular model', () => {
            expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModel);
        });

        test('._putIndex() is called once', () => {
            expect(engine._putIndex).toHaveBeenCalledTimes(1);
        });

        test('._putIndex() is called with the circular model without the linked model', () => {
            expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModel, {
                [model.linked.id]: _.omit(model.linked.toIndexData(), 'linked'),
            });
        });
    });

    describe('when a model with a non-required circular link with a search index exists', () => {
        const model = CircularLinkedModelWithSearchIndexFactory();
        const engine = new TestStorageEngine({}, [CircularLinkedModelWithSearchIndex]);

        beforeAll(async () => {
            engine._getModel.mockImplementation((id) => {
                if (id === model.id) return Promise.resolve(model);
                if (id === model.linked.id) return Promise.resolve(model.linked);
                return Promise.reject(new ModelNotFoundStorageEngineError(id));
            });
            engine._getIndex.mockResolvedValue({
                [model.id]: model.toIndexData(),
                [model.linked.id]: model.linked.toIndexData(),
            });
            await engine.delete(model);
        });

        test('._getModel() is called twice', () => {
            expect(engine._getModel).toHaveBeenCalledTimes(2);
        });

        test('._getModel() is called with the main model id', () => {
            expect(engine._getModel).toHaveBeenCalledWith(model.id);
        });

        test('._getModel() is called with the linked model id', () => {
            expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
        });

        test('._deleteModel() is called once', () => {
            expect(engine._deleteModel).toHaveBeenCalledTimes(1);
        });

        test('._deleteModel() is called with the main model', () => {
            expect(engine._deleteModel).toHaveBeenCalledWith(model.id);
        });

        test('._putModel() is called once', () => {
            expect(engine._putModel).toHaveBeenCalledTimes(1);
        });

        test('._putModel() is called with the linked model without the linked property', () => {
            expect(engine._putModel).toHaveBeenCalledWith({
                id: model.linked.id,
                string: model.linked.string,
                linked: undefined,
            });
        });

        test('._getIndex() is called once', () => {
            expect(engine._getIndex).toHaveBeenCalledTimes(1);
        });

        test('._getIndex() is called with the circular model', () => {
            expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
        });

        test('._putIndex() is called once', () => {
            expect(engine._putIndex).toHaveBeenCalledTimes(1);
        });

        test('._putIndex() is called with the circular model', () => {
            expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                [model.linked.id]: _.omit(model.linked.toIndexData(), 'linked'),
            });
        });

        test('._getSearchIndex() is called once', () => {
            expect(engine._getSearchIndex).toHaveBeenCalledTimes(1);
        });

        test('._getSearchIndex() is called with the circular model', () => {
            expect(engine._getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
        });

        test('._putSearchIndex() is called once', () => {
            expect(engine._putSearchIndex).toHaveBeenCalledTimes(1);
        });

        test('._putSearchIndex() is called with the circular model', () => {
            expect(engine._putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                [model.linked.id]: _.omit(model.linked.toSearchData(), 'linked'),
            });
        });
    });

    describe('when a model with a required circular link with a search index exists', () => {
        describe('and .delete() is called without propagate', () => {
            const model = CircularRequiredLinkedModelWithSearchIndexFactory();
            const engine = new TestStorageEngine({}, [CircularRequiredLinkedModelWithSearchIndex]);

            beforeAll(() => {
                engine._getModel.mockImplementation((id) => {
                    if (id === model.id) return Promise.resolve(model);
                    if (id === model.linked.id) return Promise.resolve(model.linked);
                    return Promise.reject(new ModelNotFoundStorageEngineError(id));
                });
                engine._getIndex.mockResolvedValue({
                    [model.id]: model.toIndexData(),
                    [model.linked.id]: model.linked.toIndexData(),
                });
            });

            test('.delete() throws a cannot delete error', async () => {
                await expect(() => engine.delete(model)).rejects.toMatchObject({
                    message: `Deleting ${model.id} has unintended consequences`,
                    consequences: {
                        willDelete: [model.linked.id],
                    },
                });
            });

            test('._getModel() is called twice', () => {
                expect(engine._getModel).toHaveBeenCalledTimes(2);
            });

            test('._getModel() is called with the main model id', () => {
                expect(engine._getModel).toHaveBeenCalledWith(model.id);
            });

            test('._getModel() is called with the linked model id', () => {
                expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('._deleteModel() is not called', () => {
                expect(engine._deleteModel).not.toHaveBeenCalled();
            });

            test('._putModel() is not called', () => {
                expect(engine._putModel).not.toHaveBeenCalled();
            });

            test('._getIndex() is called once', () => {
                expect(engine._getIndex).toHaveBeenCalledTimes(1);
            });

            test('._getIndex() is called with the circular model', () => {
                expect(engine._getIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex);
            });

            test('._putIndex() is not called', () => {
                expect(engine._putIndex).not.toHaveBeenCalled();
            });

            test('._getSearchIndex() is not called', () => {
                expect(engine._getSearchIndex).not.toHaveBeenCalled();
            });

            test('._putSearchIndex() is not called', () => {
                expect(engine._putSearchIndex).not.toHaveBeenCalled();
            });
        });

        describe('and .delete() is called with propagate', () => {
            const model = CircularRequiredLinkedModelWithSearchIndexFactory();
            const engine = new TestStorageEngine({}, [CircularRequiredLinkedModelWithSearchIndex]);

            beforeAll(async () => {
                engine._getModel.mockImplementation((id) => {
                    if (id === model.id) return Promise.resolve(model);
                    if (id === model.linked.id) return Promise.resolve(model.linked);
                    return Promise.reject(new ModelNotFoundStorageEngineError(id));
                });
                engine._getIndex.mockResolvedValue({
                    [model.id]: model.toIndexData(),
                    [model.linked.id]: model.linked.toIndexData(),
                });
                await engine.delete(model, [model.linked.id]);
            });

            test('._getModel() is called twice', () => {
                expect(engine._getModel).toHaveBeenCalledTimes(2);
            });

            test('._getModel() is called with the main model id', () => {
                expect(engine._getModel).toHaveBeenCalledWith(model.id);
            });

            test('._getModel() is called with the linked model id', () => {
                expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('._deleteModel() is called twice', () => {
                expect(engine._deleteModel).toHaveBeenCalledTimes(2);
            });

            test('._deleteModel() is called with the main model', () => {
                expect(engine._deleteModel).toHaveBeenCalledWith(model.id);
            });

            test('._deleteModel() is called with the linked model', () => {
                expect(engine._deleteModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('._putModel() is not called', () => {
                expect(engine._putModel).not.toHaveBeenCalled();
            });

            test('._getIndex() is called once', () => {
                expect(engine._getIndex).toHaveBeenCalledTimes(1);
            });

            test('._getIndex() is called with the circular model', () => {
                expect(engine._getIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex);
            });

            test('._putIndex() is called once', () => {
                expect(engine._putIndex).toHaveBeenCalledTimes(1);
            });

            test('._putIndex() is called with an empty index', () => {
                expect(engine._putIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex, {});
            });

            test('._getSearchIndex() is called once', () => {
                expect(engine._getSearchIndex).toHaveBeenCalledTimes(1);
            });

            test('._getSearchIndex() is called with the circular model', () => {
                expect(engine._getSearchIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex);
            });

            test('._putSearchIndex() is called once', () => {
                expect(engine._putSearchIndex).toHaveBeenCalledTimes(1);
            });

            test('._putSearchIndex() is called with an empty index', () => {
                expect(engine._putSearchIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex, {});
            });
        });
    });

    describe('when a model with a required normal link with a search index exists', () => {
        describe('and .delete() is called without propagate', () => {
            const model = RequiredLinkedModelWithSearchIndexFactory();
            const engine = new TestStorageEngine({}, [RequiredLinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

            beforeAll(() => {
                engine._getModel.mockImplementation((id) => {
                    if (id === model.id) return Promise.resolve(model);
                    if (id === model.linked.id) return Promise.resolve(model.linked);
                    return Promise.reject(new ModelNotFoundStorageEngineError(id));
                });
                engine._getIndex.mockResolvedValue({
                    [model.id]: model.toIndexData(),
                    [model.linked.id]: model.linked.toIndexData(),
                });
            });

            test('.delete() throws a cannot delete error', async () => {
                await expect(() => engine.delete(model.linked))
                    .rejects.toMatchObject({
                        message: `Deleting ${model.linked.id} has unintended consequences`,
                        consequences: {willDelete: [model.id]},
                    });
            });

            test('._getModel() is called twice', () => {
                expect(engine._getModel).toHaveBeenCalledTimes(2);
            });

            test('._getModel() is called with the main model id', () => {
                expect(engine._getModel).toHaveBeenCalledWith(model.id);
            });

            test('._getModel() is called with the linked model id', () => {
                expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('._deleteModel() is not called', () => {
                expect(engine._deleteModel).not.toHaveBeenCalled();
            });

            test('._putModel() is not called', () => {
                expect(engine._putModel).not.toHaveBeenCalled();
            });

            test('._getIndex() is called once', () => {
                expect(engine._getIndex).toHaveBeenCalledTimes(1);
            });

            test('._getIndex() is called with the circular model', () => {
                expect(engine._getIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex);
            });

            test('._putIndex() is not called', () => {
                expect(engine._putIndex).not.toHaveBeenCalled();
            });

            test('._getSearchIndex() is not called', () => {
                expect(engine._getSearchIndex).not.toHaveBeenCalled();
            });

            test('._putSearchIndex() is not called', () => {
                expect(engine._putSearchIndex).not.toHaveBeenCalled();
            });
        });

        describe('and .delete() is called with propagate', () => {
            const model = RequiredLinkedModelWithSearchIndexFactory();
            const engine = new TestStorageEngine({}, [RequiredLinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

            beforeAll(async () => {
                engine._getModel.mockImplementation((id) => {
                    if (id === model.id) return Promise.resolve(model);
                    if (id === model.linked.id) return Promise.resolve(model.linked);
                    return Promise.reject(new ModelNotFoundStorageEngineError(id));
                });
                engine._getIndex.mockImplementation((constructor) => {
                    if (constructor === RequiredLinkedModelWithSearchIndex) {
                        return Promise.resolve({
                            [model.id]: model.toIndexData(),
                        });
                    }
                    if (constructor === SimpleModelWithSearchIndex) {
                        return Promise.resolve({
                            [model.linked.id]: model.linked.toIndexData(),
                        });
                    }
                    return Promise.resolve({});
                });
                await engine.delete(model.linked, [model.id]);
            });

            test('._getModel() is called twice', () => {
                expect(engine._getModel).toHaveBeenCalledTimes(2);
            });

            test('._getModel() is called with the main model id', () => {
                expect(engine._getModel).toHaveBeenCalledWith(model.id);
            });

            test('._getModel() is called with the linked model id', () => {
                expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('._deleteModel() is called twice', () => {
                expect(engine._deleteModel).toHaveBeenCalledTimes(2);
            });

            test('._deleteModel() is called with the main model', () => {
                expect(engine._deleteModel).toHaveBeenCalledWith(model.id);
            });

            test('._deleteModel() is called with the linked model', () => {
                expect(engine._deleteModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('._putModel() is not called', () => {
                expect(engine._putModel).not.toHaveBeenCalled();
            });

            test('._getIndex() is called once', () => {
                expect(engine._getIndex).toHaveBeenCalledTimes(2);
            });

            test('._getIndex() is called with the main model', () => {
                expect(engine._getIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex);
            });

            test('._getIndex() is called with the linked model', () => {
                expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('._putIndex() is called once', () => {
                expect(engine._putIndex).toHaveBeenCalledTimes(2);
            });

            test('._putIndex() is called with an empty main model index', () => {
                expect(engine._putIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex, {});
            });

            test('._putIndex() is called with an empty linked model index', () => {
                expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {});
            });

            test('._getSearchIndex() is called twice', () => {
                expect(engine._getSearchIndex).toHaveBeenCalledTimes(2);
            });

            test('._getSearchIndex() is called with the main model', () => {
                expect(engine._getSearchIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex);
            });

            test('._getSearchIndex() is called with the linked model', () => {
                expect(engine._getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('._putSearchIndex() is called twice', () => {
                expect(engine._putSearchIndex).toHaveBeenCalledTimes(2);
            });

            test('._putSearchIndex() is called with an empty index for the main model', () => {
                expect(engine._putSearchIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex, {});
            });

            test('._putSearchIndex() is called with an empty index for the linked model', () => {
                expect(engine._putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {});
            });
        });
    });
});
