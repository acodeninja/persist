import {
    CircularLinkedModel,
    CircularLinkedModelFactory,
    CircularLinkedModelWithIndex,
    CircularLinkedModelWithIndexFactory,
    CircularLinkedModelWithSearchIndex,
    CircularLinkedModelWithSearchIndexFactory,
    CircularManyLinkedModel,
    CircularManyLinkedModelFactory,
    CircularRequiredLinkedModelWithSearchIndex,
    CircularRequiredLinkedModelWithSearchIndexFactory,
    LinkedManyModelWithIndex,
    LinkedManyModelWithIndexFactory,
    LinkedModel,
    LinkedModelFactory,
    LinkedModelWithIndex,
    LinkedModelWithIndexFactory,
    LinkedModelWithSearchIndex,
    LinkedModelWithSearchIndexFactory,
    RequiredLinkedModelWithSearchIndex,
    RequiredLinkedModelWithSearchIndexFactory,
    SimpleModel,
    SimpleModelFactory,
    SimpleModelWithFullIndex,
    SimpleModelWithFullIndexFactory,
    SimpleModelWithIndex,
    SimpleModelWithIndexFactory,
    SimpleModelWithSearchIndex,
    SimpleModelWithSearchIndexFactory,
} from '../test/fixtures/Model.js';
import Connection, {
    CommitFailedTransactionError,
    MissingArgumentsConnectionError,
    ModelNotRegisteredConnectionError,
} from './Connection.js';
import {beforeAll, describe, expect, test} from '@jest/globals';
import {ModelNotFoundStorageEngineError} from './engine/storage/StorageEngine.js';
import {SearchResult} from './data/SearchIndex.js';
import {TestStorageEngine} from '../test/fixtures/Engine.js';
import _ from 'lodash';

describe('new Connection', () => {
    describe('when no storage engine is given', () => {
        test('throws an error', () => {
            expect(() => new Connection).toThrow({
                instanceOf: MissingArgumentsConnectionError,
                message: 'No storage engine provided',
            });
        });
    });
});

describe('connection.get()', () => {
    describe('when a model is not registered', () => {
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, []);
        const modelId = 'UnregisteredModel/111111111111';

        test('throws a ModelNotRegisteredConnectionError', async () => {
            await expect(() => connection.get(modelId))
                .rejects.toThrow({
                    instanceOf: ModelNotRegisteredConnectionError,
                    message: 'The model UnregisteredModel is not registered in the storage engine TestStorageEngine',
                });
        });

        test('does not call engine.getModel()', () => {
            expect(engine.getModel).not.toHaveBeenCalled();
        });
    });

    describe('when a model does not exist', () => {
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [SimpleModel]);
        const modelId = 'SimpleModel/111111111111';

        beforeAll(() => engine.getModel.mockRejectedValue(new ModelNotFoundStorageEngineError(modelId)));

        test('throws a ModelNotFoundStorageEngineError', async () => {
            await expect(() => connection.get(modelId))
                .rejects.toThrow({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: 'The model SimpleModel/111111111111 was not found',
                });
        });

        test('calls engine.getModel()', () => {
            expect(engine.getModel).toHaveBeenCalledWith(modelId);
        });
    });

    describe('when a model exists', () => {
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [SimpleModel]);
        const model = SimpleModelFactory();

        beforeAll(() => {
            engine.getModel.mockResolvedValue(model.toData());
        });

        test('returns the model', async () => {
            expect(await connection.get(model.id)).toEqual(model);
        });

        test('calls engine.getModel()', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });
    });
});

describe('connection.hydrate()', () => {
    describe('when a model with many links exists', () => {
        const model = LinkedManyModelWithIndexFactory();
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [
            LinkedManyModelWithIndex,
            SimpleModelWithIndex,
        ]);

        const dryModel = new LinkedManyModelWithIndex();
        dryModel.id = model.id;

        engine.getModel.mockImplementation(id => {
            if (id === model.id) return Promise.resolve(model.toData());
            if (model.linked.map(l => l.id).includes(id)) return Promise.resolve(model.linked.find(l => l.id === id)?.toData());
            return Promise.reject(new ModelNotFoundStorageEngineError(id));
        });

        test('returns the full model', async () => {
            expect(await connection.hydrate(dryModel)).toStrictEqual(model);
        });

        test('calls engine.getModel() twice', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(2);
        });

        test('calls engine.getModel() with the main model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('calls engine.getModel() with the linked model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.linked[0].id);
        });
    });

    describe('when a model with one to one links exists', () => {
        const model = LinkedModelWithIndexFactory();
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [
            LinkedModelWithIndex,
            SimpleModelWithIndex,
        ]);

        const dryModel = new LinkedModelWithIndex();
        dryModel.id = model.id;

        engine.getModel.mockImplementation(id => {
            if (id === model.id) return Promise.resolve(model.toData());
            if (id === model.linked.id) return Promise.resolve(model.linked.toData());
            return Promise.reject(new ModelNotFoundStorageEngineError(id));
        });

        test('returns the full model', async () => {
            expect(await connection.hydrate(dryModel)).toStrictEqual(model);
        });

        test('calls engine.getModel() twice', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(2);
        });

        test('calls engine.getModel() with the main model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('calls engine.getModel() with the linked model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
        });
    });

    describe('when a model with circular links exists', () => {
        const model = CircularLinkedModelFactory();
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [
            CircularLinkedModel,
        ]);

        const dryModel = new CircularLinkedModel();
        dryModel.id = model.id;

        engine.getModel.mockImplementation(id => {
            if (id === model.id) return Promise.resolve(model.toData());
            if (id === model.linked.id) return Promise.resolve(model.linked.toData());
            return Promise.reject(new ModelNotFoundStorageEngineError(id));
        });

        test('returns the full model', async () => {
            expect(await connection.hydrate(dryModel)).toStrictEqual(model);
        });

        test('calls engine.getModel() twice', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(2);
        });

        test('calls engine.getModel() with the main model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('calls engine.getModel() with the linked model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
        });
    });

    describe('when a model with circular many links exists', () => {
        const model = CircularManyLinkedModelFactory();
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [
            CircularManyLinkedModel,
        ]);

        const dryModel = new CircularManyLinkedModel();
        dryModel.id = model.id;

        engine.getModel.mockImplementation(id => {
            if (id === model.id) return Promise.resolve(model.toData());
            if (id === model.linked[0].id) return Promise.resolve(model.linked[0].toData());
            return Promise.reject(new ModelNotFoundStorageEngineError(id));
        });

        test('returns the full model', async () => {
            expect(await connection.hydrate(dryModel)).toStrictEqual(model);
        });

        test('calls engine.getModel() twice', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(2);
        });

        test('calls engine.getModel() with the main model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('calls engine.getModel() with the linked model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.linked[0].id);
        });
    });
});

