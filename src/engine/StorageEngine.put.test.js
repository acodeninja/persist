import {
    CircularLinkedModel,
    CircularLinkedModelFactory,
    CircularLinkedModelWithIndex,
    CircularLinkedModelWithIndexFactory,
    CircularLinkedModelWithSearchIndex,
    CircularLinkedModelWithSearchIndexFactory,
    LinkedModel,
    LinkedModelFactory,
    LinkedModelWithIndex,
    LinkedModelWithIndexFactory,
    LinkedModelWithSearchIndex,
    LinkedModelWithSearchIndexFactory,
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

describe('StorageEngine.put(model)', () => {
    describe('when the model is not registered', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({}, []);

        test('.put(model) throws a ModelNotRegisteredStorageEngineError', async () => {
            await expect(() => engine.put(model))
                .rejects.toThrowError({
                    instanceOf: ModelNotRegisteredStorageEngineError,
                    message: 'The model SimpleModel is not registered in the storage engine TestStorageEngine',
                });
        });
    });

    describe('when the model is a simple model', () => {
        describe('without any index', () => {
            describe('and the model does not exist', () => {
                const model = SimpleModelFactory();
                const engine = new TestStorageEngine({}, [SimpleModel]);

                beforeAll(() => engine.put(model));

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.toData());
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = SimpleModelFactory();
                const engine = new TestStorageEngine({}, [SimpleModel]);

                beforeAll(async () => {
                    engine._getModel.mockResolvedValueOnce(model);
                    await engine.put(model);
                });

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._putModel() is not called', () => {
                    expect(engine._putModel).not.toHaveBeenCalled();
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and is changed', () => {
                const existingModel = SimpleModelFactory();
                const editedModel = SimpleModelFactory();
                editedModel.id = existingModel.id;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine({}, [SimpleModel]);

                beforeAll(async () => {
                    engine._getModel.mockResolvedValueOnce(existingModel);
                    await engine.put(editedModel);
                });

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with an index', () => {
            describe('and the model does not exist', () => {
                const model = SimpleModelWithIndexFactory();
                const engine = new TestStorageEngine({}, [SimpleModelWithIndex]);

                beforeAll(() => engine.put(model));

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.toData());
                });

                test('._getIndex() is called', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('._putIndex() is called with the updated index', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = SimpleModelWithIndexFactory();
                const engine = new TestStorageEngine({}, [SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine._getModel.mockResolvedValueOnce(model);
                    await engine.put(model);
                });

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._putModel() is not called', () => {
                    expect(engine._putModel).not.toHaveBeenCalled();
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and an indexed field is changed', () => {
                const existingModel = SimpleModelWithIndexFactory();
                const editedModel = SimpleModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine({}, [SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine._getModel.mockResolvedValueOnce(existingModel);
                    await engine.put(editedModel);
                });

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._getIndex() is called', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('._putIndex() is called with the updated index', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                describe('and the index already contains other models', () => {
                    const alreadyIndexedModel = SimpleModelWithIndexFactory();
                    const existingModel = SimpleModelWithIndexFactory();
                    const editedModel = SimpleModelWithIndexFactory();
                    editedModel.id = existingModel.id;
                    editedModel.string = 'updated';

                    const engine = new TestStorageEngine({}, [SimpleModelWithIndex]);

                    beforeAll(async () => {
                        engine._getModel.mockResolvedValueOnce(existingModel);
                        engine._getIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                        });
                        await engine.put(editedModel);
                    });

                    test('._getIndex() is called', () => {
                        expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                    });

                    test('._putIndex() is called with the updated index', () => {
                        expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [editedModel.id]: editedModel.toIndexData(),
                        });
                    });
                });
            });

            describe('and the model exists and an non-indexed field is changed', () => {
                const existingModel = SimpleModelWithIndexFactory();
                const editedModel = SimpleModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.boolean = false;

                const engine = new TestStorageEngine({}, [SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine._getModel.mockResolvedValueOnce(existingModel);
                    await engine.put(editedModel);
                });

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with a search index', () => {
            describe('and the model does not exist', () => {
                const model = SimpleModelWithSearchIndexFactory();
                const engine = new TestStorageEngine({}, [SimpleModelWithSearchIndex]);

                beforeAll(() => engine.put(model));

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.toData());
                });

                test('._getIndex() is called', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putIndex() is called with the updated index', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('._getSearchIndex() is called', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putSearchIndex() is called with the updated index', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.id]: model.toSearchData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = SimpleModelWithSearchIndexFactory();
                const engine = new TestStorageEngine({}, [SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine._getModel.mockResolvedValueOnce(model);
                    await engine.put(model);
                });

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._putModel() is not called', () => {
                    expect(engine._putModel).not.toHaveBeenCalled();
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
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

            describe('and the model exists and an indexed field is changed', () => {
                const existingModel = SimpleModelWithSearchIndexFactory();
                const editedModel = SimpleModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine({}, [SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine._getModel.mockResolvedValueOnce(existingModel);
                    await engine.put(editedModel);
                });

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._getIndex() is called', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putIndex() is called with the updated index', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('._getSearchIndex() is called', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putSearchIndex() is called with the updated index', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toSearchData(),
                    });
                });

                describe('and the index already contains other models', () => {
                    const alreadyIndexedModel = SimpleModelWithSearchIndexFactory();
                    const existingModel = SimpleModelWithSearchIndexFactory();
                    const editedModel = SimpleModelWithSearchIndexFactory();
                    editedModel.id = existingModel.id;
                    editedModel.string = 'updated';

                    const engine = new TestStorageEngine({}, [SimpleModelWithSearchIndex]);

                    beforeAll(async () => {
                        engine._getModel.mockResolvedValueOnce(existingModel);
                        engine._getIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                        });
                        engine._getSearchIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toSearchData(),
                        });
                        await engine.put(editedModel);
                    });

                    test('._getIndex() is called', () => {
                        expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                    });

                    test('._putIndex() is called with the updated index', () => {
                        expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [editedModel.id]: editedModel.toIndexData(),
                        });
                    });

                    test('._getSearchIndex() is called', () => {
                        expect(engine._getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                    });

                    test('._putSearchIndex() is called with the updated index', () => {
                        expect(engine._putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toSearchData(),
                            [editedModel.id]: editedModel.toSearchData(),
                        });
                    });
                });
            });

            describe('and the model exists and an non-indexed field is changed', () => {
                const existingModel = SimpleModelWithSearchIndexFactory();
                const editedModel = SimpleModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.boolean = false;

                const engine = new TestStorageEngine({}, [SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine._getModel.mockResolvedValueOnce(existingModel);
                    await engine.put(editedModel);
                });

                test('._getModel() is called once', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(1);
                });

                test('._getModel() is called with the model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
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
        });
    });

    describe('when the model is a model with links', () => {
        describe('without an index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelFactory();
                const engine = new TestStorageEngine({}, [LinkedModel, SimpleModel]);

                beforeAll(() => engine.put(model));

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('._putModel() is called twice', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(2);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.toData());
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelFactory();
                const engine = new TestStorageEngine({}, [LinkedModel, SimpleModel]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(model);
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

                test('._putModel() is not called', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(0);
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = LinkedModelFactory();
                const editedModel = LinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine({}, [LinkedModel, SimpleModel]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._putModel() is not called with the linked model\'s data', () => {
                    expect(engine._putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex(modelConstructor) is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex(modelConstructor, data) is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = LinkedModelFactory();
                const editedModel = LinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = new TestStorageEngine({}, [LinkedModel, SimpleModel]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });
                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is not called with the main model\'s data', () => {
                    expect(engine._putModel).not.toHaveBeenCalledWith(editedModel.toData());
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with an index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelWithIndexFactory();
                const engine = new TestStorageEngine({}, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(() => engine.put(model));

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('._putModel() is called twice', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(2);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.toData());
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('._getIndex() is called twice', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(2);
                });

                test('._getIndex() is called for the main model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(LinkedModelWithIndex);
                });

                test('._getIndex() is called for the linked model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('._putIndex() is called twice', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(2);
                });

                test('._putIndex() is called for the main model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(LinkedModelWithIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('._putIndex() is called for the linked model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelWithIndexFactory();
                const engine = new TestStorageEngine({}, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(model);
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

                test('._putModel() is not called', () => {
                    expect(engine._putModel).not.toHaveBeenCalled();
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = LinkedModelWithIndexFactory();
                const editedModel = LinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine({}, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._putModel() is not called with the linked model\'s data', () => {
                    expect(engine._putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is called once', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is called for the main model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(LinkedModelWithIndex);
                });

                test('._getIndex() is not called for the linked model', () => {
                    expect(engine._getIndex).not.toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is called for the main model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(LinkedModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('._putIndex() is not called for the linked model', () => {
                    expect(engine._putIndex).not.toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = LinkedModelWithIndexFactory();
                const editedModel = LinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = new TestStorageEngine({}, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is called once', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is not called for the main model', () => {
                    expect(engine._getIndex).not.toHaveBeenCalledWith(LinkedModelWithIndex);
                });

                test('._getIndex() is called for the linked model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is not called for the main model', () => {
                    expect(engine._putIndex).not.toHaveBeenCalledWith(LinkedModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('._putIndex() is called for the linked model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });
            });
        });

        describe('with a search index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelWithSearchIndexFactory();
                const engine = new TestStorageEngine({}, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(() => engine.put(model));

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('._putModel() is called twice', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(2);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.toData());
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('._getIndex() is called twice', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(2);
                });

                test('._getIndex() is called for the main model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('._getIndex() is called for the linked model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putIndex() is called twice', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(2);
                });

                test('._putIndex() is called for the main model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('._putIndex() is called for the linked model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });

                test('._getSearchIndex() is called twice', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledTimes(2);
                });

                test('._getSearchIndex() is called for the main model', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('._getSearchIndex() is called for the linked model', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putSearchIndex() is called with the updated index for the main model', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [model.id]: model.toSearchData(),
                    });
                });

                test('._putSearchIndex() is called with the updated index for the linked model', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.linked.id]: model.linked.toSearchData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelWithSearchIndexFactory();
                const engine = new TestStorageEngine({}, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(model);
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

                test('._putModel() is not called', () => {
                    expect(engine._putModel).not.toHaveBeenCalled();
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
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

            describe('and the model exists and the main model is changed', () => {
                const existingModel = LinkedModelWithSearchIndexFactory();
                const editedModel = LinkedModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine({}, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._putModel() is not called with the linked model\'s data', () => {
                    expect(engine._putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is called once', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is called for the main model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('._getIndex() is not called for the linked model', () => {
                    expect(engine._getIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is called for the main model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('._putIndex() is not called for the linked model', () => {
                    expect(engine._putIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });

                test('._getSearchIndex() is called twice', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._getSearchIndex() is called for the main model', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('._getSearchIndex() is not called for the linked model', () => {
                    expect(engine._getSearchIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putSearchIndex() is called once', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._putSearchIndex() is called with the updated index for the main model', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toSearchData(),
                    });
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = LinkedModelWithSearchIndexFactory();
                const editedModel = LinkedModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = new TestStorageEngine({}, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is called once', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is not called for the main model', () => {
                    expect(engine._getIndex).not.toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('._getIndex() is called for the linked model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is not called for the main model', () => {
                    expect(engine._putIndex).not.toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('._putIndex() is called for the linked model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });

                test('._getSearchIndex() is called once', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._getSearchIndex() is not called for the main model', () => {
                    expect(engine._getSearchIndex).not.toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('._getSearchIndex() is called for the linked model', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('._putSearchIndex() is called once', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._putSearchIndex() is called with the updated index for the linked model', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [editedModel.linked.id]: editedModel.linked.toSearchData(),
                    });
                });
            });
        });
    });

    describe('when the model is a model with circular links', () => {
        describe('without an index', () => {
            describe('and both models do not exist', () => {
                const model = CircularLinkedModelFactory();
                const engine = new TestStorageEngine({}, [CircularLinkedModel]);

                beforeAll(() => engine.put(model));

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('._putModel() is called twice', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(2);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.toData());
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = CircularLinkedModelFactory();
                const engine = new TestStorageEngine({}, [CircularLinkedModel]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(model);
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

                test('._putModel() is not called', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(0);
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = CircularLinkedModelFactory();
                const editedModel = CircularLinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine({}, [CircularLinkedModel]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._putModel() is not called with the linked model\'s data', () => {
                    expect(engine._putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex(modelConstructor) is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex(modelConstructor, data) is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = CircularLinkedModelFactory();
                const editedModel = CircularLinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = new TestStorageEngine({}, [CircularLinkedModel]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });
                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is not called with the main model\'s data', () => {
                    expect(engine._putModel).not.toHaveBeenCalledWith(editedModel.toData());
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with an index', () => {
            describe('and both models do not exist', () => {
                const model = CircularLinkedModelWithIndexFactory();
                const engine = new TestStorageEngine({}, [CircularLinkedModelWithIndex]);

                beforeAll(() => engine.put(model));

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('._putModel() is called twice', () => {

                    expect(engine._putModel).toHaveBeenCalledTimes(2);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.toData());
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('._getIndex() is called twice', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is called for the circular model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is called for the main and linked models', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [model.id]: model.toIndexData(),
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = CircularLinkedModelWithIndexFactory();
                const engine = new TestStorageEngine({}, [CircularLinkedModelWithIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(model);
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

                test('._putModel() is not called', () => {
                    expect(engine._putModel).not.toHaveBeenCalled();
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
                });

                test('._putIndex() is not called', () => {
                    expect(engine._putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = CircularLinkedModelWithIndexFactory();
                const editedModel = CircularLinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine({}, [CircularLinkedModelWithIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._putModel() is not called with the linked model\'s data', () => {
                    expect(engine._putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is called once', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is called for the main model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is called for the main model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('._putIndex() is not called for the linked model', () => {
                    expect(engine._putIndex).not.toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });

                describe('and the index already contains other models', () => {
                    const alreadyIndexedModel = CircularLinkedModelWithIndexFactory();
                    const existingModel = CircularLinkedModelWithIndexFactory();
                    const editedModel = CircularLinkedModelWithIndexFactory();
                    editedModel.id = existingModel.id;
                    editedModel.linked.id = existingModel.linked.id;
                    editedModel.string = 'updated';

                    const engine = new TestStorageEngine({}, [CircularLinkedModelWithIndex]);

                    beforeAll(async () => {
                        engine._getModel.mockImplementation(id => {
                            if (id === existingModel.id) return Promise.resolve(existingModel);
                            if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                            return Promise.reject(new ModelNotFoundStorageEngineError(id));
                        });
                        engine._getIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toIndexData(),
                        });
                        await engine.put(editedModel);
                    });

                    test('._getIndex() is called', () => {
                        expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex);
                    });

                    test('._putIndex() is called with the updated index', () => {
                        expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toIndexData(),
                            [editedModel.id]: editedModel.toIndexData(),
                        });
                    });
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = CircularLinkedModelWithIndexFactory();
                const editedModel = CircularLinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = new TestStorageEngine({}, [CircularLinkedModelWithIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is called once', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is called for the linked model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is not called for the main model', () => {
                    expect(engine._putIndex).not.toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('._putIndex() is called for the linked model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });
            });
        });

        describe('with a search index', () => {
            describe('and both models do not exist', () => {
                const model = CircularLinkedModelWithSearchIndexFactory();
                const engine = new TestStorageEngine({}, [CircularLinkedModelWithSearchIndex]);

                beforeAll(() => engine.put(model));

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('._putModel() is called twice', () => {

                    expect(engine._putModel).toHaveBeenCalledTimes(2);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.toData());
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('._getIndex() is called twice', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is called for the circular model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is called for the main and linked models', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });

                test('._getSearchIndex() is called twice', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._getSearchIndex() is called for the circular model', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('._putSearchIndex() is called once', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._putSearchIndex() is called for the main and linked models', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [model.id]: model.toSearchData(),
                        [model.linked.id]: model.linked.toSearchData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = CircularLinkedModelWithSearchIndexFactory();
                const engine = new TestStorageEngine({}, [CircularLinkedModelWithSearchIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(model);
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

                test('._putModel() is not called', () => {
                    expect(engine._putModel).not.toHaveBeenCalled();
                });

                test('._getIndex() is not called', () => {
                    expect(engine._getIndex).not.toHaveBeenCalled();
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

            describe('and the model exists and the main model is changed', () => {
                const existingModel = CircularLinkedModelWithSearchIndexFactory();
                const editedModel = CircularLinkedModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine({}, [CircularLinkedModelWithSearchIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the main model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('._putModel() is not called with the linked model\'s data', () => {
                    expect(engine._putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is called once', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is called for the main model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is called for the main model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('._getSearchIndex() is called once', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._getSearchIndex() is called for the main model', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('._putSearchIndex() is called once', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._putSearchIndex() is called for the main model', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toSearchData(),
                    });
                });

                describe('and the index already contains other models', () => {
                    const alreadyIndexedModel = CircularLinkedModelWithSearchIndexFactory();
                    const existingModel = CircularLinkedModelWithSearchIndexFactory();
                    const editedModel = CircularLinkedModelWithSearchIndexFactory();
                    editedModel.id = existingModel.id;
                    editedModel.linked.id = existingModel.linked.id;
                    editedModel.string = 'updated';

                    const engine = new TestStorageEngine({}, [CircularLinkedModelWithSearchIndex]);

                    beforeAll(async () => {
                        engine._getModel.mockImplementation(id => {
                            if (id === existingModel.id) return Promise.resolve(existingModel);
                            if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                            return Promise.reject(new ModelNotFoundStorageEngineError(id));
                        });
                        engine._getIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toIndexData(),
                        });
                        engine._getSearchIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toSearchData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toSearchData(),
                        });
                        await engine.put(editedModel);
                    });

                    test('._getIndex() is called', () => {
                        expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                    });

                    test('._putIndex() is called with the updated index', () => {
                        expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toIndexData(),
                            [editedModel.id]: editedModel.toIndexData(),
                        });
                    });

                    test('._getSearchIndex() is called', () => {
                        expect(engine._getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                    });

                    test('._putSearchIndex() is called with the updated index', () => {
                        expect(engine._putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toSearchData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toSearchData(),
                            [editedModel.id]: editedModel.toSearchData(),
                        });
                    });
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = CircularLinkedModelWithSearchIndexFactory();
                const editedModel = CircularLinkedModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = new TestStorageEngine({}, [CircularLinkedModelWithSearchIndex]);

                beforeAll(async () => {
                    engine._getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await engine.put(editedModel);
                });

                test('._getModel() is called twice', () => {
                    expect(engine._getModel).toHaveBeenCalledTimes(2);
                });

                test('._getModel() is called with the main model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('._getModel() is called with the linked model id', () => {
                    expect(engine._getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('._putModel() is called once', () => {
                    expect(engine._putModel).toHaveBeenCalledTimes(1);
                });

                test('._putModel() is called with the linked model\'s data', () => {
                    expect(engine._putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('._getIndex() is called once', () => {
                    expect(engine._getIndex).toHaveBeenCalledTimes(1);
                });

                test('._getIndex() is called for the linked model', () => {
                    expect(engine._getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('._putIndex() is called once', () => {
                    expect(engine._putIndex).toHaveBeenCalledTimes(1);
                });

                test('._putIndex() is not called for the main model', () => {
                    expect(engine._putIndex).not.toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('._putIndex() is called for the linked model', () => {
                    expect(engine._putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });

                test('._getSearchIndex() is called once', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._getSearchIndex() is called for the linked model', () => {
                    expect(engine._getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('._putSearchIndex() is called once', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('._putSearchIndex() is not called for the main model', () => {
                    expect(engine._putSearchIndex).not.toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toSearchData(),
                    });
                });

                test('._putSearchIndex() is called for the linked model', () => {
                    expect(engine._putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.linked.id]: editedModel.linked.toSearchData(),
                    });
                });
            });
        });
    });
});