describe('connection.put()', () => {
    describe('when the model is not registered', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({}, []);
        const connection = new Connection(engine, undefined, []);

        test('.put(model) throws a ModelNotRegisteredConnectionError', async () => {
            await expect(() => connection.put(model))
                .rejects.toThrowError({
                    instanceOf: ModelNotRegisteredConnectionError,
                    message: 'The model SimpleModel is not registered in the storage engine TestStorageEngine',
                });
        });
    });

    describe('when the model is a simple model', () => {
        describe('without any index', () => {
            describe('and the model does not exist', () => {
                const model = SimpleModelFactory();
                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModel]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = SimpleModelFactory();
                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModel]);

                beforeAll(async () => {
                    engine.getModel.mockResolvedValueOnce(model.toData());
                    await connection.put(model);
                });

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).not.toHaveBeenCalled();
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and is changed', () => {
                const existingModel = SimpleModelFactory();
                const editedModel = SimpleModelFactory();
                editedModel.id = existingModel.id;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModel]);

                beforeAll(async () => {
                    engine.getModel.mockResolvedValueOnce(existingModel.toData());
                    await connection.put(editedModel);
                });

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with an index', () => {
            describe('and the model does not exist', () => {
                const model = SimpleModelWithIndexFactory();
                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModelWithIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.getIndex() is called', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('.putIndex() is called with the updated index', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = SimpleModelWithIndexFactory();
                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine.getModel.mockResolvedValueOnce(model.toData());
                    await connection.put(model);
                });

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).not.toHaveBeenCalled();
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and an indexed field is changed', () => {
                const existingModel = SimpleModelWithIndexFactory();
                const editedModel = SimpleModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine.getModel.mockResolvedValueOnce(existingModel.toData());
                    await connection.put(editedModel);
                });

                test('.getModel() is called once', async () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.getIndex() is called', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('.putIndex() is called with the updated index', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                describe('and the index already contains other models', () => {
                    const alreadyIndexedModel = SimpleModelWithIndexFactory();
                    const existingModel = SimpleModelWithIndexFactory();
                    const editedModel = SimpleModelWithIndexFactory();
                    editedModel.id = existingModel.id;
                    editedModel.string = 'updated';

                    const engine = new TestStorageEngine();
                    const connection = new Connection(engine, undefined, [SimpleModelWithIndex]);

                    beforeAll(async () => {
                        engine.getModel.mockResolvedValueOnce(existingModel.toData());
                        engine.getIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                        });
                        await connection.put(editedModel);
                    });

                    test('.getIndex() is called', () => {
                        expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                    });

                    test('.putIndex() is called with the updated index', () => {
                        expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
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

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine.getModel.mockResolvedValueOnce(existingModel.toData());
                    await connection.put(editedModel);
                });

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with a search index', () => {
            describe('and the model does not exist', () => {
                const model = SimpleModelWithSearchIndexFactory();
                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.getIndex() is called', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putIndex() is called with the updated index', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putSearchIndex() is called with the updated index', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(
                        SimpleModelWithSearchIndex,
                        {[model.id]: model.toSearchData()},
                    );
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = SimpleModelWithSearchIndexFactory();
                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine.getModel.mockResolvedValueOnce(model.toData());
                    await connection.put(model);
                });

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).not.toHaveBeenCalled();
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and an indexed field is changed', () => {
                const existingModel = SimpleModelWithSearchIndexFactory();
                const editedModel = SimpleModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine.getModel.mockResolvedValueOnce(existingModel.toData());
                    await connection.put(editedModel);
                });

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.getIndex() is called', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putIndex() is called with the updated index', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putSearchIndex() is called with the updated index', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(
                        SimpleModelWithSearchIndex,
                        {[editedModel.id]: editedModel.toSearchData()},
                    );
                });

                describe('and the index already contains other models', () => {
                    const alreadyIndexedModel = SimpleModelWithSearchIndexFactory();
                    const existingModel = SimpleModelWithSearchIndexFactory();
                    const editedModel = SimpleModelWithSearchIndexFactory();
                    editedModel.id = existingModel.id;
                    editedModel.string = 'updated';

                    const engine = new TestStorageEngine();
                    const connection = new Connection(engine, undefined, [SimpleModelWithSearchIndex]);

                    beforeAll(async () => {
                        engine.getModel.mockResolvedValueOnce(existingModel.toData());
                        engine.getIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                        });
                        engine.getSearchIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toSearchData(),
                        });
                        await connection.put(editedModel);
                    });

                    test('.getIndex() is called', () => {
                        expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                    });

                    test('.putIndex() is called with the updated index', () => {
                        expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [editedModel.id]: editedModel.toIndexData(),
                        });
                    });

                    test('.getSearchIndex() is called', () => {
                        expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                    });

                    test('.putSearchIndex() is called with the updated index', () => {
                        expect(engine.putSearchIndex).toHaveBeenCalledWith(
                            SimpleModelWithSearchIndex,
                            {
                                [alreadyIndexedModel.id]: alreadyIndexedModel.toSearchData(),
                                [editedModel.id]: editedModel.toSearchData(),
                            },
                        );
                    });
                });
            });

            describe('and the model exists and a non-indexed field is changed', () => {
                const existingModel = SimpleModelWithSearchIndexFactory();
                const editedModel = SimpleModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.date = new Date('2021-01-01');

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine.getModel.mockResolvedValueOnce(existingModel.toData());
                    await connection.put(editedModel);
                });

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(1);
                });

                test('.getModel() is called with the model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('when the model is a model with links', () => {
        describe('without an index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelFactory();
                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModel, SimpleModel]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is called twice', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(2);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelFactory();
                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModel, SimpleModel]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(model);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(0);
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = LinkedModelFactory();
                const editedModel = LinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModel, SimpleModel]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.putModel() is not called with the linked model\'s data', () => {
                    expect(engine.putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex(modelConstructor) is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex(modelConstructor, data) is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = LinkedModelFactory();
                const editedModel = LinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModel, SimpleModel]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is not called with the main model\'s data', () => {
                    expect(engine.putModel).not.toHaveBeenCalledWith(editedModel.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with an index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelWithIndexFactory();

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is called twice', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(2);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.getIndex() is called twice', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(2);
                });

                test('.getIndex() is called for the main model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithIndex);
                });

                test('.getIndex() is called for the linked model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('.putIndex() is called twice', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(2);
                });

                test('.putIndex() is called for the main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('.putIndex() is called for the linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelWithIndexFactory();

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(model);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).not.toHaveBeenCalled();
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = LinkedModelWithIndexFactory();
                const editedModel = LinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.putModel() is not called with the linked model\'s data', () => {
                    expect(engine.putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is called once', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is called for the main model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithIndex);
                });

                test('.getIndex() is not called for the linked model', () => {
                    expect(engine.getIndex).not.toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is called for the main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('.putIndex() is not called for the linked model', () => {
                    expect(engine.putIndex).not.toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = LinkedModelWithIndexFactory();
                const editedModel = LinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.number = 32.65;

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is called once', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is not called for the main model', () => {
                    expect(engine.getIndex).not.toHaveBeenCalledWith(LinkedModelWithIndex);
                });

                test('.getIndex() is called for the linked model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is not called for the main model', () => {
                    expect(engine.putIndex).not.toHaveBeenCalledWith(LinkedModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('.putIndex() is called for the linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });
            });
        });

        describe('with a search index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelWithSearchIndexFactory();

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is called twice', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(2);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.getIndex() is called twice', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(2);
                });

                test('.getIndex() is called for the main model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getIndex() is called for the linked model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putIndex() is called twice', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(2);
                });

                test('.putIndex() is called for the main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('.putIndex() is called for the linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called twice', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledTimes(2);
                });

                test('.getSearchIndex() is called for the main model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getSearchIndex() is called for the linked model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putSearchIndex() is called with the updated index for the main model', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [model.id]: model.toSearchData(),
                    });
                });

                test('.putSearchIndex() is called with the updated index for the linked model', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.linked.id]: model.linked.toSearchData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelWithSearchIndexFactory();

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(model);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).not.toHaveBeenCalled();
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = LinkedModelWithSearchIndexFactory();
                const editedModel = LinkedModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.putModel() is not called with the linked model\'s data', () => {
                    expect(engine.putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is called once', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is called for the main model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getIndex() is not called for the linked model', () => {
                    expect(engine.getIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is called for the main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('.putIndex() is not called for the linked model', () => {
                    expect(engine.putIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called twice', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.getSearchIndex() is called for the main model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getSearchIndex() is not called for the linked model', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putSearchIndex() is called once', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.putSearchIndex() is called with the updated index for the main model', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
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

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is called once', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is not called for the main model', () => {
                    expect(engine.getIndex).not.toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getIndex() is called for the linked model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is not called for the main model', () => {
                    expect(engine.putIndex).not.toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('.putIndex() is called for the linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called once', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.getSearchIndex() is not called for the main model', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getSearchIndex() is called for the linked model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putSearchIndex() is called once', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.putSearchIndex() is called with the updated index for the linked model', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
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

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModel]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is called twice', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(2);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = CircularLinkedModelFactory();

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModel]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(model);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).not.toHaveBeenCalled();
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = CircularLinkedModelFactory();
                const editedModel = CircularLinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModel]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.putModel() is not called with the linked model\'s data', () => {
                    expect(engine.putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex(modelConstructor) is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex(modelConstructor, data) is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = CircularLinkedModelFactory();
                const editedModel = CircularLinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModel]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });
                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is not called with the main model\'s data', () => {
                    expect(engine.putModel).not.toHaveBeenCalledWith(editedModel.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with an index', () => {
            describe('and both models do not exist', () => {
                const model = CircularLinkedModelWithIndexFactory();

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModelWithIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is called twice', () => {

                    expect(engine.putModel).toHaveBeenCalledTimes(2);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.getIndex() is called twice', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is called for the circular model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is called for the main and linked models', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [model.id]: model.toIndexData(),
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = CircularLinkedModelWithIndexFactory();

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModelWithIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(model);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).not.toHaveBeenCalled();
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = CircularLinkedModelWithIndexFactory();
                const editedModel = CircularLinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModelWithIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.putModel() is not called with the linked model\'s data', () => {
                    expect(engine.putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is called once', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is called for the main model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is called for the main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('.putIndex() is not called for the linked model', () => {
                    expect(engine.putIndex).not.toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
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

                    const engine = new TestStorageEngine();
                    const connection = new Connection(engine, undefined, [CircularLinkedModelWithIndex]);

                    beforeAll(async () => {
                        engine.getModel.mockImplementation(id => {
                            if (id === existingModel.id) return Promise.resolve(existingModel);
                            if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                            return Promise.reject(new ModelNotFoundStorageEngineError(id));
                        });
                        engine.getIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toIndexData(),
                        });
                        await connection.put(editedModel);
                    });

                    test('.getIndex() is called', () => {
                        expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex);
                    });

                    test('.putIndex() is called with the updated index', () => {
                        expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
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

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModelWithIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is called once', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is called for the linked model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is not called for the main model', () => {
                    expect(engine.putIndex).not.toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('.putIndex() is called for the linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });
            });
        });

        describe('with a search index', () => {
            describe('and both models do not exist', () => {
                const model = CircularLinkedModelWithSearchIndexFactory();

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModelWithSearchIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is called twice', () => {

                    expect(engine.putModel).toHaveBeenCalledTimes(2);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.getIndex() is called twice', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is called for the circular model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is called for the main and linked models', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called twice', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.getSearchIndex() is called for the circular model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('.putSearchIndex() is called once', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.putSearchIndex() is called for the main and linked models', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [model.id]: model.toSearchData(),
                        [model.linked.id]: model.linked.toSearchData(),
                    });
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = CircularLinkedModelWithSearchIndexFactory();

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModelWithSearchIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === model.id) return Promise.resolve(model);
                        if (id === model.linked.id) return Promise.resolve(model.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(model);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).not.toHaveBeenCalled();
                });

                test('.getIndex() is not called', () => {
                    expect(engine.getIndex).not.toHaveBeenCalled();
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = CircularLinkedModelWithSearchIndexFactory();
                const editedModel = CircularLinkedModelWithSearchIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModelWithSearchIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.toData());
                });

                test('.putModel() is not called with the linked model\'s data', () => {
                    expect(engine.putModel).not.toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is called once', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is called for the main model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is called for the main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called once', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.getSearchIndex() is called for the main model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('.putSearchIndex() is called once', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.putSearchIndex() is called for the main model', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
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

                    const engine = new TestStorageEngine();
                    const connection = new Connection(engine, undefined, [CircularLinkedModelWithSearchIndex]);

                    beforeAll(async () => {
                        engine.getModel.mockImplementation(id => {
                            if (id === existingModel.id) return Promise.resolve(existingModel);
                            if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                            return Promise.reject(new ModelNotFoundStorageEngineError(id));
                        });
                        engine.getIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toIndexData(),
                        });
                        engine.getSearchIndex.mockResolvedValueOnce({
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toSearchData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toSearchData(),
                        });
                        await connection.put(editedModel);
                    });

                    test('.getIndex() is called', () => {
                        expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                    });

                    test('.putIndex() is called with the updated index', () => {
                        expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toIndexData(),
                            [editedModel.id]: editedModel.toIndexData(),
                        });
                    });

                    test('.getSearchIndex() is called', () => {
                        expect(engine.getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                    });

                    test('.putSearchIndex() is called with the updated index', () => {
                        expect(engine.putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
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

                const engine = new TestStorageEngine();
                const connection = new Connection(engine, undefined, [CircularLinkedModelWithSearchIndex]);

                beforeAll(async () => {
                    engine.getModel.mockImplementation(id => {
                        if (id === existingModel.id) return Promise.resolve(existingModel);
                        if (id === existingModel.linked.id) return Promise.resolve(existingModel.linked);
                        return Promise.reject(new ModelNotFoundStorageEngineError(id));
                    });
                    await connection.put(editedModel);
                });

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(editedModel.linked.id);
                });

                test('.putModel() is called once', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(1);
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(editedModel.linked.toData());
                });

                test('.getIndex() is called once', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(1);
                });

                test('.getIndex() is called for the linked model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('.putIndex() is called once', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(1);
                });

                test('.putIndex() is not called for the main model', () => {
                    expect(engine.putIndex).not.toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                    });
                });

                test('.putIndex() is called for the linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called once', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.getSearchIndex() is called for the linked model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                });

                test('.putSearchIndex() is called once', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
                });

                test('.putSearchIndex() is not called for the main model', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toSearchData(),
                    });
                });

                test('.putSearchIndex() is called for the linked model', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.linked.id]: editedModel.linked.toSearchData(),
                    });
                });
            });
        });
    });
});

describe('connection.delete()', () => {
    describe('when the model is not registered', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({});
        const connection = new Connection(engine, undefined, []);

        test('.delete() throws a ModelNotRegisteredConnectionError', async () => {
            await expect(() => connection.delete(model))
                .rejects.toThrowError({
                    instanceOf: ModelNotRegisteredConnectionError,
                    message: 'The model SimpleModel is not registered in the storage engine TestStorageEngine',
                });
        });
    });

    describe('when a model does not exist', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({});
        const connection = new Connection(engine, undefined, [SimpleModel]);

        test('.delete() throws a ModelNotFoundStorageEngineError', async () => {
            await expect(() => connection.delete(model))
                .rejects.toThrowError({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: `The model ${model.id} was not found`,
                });
        });
    });

    describe('when a simple model exists', () => {
        const model = SimpleModelFactory();
        const engine = new TestStorageEngine({});
        const connection = new Connection(engine, undefined, [SimpleModel]);

        beforeAll(async () => {
            engine.getModel.mockResolvedValue(model);
            await connection.delete(model);
        });

        test('.getModel() is called once', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(1);
        });

        test('.getModel() is called with the model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('.deleteModel() is called once', () => {
            expect(engine.deleteModel).toHaveBeenCalledTimes(1);
        });

        test('.deleteModel() is called with the model', () => {
            expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
        });

        test('.putSearchIndex() is not called', () => {
            expect(engine.putSearchIndex).not.toHaveBeenCalled();
        });
    });

    describe('when a one way linked model exists', () => {
        const model = LinkedModelFactory();
        const engine = new TestStorageEngine({});
        const connection = new Connection(engine, undefined, [LinkedModel, SimpleModel]);

        beforeAll(async () => {
            engine.getModel.mockResolvedValue(model);
            engine.getIndex.mockImplementation((constructor) => {
                if (constructor === LinkedModel)
                    return Promise.resolve({[model.id]: model.toIndexData()});
                if (constructor === SimpleModel)
                    return Promise.resolve({[model.linked.id]: model.linked.toIndexData()});
                return Promise.resolve({});
            });
            await connection.delete(model);
        });

        test('.getModel() is called once', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(1);
        });

        test('.getModel() is called with the main model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('.deleteModel() is called once', () => {
            expect(engine.deleteModel).toHaveBeenCalledTimes(1);
        });

        test('.deleteModel() is called with the main model', () => {
            expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
        });
    });

    describe('when a model with an index exists', () => {
        const model = SimpleModelWithIndexFactory();
        const engine = new TestStorageEngine({});
        const connection = new Connection(engine, undefined, [SimpleModelWithIndex]);

        beforeAll(async () => {
            engine.getModel.mockResolvedValue(model);
            engine.getIndex.mockResolvedValue({
                [model.id]: model.toIndexData(),
            });
            await connection.delete(model);
        });

        test('.getModel() is called once', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(1);
        });

        test('.getModel() is called with the main model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('.deleteModel() is called once', () => {
            expect(engine.deleteModel).toHaveBeenCalledTimes(1);
        });

        test('.deleteModel() is called with the main model', () => {
            expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
        });

        test('.getIndex() is called once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('.getIndex() is called with the main model constructor', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(model.constructor);
        });

        test('.putIndex() is called once', () => {
            expect(engine.putIndex).toHaveBeenCalledTimes(1);
        });

        test('.putIndex() is called with the main model removed', () => {
            expect(engine.putIndex).toHaveBeenCalledWith(model.constructor, {});
        });
    });

    describe('when a model with a search index exists', () => {
        const model = SimpleModelWithSearchIndexFactory();
        const engine = new TestStorageEngine({});
        const connection = new Connection(engine, undefined, [SimpleModelWithSearchIndex]);

        beforeAll(async () => {
            engine.getModel.mockResolvedValue(model);
            engine.getIndex.mockResolvedValue({
                [model.id]: model.toIndexData(),
            });
            engine.getSearchIndex.mockResolvedValue({
                [model.id]: model.toSearchData(),
            });
            await connection.delete(model);
        });

        test('.getModel() is called once', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(1);
        });

        test('.getModel() is called with the main model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('.deleteModel() is called once', () => {
            expect(engine.deleteModel).toHaveBeenCalledTimes(1);
        });

        test('.deleteModel() is called with the main model', () => {
            expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
        });

        test('.getIndex() is called once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('.getIndex() is called with the main model constructor', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(model.constructor);
        });

        test('.putIndex() is called once', () => {
            expect(engine.putIndex).toHaveBeenCalledTimes(1);
        });

        test('.putIndex() is called with the main model removed', () => {
            expect(engine.putIndex).toHaveBeenCalledWith(model.constructor, {});
        });

        test('.getSearchIndex() is called once', () => {
            expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
        });

        test('.getSearchIndex() is called with the main model constructor', () => {
            expect(engine.getSearchIndex).toHaveBeenCalledWith(model.constructor);
        });

        test('.putSearchIndex() is called once', () => {
            expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
        });

        test('.putSearchIndex() is called with the main model removed', () => {
            expect(engine.putSearchIndex).toHaveBeenCalledWith(model.constructor, {});
        });
    });

    describe('when a model with a non-required circular link exists', () => {
        const model = CircularLinkedModelFactory();
        const engine = new TestStorageEngine({});
        const connection = new Connection(engine, undefined, [CircularLinkedModel]);

        beforeAll(async () => {
            engine.getModel.mockImplementation((id) => {
                if (id === model.id) return Promise.resolve(model);
                if (id === model.linked.id) return Promise.resolve(model.linked);
                return Promise.reject(new ModelNotFoundStorageEngineError(id));
            });
            engine.getIndex.mockResolvedValue({
                [model.id]: model.toIndexData(),
                [model.linked.id]: model.linked.toIndexData(),
            });
            await connection.delete(model);
        });

        test('.getModel() is called twice', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(2);
        });

        test('.getModel() is called with the main model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('.getModel() is called with the linked model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
        });

        test('.deleteModel() is called once', () => {
            expect(engine.deleteModel).toHaveBeenCalledTimes(1);
        });

        test('.deleteModel() is called with the main model', () => {
            expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
        });

        test('.putModel() is called once', () => {
            expect(engine.putModel).toHaveBeenCalledTimes(1);
        });

        test('.putModel() is called with the linked model without the linked property', () => {
            expect(engine.putModel).toHaveBeenCalledWith({
                id: model.linked.id,
                string: model.linked.string,
                linked: undefined,
            });
        });

        test('.getIndex() is called once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('.getIndex() is called with the circular model', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModel);
        });

        test('.putIndex() is called once', () => {
            expect(engine.putIndex).toHaveBeenCalledTimes(1);
        });

        test('.putIndex() is called with the circular model without the linked model', () => {
            expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModel, {
                [model.linked.id]: _.omit(model.linked.toIndexData(), 'linked'),
            });
        });
    });

    describe('when a model with a non-required circular link with a search index exists', () => {
        const model = CircularLinkedModelWithSearchIndexFactory();
        const engine = new TestStorageEngine({});
        const connection = new Connection(engine, undefined, [CircularLinkedModelWithSearchIndex]);

        beforeAll(async () => {
            engine.getModel.mockImplementation((id) => {
                if (id === model.id) return Promise.resolve(model);
                if (id === model.linked.id) return Promise.resolve(model.linked);
                return Promise.reject(new ModelNotFoundStorageEngineError(id));
            });
            engine.getIndex.mockResolvedValue({
                [model.id]: model.toIndexData(),
                [model.linked.id]: model.linked.toIndexData(),
            });
            await connection.delete(model);
        });

        test('.getModel() is called twice', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(2);
        });

        test('.getModel() is called with the main model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });

        test('.getModel() is called with the linked model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
        });

        test('.deleteModel() is called once', () => {
            expect(engine.deleteModel).toHaveBeenCalledTimes(1);
        });

        test('.deleteModel() is called with the main model', () => {
            expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
        });

        test('.putModel() is called once', () => {
            expect(engine.putModel).toHaveBeenCalledTimes(1);
        });

        test('.putModel() is called with the linked model without the linked property', () => {
            expect(engine.putModel).toHaveBeenCalledWith({
                id: model.linked.id,
                string: model.linked.string,
                linked: undefined,
            });
        });

        test('.getIndex() is called once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('.getIndex() is called with the circular model', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
        });

        test('.putIndex() is called once', () => {
            expect(engine.putIndex).toHaveBeenCalledTimes(1);
        });

        test('.putIndex() is called with the circular model', () => {
            expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                [model.linked.id]: _.omit(model.linked.toIndexData(), 'linked'),
            });
        });

        test('.getSearchIndex() is called once', () => {
            expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
        });

        test('.getSearchIndex() is called with the circular model', () => {
            expect(engine.getSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
        });

        test('.putSearchIndex() is called once', () => {
            expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
        });

        test('.putSearchIndex() is called with the circular model', () => {
            expect(engine.putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                [model.linked.id]: _.omit(model.linked.toSearchData(), 'linked'),
            });
        });
    });

    describe('when a model with a required circular link with a search index exists', () => {
        describe('and .delete() is called without propagate', () => {
            const model = CircularRequiredLinkedModelWithSearchIndexFactory();
            const engine = new TestStorageEngine({});
            const connection = new Connection(engine, undefined, [CircularRequiredLinkedModelWithSearchIndex]);

            beforeAll(() => {
                engine.getModel.mockImplementation((id) => {
                    if (id === model.id) return Promise.resolve(model);
                    if (id === model.linked.id) return Promise.resolve(model.linked);
                    return Promise.reject(new ModelNotFoundStorageEngineError(id));
                });
                engine.getIndex.mockResolvedValue({
                    [model.id]: model.toIndexData(),
                    [model.linked.id]: model.linked.toIndexData(),
                });
            });

            test('.delete() throws a cannot delete error', async () => {
                await expect(() => connection.delete(model)).rejects.toMatchObject({
                    message: `Deleting ${model.id} has unintended consequences`,
                    consequences: {
                        willDelete: [model.linked.id],
                    },
                });
            });

            test('.getModel() is called twice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(2);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.deleteModel() is not called', () => {
                expect(engine.deleteModel).not.toHaveBeenCalled();
            });

            test('.putModel() is not called', () => {
                expect(engine.putModel).not.toHaveBeenCalled();
            });

            test('.getIndex() is called once', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(1);
            });

            test('.getIndex() is called with the circular model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex);
            });

            test('.putIndex() is not called', () => {
                expect(engine.putIndex).not.toHaveBeenCalled();
            });

            test('.getSearchIndex() is not called', () => {
                expect(engine.getSearchIndex).not.toHaveBeenCalled();
            });

            test('.putSearchIndex() is not called', () => {
                expect(engine.putSearchIndex).not.toHaveBeenCalled();
            });
        });

        describe('and .delete() is called with propagate', () => {
            const model = CircularRequiredLinkedModelWithSearchIndexFactory();
            const engine = new TestStorageEngine({});
            const connection = new Connection(engine, undefined, [CircularRequiredLinkedModelWithSearchIndex]);

            beforeAll(async () => {
                engine.getModel.mockImplementation((id) => {
                    if (id === model.id) return Promise.resolve(model);
                    if (id === model.linked.id) return Promise.resolve(model.linked);
                    return Promise.reject(new ModelNotFoundStorageEngineError(id));
                });
                engine.getIndex.mockResolvedValue({
                    [model.id]: model.toIndexData(),
                    [model.linked.id]: model.linked.toIndexData(),
                });
                await connection.delete(model, [model.linked.id]);
            });

            test('.getModel() is called twice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(2);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.deleteModel() is called twice', () => {
                expect(engine.deleteModel).toHaveBeenCalledTimes(2);
            });

            test('.deleteModel() is called with the main model', () => {
                expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
            });

            test('.deleteModel() is called with the linked model', () => {
                expect(engine.deleteModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.putModel() is not called', () => {
                expect(engine.putModel).not.toHaveBeenCalled();
            });

            test('.getIndex() is called once', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(1);
            });

            test('.getIndex() is called with the circular model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex);
            });

            test('.putIndex() is called once', () => {
                expect(engine.putIndex).toHaveBeenCalledTimes(1);
            });

            test('.putIndex() is called with an empty index', () => {
                expect(engine.putIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex, {});
            });

            test('.getSearchIndex() is called once', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
            });

            test('.getSearchIndex() is called with the circular model', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex);
            });

            test('.putSearchIndex() is called once', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
            });

            test('.putSearchIndex() is called with an empty index', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledWith(CircularRequiredLinkedModelWithSearchIndex, {});
            });
        });
    });

    describe('when a model with a required normal link with a search index exists', () => {
        describe('and .delete() is called without propagate', () => {
            const model = RequiredLinkedModelWithSearchIndexFactory();
            const engine = new TestStorageEngine({});
            const connection = new Connection(engine, undefined, [RequiredLinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

            beforeAll(() => {
                engine.getModel.mockImplementation((id) => {
                    if (id === model.id) return Promise.resolve(model);
                    if (id === model.linked.id) return Promise.resolve(model.linked);
                    return Promise.reject(new ModelNotFoundStorageEngineError(id));
                });
                engine.getIndex.mockResolvedValue({
                    [model.id]: model.toIndexData(),
                    [model.linked.id]: model.linked.toIndexData(),
                });
            });

            test('.delete() throws a cannot delete error', async () => {
                await expect(() => connection.delete(model.linked))
                    .rejects.toMatchObject({
                        message: `Deleting ${model.linked.id} has unintended consequences`,
                        consequences: {willDelete: [model.id]},
                    });
            });

            test('.getModel() is called twice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(2);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.deleteModel() is not called', () => {
                expect(engine.deleteModel).not.toHaveBeenCalled();
            });

            test('.putModel() is not called', () => {
                expect(engine.putModel).not.toHaveBeenCalled();
            });

            test('.getIndex() is called once', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(1);
            });

            test('.getIndex() is called with the circular model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex);
            });

            test('.putIndex() is not called', () => {
                expect(engine.putIndex).not.toHaveBeenCalled();
            });

            test('.getSearchIndex() is not called', () => {
                expect(engine.getSearchIndex).not.toHaveBeenCalled();
            });

            test('.putSearchIndex() is not called', () => {
                expect(engine.putSearchIndex).not.toHaveBeenCalled();
            });
        });

        describe('and .delete() is called with propagate', () => {
            const model = RequiredLinkedModelWithSearchIndexFactory();
            const engine = new TestStorageEngine({});
            const connection = new Connection(engine, undefined, [RequiredLinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

            beforeAll(async () => {
                engine.getModel.mockImplementation((id) => {
                    if (id === model.id) return Promise.resolve(model);
                    if (id === model.linked.id) return Promise.resolve(model.linked);
                    return Promise.reject(new ModelNotFoundStorageEngineError(id));
                });
                engine.getIndex.mockImplementation((constructor) => {
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
                await connection.delete(model.linked, [model.id]);
            });

            test('.getModel() is called twice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(2);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.deleteModel() is called twice', () => {
                expect(engine.deleteModel).toHaveBeenCalledTimes(2);
            });

            test('.deleteModel() is called with the main model', () => {
                expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
            });

            test('.deleteModel() is called with the linked model', () => {
                expect(engine.deleteModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.putModel() is not called', () => {
                expect(engine.putModel).not.toHaveBeenCalled();
            });

            test('.getIndex() is called once', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(2);
            });

            test('.getIndex() is called with the main model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex);
            });

            test('.getIndex() is called with the linked model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putIndex() is called once', () => {
                expect(engine.putIndex).toHaveBeenCalledTimes(2);
            });

            test('.putIndex() is called with an empty main model index', () => {
                expect(engine.putIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex, {});
            });

            test('.putIndex() is called with an empty linked model index', () => {
                expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {});
            });

            test('.getSearchIndex() is called twice', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledTimes(2);
            });

            test('.getSearchIndex() is called with the main model', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex);
            });

            test('.getSearchIndex() is called with the linked model', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putSearchIndex() is called twice', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledTimes(2);
            });

            test('.putSearchIndex() is called with an empty index for the main model', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex, {});
            });

            test('.putSearchIndex() is called with an empty index for the linked model', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {});
            });
        });
    });
});

describe('connection.find()', () => {
    describe('when there is no index', () => {
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [SimpleModelWithFullIndex]);

        beforeAll(() => engine.getIndex.mockResolvedValue({}));

        test('returns no models', async () => {
            expect(await connection.find(SimpleModelWithFullIndex, {})).toStrictEqual([]);
        });

        test('calls getIndex once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('calls getIndex with the model', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithFullIndex);
        });
    });

    describe('when no models match the query', () => {
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [SimpleModelWithFullIndex]);
        const model = SimpleModelWithFullIndexFactory();

        beforeAll(() => engine.getIndex.mockResolvedValue({
            [model.id]: model.toIndexData(),
        }));

        test('returns no models', async () => {
            expect(await connection.find(SimpleModelWithFullIndex, {string: 'does-not-exist'})).toStrictEqual([]);
        });

        test('calls getIndex once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('calls getIndex with the model', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithFullIndex);
        });
    });

    describe('when some models match the query', () => {
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [SimpleModelWithFullIndex]);
        const model1 = SimpleModelWithFullIndexFactory();
        const model2 = SimpleModelWithFullIndexFactory();

        model1.string = 'matching';

        beforeAll(() => engine.getIndex.mockResolvedValue({
            [model1.id]: model1.toIndexData(),
            [model2.id]: model2.toIndexData(),
        }));

        test('returns only the models that match', async () => {
            expect(await connection.find(SimpleModelWithFullIndex, {string: 'matching'})).toStrictEqual([SimpleModelWithFullIndex.fromData(model1.toIndexData())]);
        });

        test('calls getIndex once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('calls getIndex with the model', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithFullIndex);
        });
    });

    describe('when all models match the query', () => {
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [SimpleModelWithFullIndex]);
        const model1 = SimpleModelWithFullIndexFactory();
        const model2 = SimpleModelWithFullIndexFactory();

        beforeAll(() => engine.getIndex.mockResolvedValue({
            [model1.id]: model1.toIndexData(),
            [model2.id]: model2.toIndexData(),
        }));

        test('returns all models that match', async () => {
            expect(await connection.find(SimpleModelWithFullIndex, {string: 'string'}))
                .toStrictEqual([
                    SimpleModelWithFullIndex.fromData(model1.toIndexData()),
                    SimpleModelWithFullIndex.fromData(model2.toIndexData()),
                ]);
        });

        test('calls getIndex once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('calls getIndex with the model', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithFullIndex);
        });
    });
});

describe('connection.search()', () => {
    describe('when there are no results', () => {
        const model = SimpleModelWithSearchIndexFactory();
        model.string = 'abc';
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [SimpleModel]);

        beforeAll(() => {
            engine.getSearchIndex.mockResolvedValue({
                [model.id]: model.toSearchData(),
            });
        });

        test('.search() returns no results', async () => {
            expect(await connection.search(model.constructor, 'xyz')).toStrictEqual([]);
        });

        test('.getSearchIndex() was called with the model', async () => {
            expect(engine.getSearchIndex).toHaveBeenCalledWith(model.constructor);
        });
    });

    describe('when there are matching results', () => {
        const model = SimpleModelWithSearchIndexFactory();
        model.string = 'abc';
        const engine = new TestStorageEngine();
        const connection = new Connection(engine, undefined, [SimpleModel]);

        beforeAll(() => {
            engine.getSearchIndex.mockResolvedValue({
                [model.id]: model.toSearchData(),
            });
        });

        test('.search() returns results', async () => {
            expect(await connection.search(model.constructor, 'abc')).toStrictEqual([
                new SearchResult(model.constructor.fromData(model.toSearchData()), 0.288),
            ]);
        });

        test('.getSearchIndex() was called with the model', async () => {
            expect(engine.getSearchIndex).toHaveBeenCalledWith(model.constructor);
        });
    });
});

describe('connection.transaction()', () => {
    describe('when calling put', () => {
        describe('and the transaction succeeds', () => {
            const engine = new TestStorageEngine();
            const connection = new Connection(engine, undefined, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
            const model = LinkedModelWithSearchIndexFactory();
            const transaction = connection.transaction();
            engine.getModel.mockImplementation(id => {
                if (id === model.id) {
                    return Promise.resolve({
                        ...model.toData(),
                        string: 'old',
                    });
                }
                if (id === model.linked.id) {
                    return Promise.resolve({
                        ...model.linked.toData(),
                        string: 'old',
                    });
                }
                return Promise.reject(new ModelNotFoundStorageEngineError(id));
            });

            beforeAll(() => transaction.put(model));

            test('.getModel() is called twice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(2);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.putModel() is not called', () => {
                expect(engine.putModel).not.toHaveBeenCalled();
            });

            test('.putIndex() is not called', () => {
                expect(engine.putIndex).not.toHaveBeenCalled();
            });

            test('.putSearchIndex() is not called', () => {
                expect(engine.putSearchIndex).not.toHaveBeenCalled();
            });

            describe('when committing the transaction', () => {
                beforeAll(() => transaction.commit());

                test('.putModel() is called twice', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(2);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.getIndex() is called twice', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(2);
                });

                test('.getIndex() is called for the main model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getIndex() is called for the linked model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putIndex() is called twice', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(2);
                });

                test('.putIndex() is called for the main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('.putIndex() is called for the linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called twice', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledTimes(2);
                });

                test('.getSearchIndex() is called for the main model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getSearchIndex() is called for the linked model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });
            });
        });


        describe('when the main model does not exist', () => {
            const engine = new TestStorageEngine();
            const connection = new Connection(engine, undefined, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
            const model = LinkedModelWithSearchIndexFactory();
            const transaction = connection.transaction();
            engine.getModel.mockImplementation(id => {
                if (id === model.linked.id) {
                    return Promise.resolve({
                        ...model.linked.toData(),
                        string: 'old',
                    });
                }
                return Promise.reject(new ModelNotFoundStorageEngineError(id));
            });

            beforeAll(() => transaction.put(model));

            test('.getModel() is called twice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(2);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.putModel() is not called', () => {
                expect(engine.putModel).not.toHaveBeenCalled();
            });

            test('.putIndex() is not called', () => {
                expect(engine.putIndex).not.toHaveBeenCalled();
            });

            test('.putSearchIndex() is not called', () => {
                expect(engine.putSearchIndex).not.toHaveBeenCalled();
            });

            describe('and committing the transaction', () => {
                beforeAll(() => transaction.commit());

                test('.putModel() is called twice', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(2);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.getIndex() is called twice', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(2);
                });

                test('.getIndex() is called for the main model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getIndex() is called for the linked model', () => {
                    expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });

                test('.putIndex() is called twice', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(2);
                });

                test('.putIndex() is called for the main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('.putIndex() is called for the linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });

                test('.getSearchIndex() is called twice', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledTimes(2);
                });

                test('.getSearchIndex() is called for the main model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                });

                test('.getSearchIndex() is called for the linked model', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                });
            });
        });

        describe('and the second write operation in the transaction fails', () => {
            const engine = new TestStorageEngine();
            const connection = new Connection(engine, undefined, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
            const model = LinkedModelWithSearchIndexFactory();
            const transaction = connection.transaction();
            engine.getModel.mockImplementation(id => {
                if (id === model.id) {
                    return Promise.resolve({
                        ...model.toData(),
                        string: 'old',
                    });
                }
                if (id === model.linked.id) {
                    return Promise.resolve({
                        ...model.linked.toData(),
                        string: 'old',
                    });
                }
                return Promise.reject(new ModelNotFoundStorageEngineError(id));
            });

            beforeAll(() => transaction.put(model));

            test('.getModel() is called twice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(2);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.putModel() is not called', () => {
                expect(engine.putModel).not.toHaveBeenCalled();
            });

            test('.getIndex() is called twice', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(2);
            });

            test('.getIndex() is called for the main model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
            });

            test('.getIndex() is called for the linked model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putIndex() is not called', () => {
                expect(engine.putIndex).not.toHaveBeenCalled();
            });

            test('.getSearchIndex() is called twice', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledTimes(2);
            });

            test('.getSearchIndex() is called for the main model', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
            });

            test('.getSearchIndex() is called for the linked model', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putSearchIndex() is not called', () => {
                expect(engine.putSearchIndex).not.toHaveBeenCalled();
            });

            describe('and committing the transaction', () => {
                beforeAll(() => {
                    engine.putModel.mockImplementation(m => {
                        if (m.id === model.linked.id) {
                            throw new Error('Something went wrong');
                        }
                    });
                });

                test('transaction.commit throws a CommitFailedTransactionError', async () => {
                    let error;

                    try {
                        await transaction.commit();
                    } catch (e) {
                        error = e;
                    } finally {
                        expect(error).toBeInstanceOf(CommitFailedTransactionError);
                        expect(error).toHaveProperty('message', 'Transaction failed to commit.');
                        expect(error).toHaveProperty('error', new Error('Something went wrong'));
                        expect(error).toHaveProperty('transactions', expect.arrayContaining([
                            expect.objectContaining({
                                args: [model.toData()],
                                committed: true,
                                error: undefined,
                                method: 'putModel',
                                original: {...model.toData(), string: 'old'},
                            }),
                            expect.objectContaining({
                                args: [model.linked.toData()],
                                committed: false,
                                error: new Error('Something went wrong'),
                                method: 'putModel',
                                original: {...model.linked.toData(), string: 'old'},
                            }),
                        ]));
                    }
                });

                test('.putModel() is called twice', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(3);
                });

                test('.putModel() is called with the new main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(1, model.toData());
                });

                test('.putModel() is called with the old main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(3, {...model.toData(), string: 'old'});
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('when calling delete', () => {
        describe('and the transaction succeeds', () => {
            const engine = new TestStorageEngine();
            const connection = new Connection(engine, undefined, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
            const model = LinkedModelWithSearchIndexFactory();
            const transaction = connection.transaction();
            engine.getModel.mockImplementation(id => {
                if (id === model.id) {
                    return Promise.resolve({
                        ...model.toData(),
                        string: 'old',
                    });
                }
                if (id === model.linked.id) {
                    return Promise.resolve({
                        ...model.linked.toData(),
                        string: 'old',
                    });
                }
                return Promise.reject(new ModelNotFoundStorageEngineError(id));
            });
            engine.getIndex.mockImplementation((constructor) => {
                if (constructor === LinkedModelWithSearchIndex)
                    return Promise.resolve({[model.id]: model.toIndexData()});
                if (constructor === SimpleModelWithSearchIndex)
                    return Promise.resolve({[model.linked.id]: model.linked.toIndexData()});
                return Promise.resolve({});
            });

            beforeAll(() => transaction.delete(model));

            test('.getModel() is called once', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(1);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.deleteModel() is not called', () => {
                expect(engine.deleteModel).not.toHaveBeenCalled();
            });

            describe('and committing the transaction', () => {
                beforeAll(() => transaction.commit());

                test('.getModel() is called once', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called first with the main model id', () => {
                    expect(engine.getModel).toHaveBeenNthCalledWith(1, model.id);
                });

                test('.getModel() is called second with the main model id', () => {
                    expect(engine.getModel).toHaveBeenNthCalledWith(2, model.id);
                });

                test('.deleteModel() is called once', () => {
                    expect(engine.deleteModel).toHaveBeenCalledTimes(1);
                });

                test('.deleteModel() is called with the main model', () => {
                    expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
                });
            });
        });

        describe('and the second write operation in the transaction fails', () => {
            const engine = new TestStorageEngine();
            const connection = new Connection(engine, undefined, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
            const model = LinkedModelWithSearchIndexFactory();
            const transaction = connection.transaction();
            engine.getModel.mockImplementation(id => {
                if (id === model.id) {
                    return Promise.resolve({
                        ...model.toData(),
                        string: 'old',
                    });
                }
                if (id === model.linked.id) {
                    return Promise.resolve({
                        ...model.linked.toData(),
                        string: 'old',
                    });
                }
                return Promise.reject(new ModelNotFoundStorageEngineError(id));
            });
            engine.getIndex.mockImplementation((constructor) => {
                if (constructor === LinkedModelWithSearchIndex)
                    return Promise.resolve({[model.id]: model.toIndexData()});
                if (constructor === SimpleModelWithSearchIndex)
                    return Promise.resolve({[model.linked.id]: model.linked.toIndexData()});
                return Promise.resolve({});
            });

            beforeAll(() => transaction.delete(model));

            test('.getModel() is called once', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(1);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is not called with the linked model id', () => {
                expect(engine.getModel).not.toHaveBeenCalledWith(model.linked.id);
            });

            test('.putModel() is not called', () => {
                expect(engine.putModel).not.toHaveBeenCalled();
            });

            test('.deleteModel() is not called', () => {
                expect(engine.deleteModel).not.toHaveBeenCalled();
            });

            test('.getIndex() is called once', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(1);
            });

            test('.getIndex() is called for the main model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
            });

            test('.getIndex() is not called for the linked model', () => {
                expect(engine.getIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putIndex() is not called', () => {
                expect(engine.putIndex).not.toHaveBeenCalled();
            });

            test('.getSearchIndex() is called once', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
            });

            test('.getSearchIndex() is called for the main model', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
            });

            test('.getSearchIndex() is not called for the linked model', () => {
                expect(engine.getSearchIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putSearchIndex() is not called', () => {
                expect(engine.putSearchIndex).not.toHaveBeenCalled();
            });

            describe('and committing the transaction', () => {
                engine.deleteModel.mockRejectedValue(new Error('Something went wrong'));

                test('transaction.commit throws a CommitFailedTransactionError', async () => {
                    let error;

                    try {
                        await transaction.commit();
                    } catch (e) {
                        error = e;
                    } finally {
                        expect(error).toBeInstanceOf(CommitFailedTransactionError);
                        expect(error).toHaveProperty('message', 'Transaction failed to commit.');
                        expect(error).toHaveProperty('error', new Error('Something went wrong'));
                        expect(error).toHaveProperty('transactions', expect.arrayContaining([
                            expect.objectContaining({
                                args: [model.id],
                                committed: false,
                                error: new Error('Something went wrong'),
                                method: 'deleteModel',
                                original: {...model.toData(), string: 'old'},
                            }),
                        ]));
                    }
                });

                test('.putModel() is not called', () => {
                    expect(engine.putModel).not.toHaveBeenCalled();
                });

                test('.deleteModel() is called with the main model id', () => {
                    expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
                });

                test('.deleteModel() is not called with the linked model id', () => {
                    expect(engine.deleteModel).not.toHaveBeenCalledWith(model.linked.id);
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });
        });
    });
});
