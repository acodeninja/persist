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
    LinkedManyModelWithSearchIndex,
    LinkedManyModelWithSearchIndexFactory,
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
import {TestStorageEngineFactory} from '../test/fixtures/Engine.js';
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
        const engine = TestStorageEngineFactory();
        const connection = new Connection(engine, []);
        const modelId = 'UnregisteredModel/111111111111';

        test('throws a ModelNotRegisteredConnectionError', async () => {
            await expect(connection.get(modelId))
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
        const engine = TestStorageEngineFactory();
        const connection = new Connection(engine, [SimpleModel]);
        const modelId = 'SimpleModel/111111111111';

        beforeAll(() => engine.getModel.mockRejectedValue(new ModelNotFoundStorageEngineError(modelId)));

        test('throws a ModelNotFoundStorageEngineError', async () => {
            await expect(connection.get(modelId))
                .rejects.toThrow({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: 'The model SimpleModel/111111111111 was not found',
                });
        });

        test('.getModel() is called once', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(1);
        });

        test('.getModel() is called with the model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(modelId);
        });
    });

    describe('when a model exists', () => {
        const model = SimpleModelFactory();
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [SimpleModel]);

        test('returns the model', async () => {
            expect(await connection.get(model.id)).toEqual(model);
        });

        test('.getModel() is called once', () => {
            expect(engine.getModel).toHaveBeenCalledTimes(1);
        });

        test('.getModel() is called with the model id', () => {
            expect(engine.getModel).toHaveBeenCalledWith(model.id);
        });
    });
});

describe('connection.hydrate()', () => {
    describe('when a model with many links exists', () => {
        const model = LinkedManyModelWithIndexFactory();
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [
            LinkedManyModelWithIndex,
            SimpleModelWithIndex,
        ]);

        const dryModel = new LinkedManyModelWithIndex();
        dryModel.id = model.id;

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
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [
            LinkedModelWithIndex,
            SimpleModelWithIndex,
        ]);

        const dryModel = new LinkedModelWithIndex();
        dryModel.id = model.id;

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
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [
            CircularLinkedModel,
        ]);

        const dryModel = new CircularLinkedModel();
        dryModel.id = model.id;

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
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [
            CircularManyLinkedModel,
        ]);

        const dryModel = new CircularManyLinkedModel();
        dryModel.id = model.id;

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
        const engine = TestStorageEngineFactory();
        const connection = new Connection(engine, []);

        test('.put(model) throws a ModelNotRegisteredConnectionError', async () => {
            await expect(connection.put(model))
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
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [SimpleModel]);

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
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [SimpleModel]);

                beforeAll(() => connection.put(model));

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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [SimpleModel]);

                beforeAll(() => connection.put(editedModel));

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
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [SimpleModelWithIndex]);

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
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [SimpleModelWithIndex]);

                beforeAll(() => connection.put(model));

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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [SimpleModelWithIndex]);

                beforeAll(() => connection.put(editedModel));

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

                    const engine = TestStorageEngineFactory([alreadyIndexedModel, existingModel]);
                    const connection = new Connection(engine, [SimpleModelWithIndex]);

                    beforeAll(() => connection.put(editedModel));

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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [SimpleModelWithIndex]);

                beforeAll(() => connection.put(editedModel));

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
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [SimpleModelWithSearchIndex]);

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
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(model));

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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(editedModel));

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

                    const engine = TestStorageEngineFactory([alreadyIndexedModel, existingModel]);
                    const connection = new Connection(engine, [SimpleModelWithSearchIndex]);

                    beforeAll(() => connection.put(editedModel));

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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(editedModel));

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
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [LinkedModel, SimpleModel]);

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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelFactory();
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [LinkedModel, SimpleModel]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = LinkedModelFactory();
                const editedModel = LinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModel, SimpleModel]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = LinkedModelFactory();
                const editedModel = LinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModel, SimpleModel]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with an index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelWithIndexFactory();

                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [LinkedModelWithIndex, SimpleModelWithIndex]);

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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelWithIndexFactory();
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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
                const existingModel = LinkedModelWithIndexFactory();
                const editedModel = LinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = LinkedModelWithIndexFactory();
                const editedModel = LinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.number = 32.65;

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with a search index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelWithSearchIndexFactory();
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

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
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is called once', () => {
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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

    describe('when the model is a model with many links', () => {
        describe('without an index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedManyModelWithIndexFactory();
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [LinkedManyModelWithIndex, SimpleModelWithIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called twice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(2);
                });

                test('.getModel() is called with the main model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.id);
                });

                test('.getModel() is called with the linked model id', () => {
                    expect(engine.getModel).toHaveBeenCalledWith(model.linked[0].id);
                });

                test('.putModel() is called twice', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(2);
                });

                test('.putModel() is called with the main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked[0].toData());
                });

                test('.getIndex() is called twice', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(2);
                });

                test('.putIndex() is called twice', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(2);
                });

                test('.putIndex() is called with the main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(LinkedManyModelWithIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('.putIndex() is called with the linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithIndex, {
                        [model.linked[0].id]: model.linked[0].toIndexData(),
                    });
                });

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelFactory();
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [LinkedModel, SimpleModel]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the main model is changed', () => {
                const existingModel = LinkedModelFactory();
                const editedModel = LinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModel, SimpleModel]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = LinkedModelFactory();
                const editedModel = LinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModel, SimpleModel]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with an index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelWithIndexFactory();

                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [LinkedModelWithIndex, SimpleModelWithIndex]);

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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = LinkedModelWithIndexFactory();
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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
                const existingModel = LinkedModelWithIndexFactory();
                const editedModel = LinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = LinkedModelWithIndexFactory();
                const editedModel = LinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.number = 32.65;

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModelWithIndex, SimpleModelWithIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with a search index', () => {
            describe('and both models do not exist', () => {
                const model = LinkedModelWithSearchIndexFactory();
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

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
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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

                test('.getSearchIndex() is called once', () => {
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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
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
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [CircularLinkedModel]);

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
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [CircularLinkedModel]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called four times', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(4);
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
                const existingModel = CircularLinkedModelFactory();
                const editedModel = CircularLinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [CircularLinkedModel]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called four times', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(4);
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

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = CircularLinkedModelFactory();
                const editedModel = CircularLinkedModelFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [CircularLinkedModel]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called four times', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(4);
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with an index', () => {
            describe('and both models do not exist', () => {
                const model = CircularLinkedModelWithIndexFactory();

                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [CircularLinkedModelWithIndex]);

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

                test('.getIndex() is called once', () => {
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

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });

            describe('and the model exists but is unchanged', () => {
                const model = CircularLinkedModelWithIndexFactory();
                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [CircularLinkedModelWithIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called four times', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(4);
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
                const existingModel = CircularLinkedModelWithIndexFactory();
                const editedModel = CircularLinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked = existingModel.linked;
                editedModel.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [CircularLinkedModelWithIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called four times', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(4);
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

                test('.putIndex() is called for the main and linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });

                describe('and the index already contains other models', () => {
                    const alreadyIndexedModel = CircularLinkedModelWithIndexFactory();
                    const existingModel = CircularLinkedModelWithIndexFactory();
                    const editedModel = CircularLinkedModelWithIndexFactory();
                    editedModel.id = existingModel.id;
                    editedModel.linked.id = existingModel.linked.id;
                    editedModel.string = 'updated';

                    const engine = TestStorageEngineFactory([alreadyIndexedModel, existingModel]);
                    const connection = new Connection(engine, [CircularLinkedModelWithIndex]);

                    beforeAll(() => connection.put(editedModel));

                    test('.getModel() is called four times', () => {
                        expect(engine.getModel).toHaveBeenCalledTimes(4);
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

                    test('.getIndex() is called', () => {
                        expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex);
                    });

                    test('.putIndex() is called with the updated index', () => {
                        expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toIndexData(),
                            [editedModel.id]: editedModel.toIndexData(),
                            [editedModel.linked.id]: editedModel.linked.toIndexData(),
                        });
                    });

                    test('.getSearchIndex() is not called', () => {
                        expect(engine.getSearchIndex).not.toHaveBeenCalled();
                    });

                    test('.putSearchIndex() is not called', () => {
                        expect(engine.putSearchIndex).not.toHaveBeenCalled();
                    });
                });
            });

            describe('and the model exists and the linked model is changed', () => {
                const existingModel = CircularLinkedModelWithIndexFactory();
                const editedModel = CircularLinkedModelWithIndexFactory();
                editedModel.id = existingModel.id;
                editedModel.linked.id = existingModel.linked.id;
                editedModel.linked.string = 'updated';

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [CircularLinkedModelWithIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called four times', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(4);
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

                test('.putIndex() is called for only linked models changes', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithIndex, {
                        [existingModel.id]: existingModel.toIndexData(),
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
                    });
                });

                test('.getSearchIndex() is not called', () => {
                    expect(engine.getSearchIndex).not.toHaveBeenCalled();
                });

                test('.putSearchIndex() is not called', () => {
                    expect(engine.putSearchIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('with a search index', () => {
            describe('and both models do not exist', () => {
                const model = CircularLinkedModelWithSearchIndexFactory();
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [CircularLinkedModelWithSearchIndex]);

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

                test('.getIndex() is called once', () => {
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

                test('.getSearchIndex() is called once', () => {
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

                const engine = TestStorageEngineFactory([model]);
                const connection = new Connection(engine, [CircularLinkedModelWithSearchIndex]);

                beforeAll(() => connection.put(model));

                test('.getModel() is called four times', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(4);
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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [CircularLinkedModelWithSearchIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called four times', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(4);
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

                test('.putIndex() is called for the main and linked models', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toIndexData(),
                        [editedModel.linked.id]: editedModel.linked.toIndexData(),
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

                test('.putSearchIndex() is called for the main and linked models', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [editedModel.id]: editedModel.toSearchData(),
                        [editedModel.linked.id]: editedModel.linked.toSearchData(),
                    });
                });

                describe('and the index already contains other models', () => {
                    const alreadyIndexedModel = CircularLinkedModelWithSearchIndexFactory();
                    const existingModel = CircularLinkedModelWithSearchIndexFactory();
                    const editedModel = CircularLinkedModelWithSearchIndexFactory();
                    editedModel.id = existingModel.id;
                    editedModel.linked.id = existingModel.linked.id;
                    editedModel.string = 'updated';

                    const engine = TestStorageEngineFactory([alreadyIndexedModel, existingModel]);
                    const connection = new Connection(engine, [CircularLinkedModelWithSearchIndex]);

                    beforeAll(() => connection.put(editedModel));

                    test('.getIndex() is called', () => {
                        expect(engine.getIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex);
                    });

                    test('.putIndex() is called with the updated index', () => {
                        expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                            [alreadyIndexedModel.id]: alreadyIndexedModel.toIndexData(),
                            [alreadyIndexedModel.linked.id]: alreadyIndexedModel.linked.toIndexData(),
                            [editedModel.id]: editedModel.toIndexData(),
                            [existingModel.linked.id]: existingModel.linked.toIndexData(),
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
                            [existingModel.linked.id]: existingModel.linked.toSearchData(),
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

                const engine = TestStorageEngineFactory([existingModel]);
                const connection = new Connection(engine, [CircularLinkedModelWithSearchIndex]);

                beforeAll(() => connection.put(editedModel));

                test('.getModel() is called four times', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(4);
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

                test('.putIndex() is called for the main and linked models', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [existingModel.id]: existingModel.toIndexData(),
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

                test('.putSearchIndex() is called for the main and linked models', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledWith(CircularLinkedModelWithSearchIndex, {
                        [existingModel.id]: existingModel.toSearchData(),
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
        const engine = TestStorageEngineFactory();
        const connection = new Connection(engine, []);

        test('.delete() throws a ModelNotRegisteredConnectionError', async () => {
            await expect(connection.delete(model))
                .rejects.toThrowError({
                    instanceOf: ModelNotRegisteredConnectionError,
                    message: 'The model SimpleModel is not registered in the storage engine TestStorageEngine',
                });
        });
    });

    describe('when a model does not exist', () => {
        const model = SimpleModelFactory();
        const engine = TestStorageEngineFactory();
        const connection = new Connection(engine, [SimpleModel]);

        test('.delete() throws a ModelNotFoundStorageEngineError', async () => {
            await expect(connection.delete(model.toData()))
                .rejects.toThrowError({
                    instanceOf: ModelNotFoundStorageEngineError,
                    message: `The model ${model.id} was not found`,
                });
        });
    });

    describe('when a simple model exists', () => {
        const model = SimpleModelFactory();
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [SimpleModel]);

        beforeAll(() => connection.delete(model.toData()));

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

        test('.getIndex() is called with the model constructor', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(SimpleModel);
        });

        test('.getIndex() is called once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('.putIndex() is called once', () => {
            expect(engine.putIndex).toHaveBeenCalledTimes(1);
        });

        test('.putIndex() is called with the model constructor', () => {
            expect(engine.putIndex).toHaveBeenCalledWith(SimpleModel, {});
        });

        test('.getSearchIndex() is not called', () => {
            expect(engine.getSearchIndex).not.toHaveBeenCalled();
        });

        test('.putSearchIndex() is not called', () => {
            expect(engine.putSearchIndex).not.toHaveBeenCalled();
        });
    });

    describe('when a one way linked model exists', () => {
        const model = LinkedModelFactory();
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [LinkedModel, SimpleModel]);

        beforeAll(() => connection.delete(model.toData()));

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

        test('.getIndex() is called once', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(1);
        });

        test('.getIndex() is called with the main model constructor', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(LinkedModel);
        });

        test('.putIndex() is called once', () => {
            expect(engine.putIndex).toHaveBeenCalledTimes(1);
        });

        test('.putIndex() is called with the model constructor', () => {
            expect(engine.putIndex).toHaveBeenCalledWith(LinkedModel, {});
        });

        test('.getSearchIndex() is not called', () => {
            expect(engine.getSearchIndex).not.toHaveBeenCalled();
        });

        test('.putSearchIndex() is not called', () => {
            expect(engine.putSearchIndex).not.toHaveBeenCalled();
        });
    });

    describe('when a backwards one way linked model exists', () => {
        const model = LinkedModelWithSearchIndexFactory();
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

        beforeAll(() => connection.delete(model.linked.toData(), [model.id]));

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

        test('.deleteModel() is called with the linked model', () => {
            expect(engine.deleteModel).toHaveBeenCalledWith(model.linked.id);
        });

        test('.getIndex() is called twice', () => {
            expect(engine.getIndex).toHaveBeenCalledTimes(2);
        });

        test('.getIndex() is called with the main model constructor', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(model.constructor);
        });

        test('.getIndex() is called with the linked model constructor', () => {
            expect(engine.getIndex).toHaveBeenCalledWith(model.linked.constructor);
        });

        test('.putIndex() is called twice', () => {
            expect(engine.putIndex).toHaveBeenCalledTimes(2);
        });

        test('.putIndex() is called with the main model constructor', () => {
            expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                [model.id]: {
                    ...model.toIndexData(),
                    linked: undefined,
                },
            });
        });

        test('.putIndex() is called with the linked model constructor', () => {
            expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {});
        });

        test('.getSearchIndex() is called twice', () => {
            expect(engine.getSearchIndex).toHaveBeenCalledTimes(2);
        });

        test('.getSearchIndex() is called with the model constructor', () => {
            expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
        });

        test('.getSearchIndex() is called with the model constructor', () => {
            expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
        });

        test('.putSearchIndex() is called twice', () => {
            expect(engine.putSearchIndex).toHaveBeenCalledTimes(2);
        });

        test('.putSearchIndex() is called with the model constructor', () => {
            expect(engine.putSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                [model.id]: model.toSearchData(),
            });
        });

        test('.putSearchIndex() is called with the linked model constructor', () => {
            expect(engine.putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {});
        });
    });

    describe('when a forwards one way linked model exists', () => {
        describe('and delete is called with propagate', () => {
            const model = LinkedModelWithSearchIndexFactory();
            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

            beforeAll(() => connection.delete(model.toData(), []));

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

            test('.getIndex() is called once', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(1);
            });

            test('.getIndex() is called with the main model constructor', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(model.constructor);
            });

            test('.putIndex() is called once', () => {
                expect(engine.putIndex).toHaveBeenCalledTimes(1);
            });

            test('.putIndex() is called with the main model constructor', () => {
                expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {});
            });

            test('.getSearchIndex() is called once', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
            });

            test('.getSearchIndex() is called with the model constructor', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
            });

            test('.putSearchIndex() is called once', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
            });

            test('.putSearchIndex() is called with the model constructor', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {});
            });
        });
    });

    describe('when a backwards one to many linked model exists', () => {
        describe('and delete is called with propagate', () => {
            const model = LinkedManyModelWithSearchIndexFactory();
            const otherLinked = SimpleModelWithSearchIndexFactory();

            model.linked.push(otherLinked);

            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [LinkedManyModelWithSearchIndex, SimpleModelWithSearchIndex]);

            beforeAll(() => connection.delete(model.linked[0].toData(), [model.id]));

            test('.getModel() is called thrice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(3);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the first linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked[0].id);
            });

            test('.getModel() is called with the second linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked[1].id);
            });

            test('.deleteModel() is called once', () => {
                expect(engine.deleteModel).toHaveBeenCalledTimes(1);
            });

            test('.deleteModel() is called with the linked model', () => {
                expect(engine.deleteModel).toHaveBeenCalledWith(model.linked[0].id);
            });

            test('.putModel() is called once', () => {
                expect(engine.putModel).toHaveBeenCalledTimes(1);
            });

            test('.putModel() is called with the main model', () => {
                expect(engine.putModel).toHaveBeenCalledWith({
                    ...model.toData(),
                    linked: [{id: otherLinked.id}],
                });
            });

            test('.getIndex() is called twice', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(2);
            });

            test('.getIndex() is called with the main model constructor', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex);
            });

            test('.getIndex() is called with the linked model constructor', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putIndex() is called twice', () => {
                expect(engine.putIndex).toHaveBeenCalledTimes(2);
            });

            test('.putIndex() is called with the main model constructor', () => {
                expect(engine.putIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex, {
                    [model.id]: {
                        ...model.toIndexData(),
                        linked: [{id: otherLinked.id, string: 'string'}],
                    },
                });
            });

            test('.putIndex() is called with the linked model constructor', () => {
                expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                    [otherLinked.id]: otherLinked.toIndexData(),
                });
            });

            test('.getSearchIndex() is called twice', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledTimes(2);
            });

            test('.getSearchIndex() is called with the main model constructor', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex);
            });

            test('.getSearchIndex() is called with the linked model constructor', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putSearchIndex() is called twice', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledTimes(2);
            });

            test('.putSearchIndex() is called with the main model search index', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex, {
                    [model.id]: {
                        ...model.toSearchData(),
                        linked: [{string: 'string'}],
                    },
                });
            });

            test('.putSearchIndex() is called with the linked model search index', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                    [otherLinked.id]: otherLinked.toSearchData(),
                });
            });
        });

        describe('and delete is called without propagate', () => {
            const model = LinkedManyModelWithSearchIndexFactory();

            model.linked.push(SimpleModelWithSearchIndexFactory());

            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [LinkedManyModelWithSearchIndex, SimpleModelWithSearchIndex]);

            test('.delete() throws a cannot delete error', async () => {
                await expect(connection.delete(model.linked[0]))
                    .rejects.toMatchObject({
                        message: `Deleting ${model.linked[0].id} has unintended consequences`,
                        consequences: {
                            willDelete: [],
                            willUpdate: [{
                                ...model,
                                linked: [model.linked[1]],
                            }],
                        },
                    });
            });

            test('.getModel() is called thrice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(3);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the first linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked[0].id);
            });

            test('.getModel() is called with the second linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked[1].id);
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

            test('.getIndex() is called with the main model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex);
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

    describe('when a forwards one to many linked model exists', () => {
        describe('and delete is called with propagate', () => {
            const model = LinkedManyModelWithSearchIndexFactory();
            const otherLinked = SimpleModelWithSearchIndexFactory();

            model.linked.push(otherLinked);

            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [LinkedManyModelWithSearchIndex, SimpleModelWithSearchIndex]);

            beforeAll(() => connection.delete(model.toData(), [model.id]));

            test('.getModel() is called thrice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(3);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the first linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked[0].id);
            });

            test('.getModel() is called with the second linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked[1].id);
            });

            test('.deleteModel() is called once', () => {
                expect(engine.deleteModel).toHaveBeenCalledTimes(1);
            });

            test('.deleteModel() is called with the main model', () => {
                expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
            });

            test('.putModel() is not called', () => {
                expect(engine.putModel).not.toHaveBeenCalled();
            });

            test('.getIndex() is called once', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(1);
            });

            test('.getIndex() is called with the main model constructor', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex);
            });

            test('.putIndex() is called once', () => {
                expect(engine.putIndex).toHaveBeenCalledTimes(1);
            });

            test('.putIndex() is called with the main model constructor', () => {
                expect(engine.putIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex, {});
            });

            test('.getSearchIndex() is called once', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledTimes(1);
            });

            test('.getSearchIndex() is called with the main model constructor', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex);
            });

            test('.putSearchIndex() is called once', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledTimes(1);
            });

            test('.putSearchIndex() is called with the main model search index', () => {
                expect(engine.putSearchIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex, {});
            });
        });

        describe('and delete is called without propagate', () => {
            const model = LinkedManyModelWithSearchIndexFactory();

            model.linked.push(SimpleModelWithSearchIndexFactory());

            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [LinkedManyModelWithSearchIndex, SimpleModelWithSearchIndex]);

            test('.delete() throws a cannot delete error', async () => {
                await expect(connection.delete(model.linked[0]))
                    .rejects.toMatchObject({
                        message: `Deleting ${model.linked[0].id} has unintended consequences`,
                        consequences: {
                            willDelete: [],
                            willUpdate: [{
                                ...model,
                                linked: [model.linked[1]],
                            }],
                        },
                    });
            });

            test('.getModel() is called thrice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(3);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the first linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked[0].id);
            });

            test('.getModel() is called with the second linked model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked[1].id);
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

            test('.getIndex() is called with the main model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(LinkedManyModelWithSearchIndex);
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

    describe('when a model with an index exists', () => {
        const model = SimpleModelWithIndexFactory();
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [SimpleModelWithIndex]);

        beforeAll(() => connection.delete(model));

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

        test('.getSearchIndex() is not called', () => {
            expect(engine.getSearchIndex).not.toHaveBeenCalled();
        });

        test('.putSearchIndex() is not called', () => {
            expect(engine.putSearchIndex).not.toHaveBeenCalled();
        });
    });

    describe('when a model with a search index exists', () => {
        const model = SimpleModelWithSearchIndexFactory();
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [SimpleModelWithSearchIndex]);

        beforeAll(() => connection.delete(model));

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
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [CircularLinkedModel]);

        beforeAll(() => connection.delete(model, [model.linked.id]));

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

        test('.getSearchIndex() is not called', () => {
            expect(engine.getSearchIndex).not.toHaveBeenCalled();
        });

        test('.putSearchIndex() is not called', () => {
            expect(engine.putSearchIndex).not.toHaveBeenCalled();
        });
    });

    describe('when a model with a non-required circular link with a search index exists', () => {
        const model = CircularLinkedModelWithSearchIndexFactory();
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [CircularLinkedModelWithSearchIndex]);

        beforeAll(() => connection.delete(model, [model.linked.id]));

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
            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [CircularRequiredLinkedModelWithSearchIndex]);

            test('.delete() throws a cannot delete error', async () => {
                await expect(connection.delete(model.linked)).rejects.toMatchObject({
                    message: `Deleting ${model.linked.id} has unintended consequences`,
                    consequences: {
                        willDelete: [model],
                        willUpdate: [],
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
            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [CircularRequiredLinkedModelWithSearchIndex]);

            beforeAll(() => connection.delete(model, [model.linked.id]));

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
            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [RequiredLinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

            test('.delete() throws a cannot delete error', async () => {
                await expect(connection.delete(model.linked))
                    .rejects.toMatchObject({
                        message: `Deleting ${model.linked.id} has unintended consequences`,
                        consequences: {willDelete: [model]},
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

            test('.getIndex() is called with the main model', () => {
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
            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [RequiredLinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);

            beforeAll(() => connection.delete(model.linked, [model.id]));

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

            test('.getIndex() is called twice', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(2);
            });

            test('.getIndex() is called with the main model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(RequiredLinkedModelWithSearchIndex);
            });

            test('.getIndex() is called with the linked model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putIndex() is called twice', () => {
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
        const engine = TestStorageEngineFactory();
        const connection = new Connection(engine, [SimpleModelWithFullIndex]);

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
        const model = SimpleModelWithFullIndexFactory();
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [SimpleModelWithFullIndex]);

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
        const model1 = SimpleModelWithFullIndexFactory();
        const model2 = SimpleModelWithFullIndexFactory();

        model1.string = 'matching';

        const engine = TestStorageEngineFactory([model1, model2]);
        const connection = new Connection(engine, [SimpleModelWithFullIndex]);

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
        const model1 = SimpleModelWithFullIndexFactory();
        const model2 = SimpleModelWithFullIndexFactory();
        const engine = TestStorageEngineFactory([model1, model2]);
        const connection = new Connection(engine, [SimpleModelWithFullIndex]);

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
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [SimpleModel]);

        test('.search() returns no results', async () => {
            expect(await connection.search(model.constructor, 'xyz')).toStrictEqual([]);
        });

        test('.getSearchIndex() was called with the model', () => {
            expect(engine.getSearchIndex).toHaveBeenCalledWith(model.constructor);
        });
    });

    describe('when there are matching results', () => {
        const model = SimpleModelWithSearchIndexFactory();
        model.string = 'abc';
        const engine = TestStorageEngineFactory([model]);
        const connection = new Connection(engine, [SimpleModel]);

        test('.search() returns results', async () => {
            expect(await connection.search(model.constructor, 'abc')).toStrictEqual([
                new SearchResult(model.constructor.fromData(model.toSearchData()), 0.288),
            ]);
        });

        test('.getSearchIndex() was called with the model', () => {
            expect(engine.getSearchIndex).toHaveBeenCalledWith(model.constructor);
        });
    });
});

describe('connection.transaction()', () => {
    describe('when calling put', () => {
        describe('and the transaction succeeds', () => {
            describe('and the models do not exist', () => {
            const model = LinkedModelWithSearchIndexFactory();
            const engine = TestStorageEngineFactory();
            const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
            const transaction = connection.transaction();

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

                test('.getIndex() is called four times', () => {
                    expect(engine.getIndex).toHaveBeenCalledTimes(4);
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

                test('.getSearchIndex() is called four times', () => {
                    expect(engine.getSearchIndex).toHaveBeenCalledTimes(4);
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
                const model = LinkedModelWithSearchIndexFactory();
                const engine = TestStorageEngineFactory([model.linked]);
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
                const transaction = connection.transaction();

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

                    test('.putModel() is called once', () => {
                        expect(engine.putModel).toHaveBeenCalledTimes(1);
                    });

                    test('.putModel() is called with the main model\'s data', () => {
                        expect(engine.putModel).toHaveBeenCalledWith(model.toData());
                    });

                    test('.getIndex() is called twice', () => {
                        expect(engine.getIndex).toHaveBeenCalledTimes(2);
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
                            [model.id]: model.toIndexData(),
                        });
                    });

                    test('.putIndex() is not called for the linked model', () => {
                        expect(engine.putIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                            [model.linked.id]: model.linked.toIndexData(),
                        });
                    });

                    test('.getSearchIndex() is called twice', () => {
                        expect(engine.getSearchIndex).toHaveBeenCalledTimes(2);
                    });

                    test('.getSearchIndex() is called for the main model', () => {
                        expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
                    });

                    test('.getSearchIndex() is not called for the linked model', () => {
                        expect(engine.getSearchIndex).not.toHaveBeenCalledWith(SimpleModelWithSearchIndex);
                    });

                    test('.putSearchIndex() is called for the main model', () => {
                        expect(engine.putSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                            [model.id]: model.toSearchData(),
                        });
                    });
                });
            });
        });

        describe('and the models do not exist', () => {
            describe('and the second putIndex operation in the transaction fails', () => {
                const model = LinkedModelWithSearchIndexFactory();
                const engine = TestStorageEngineFactory();
                const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
                const transaction = connection.transaction();

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
                    let error = null;

                    beforeAll(async () => {
                        engine.putIndex.mockImplementation(modelConstructor => {
                            if (modelConstructor === SimpleModelWithSearchIndex)
                                throw new Error('Something went wrong');
                        });

                        await transaction.commit().catch(e => {
                            error = e;
                        });
                    });

                    describe('the commit transaction error object', () => {
                        test('is of type CommitFailedTransactionError', () => {
                            expect(error).toBeInstanceOf(CommitFailedTransactionError);
                        });

                        test('has an appropriate error message', () => {
                            expect(error).toHaveProperty('message', 'Operation failed to commit.');
                        });

                        test('includes the causing error', () => {
                            expect(error).toHaveProperty('error', new Error('Something went wrong'));
                        });

                        test('includes a list of transactions and their status', () => {
                            expect(error).toHaveProperty('transactions', expect.arrayContaining([
                                expect.objectContaining({
                                    args: [model.linked.constructor, {[model.linked.id]: model.linked.toIndexData()}],
                                    committed: false,
                                    error: new Error('Something went wrong'),
                                    method: 'putIndex',
                                    original: {},
                                }),
                            ]));
                        });
                    });

                    test('.putModel() is called twice times', () => {
                        expect(engine.putModel).toHaveBeenCalledTimes(2);
                    });

                    test('.putModel() is called with the new main model\'s data', () => {
                        expect(engine.putModel).toHaveBeenNthCalledWith(1, model.toData());
                    });

                    test('.putModel() is called with the linked model\'s data', () => {
                        expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                    });

                    test('.deleteModel() is called twice', () => {
                        expect(engine.deleteModel).toHaveBeenCalledTimes(2);
                    });

                    test('.deleteModel() is called with the main model\'s id', () => {
                        expect(engine.deleteModel).toHaveBeenCalledWith(model.id);
                    });

                    test('.deleteModel() is called with the linked model\'s id', () => {
                        expect(engine.deleteModel).toHaveBeenCalledWith(model.linked.id);
                    });

                    test('.putIndex() is called thrice', () => {
                        expect(engine.putIndex).toHaveBeenCalledTimes(3);
                    });

                    test('.putIndex() is called with the updated index for main model', () => {
                        expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                            [model.id]: model.toIndexData(),
                        });
                    });

                    test('.putIndex() is called with the updated index for linked model', () => {
                        expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                            [model.linked.id]: model.linked.toIndexData(),
                        });
                    });

                    test('.putIndex() is called with the old index for main model', () => {
                        expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {});
                    });
                });
            });
        });

        describe('and the second putModel operation in the transaction fails', () => {
            const engine = TestStorageEngineFactory();
            const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
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

            test('.getModel() is called thrice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(3);
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
                let error = null;

                beforeAll(async () => {
                    engine.putModel.mockImplementation(m => {
                        if (m.id === model.linked.id) {
                            throw new Error('Something went wrong');
                        }
                    });

                    await transaction.commit().catch(e => {
                        error = e;
                    });
                });

                describe('the commit transaction error object', () => {
                    test('is of type CommitFailedTransactionError', () => {
                        expect(error).toBeInstanceOf(CommitFailedTransactionError);
                    });

                    test('has an appropriate error message', () => {
                        expect(error).toHaveProperty('message', 'Operation failed to commit.');
                    });

                    test('includes the causing error', () => {
                        expect(error).toHaveProperty('error', new Error('Something went wrong'));
                    });

                    test('includes a list of transactions and their status', () => {
                        expect(error).toHaveProperty('transactions', expect.arrayContaining([
                            expect.objectContaining({
                                args: [model.linked.toData()],
                                committed: false,
                                error: new Error('Something went wrong'),
                                method: 'putModel',
                                original: {...model.linked.toData(), string: 'old'},
                            }),
                        ]));
                    });
                });

                test('.putModel() is called thrice', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(3);
                });

                test('.putModel() is called with the new main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(1, model.toData());
                });

                test('.putModel() is called with the old main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(3, {
                        ...model.toData(),
                        string: 'old',
                    });
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenCalledWith(model.linked.toData());
                });

                test('.putIndex() is not called', () => {
                    expect(engine.putIndex).not.toHaveBeenCalled();
                });
            });
        });

        describe('and the second putIndex operation in the transaction fails', () => {
            const model = LinkedModelWithSearchIndexFactory();
            const engine = TestStorageEngineFactory();
            const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
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

            test('.getModel() is called thrice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(3);
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
                let error = null;

                beforeAll(async () => {
                    engine.putIndex.mockImplementation(modelConstructor => {
                        if (modelConstructor === SimpleModelWithSearchIndex)
                            throw new Error('Something went wrong');
                    });

                    await transaction.commit().catch(e => {
                        error = e;
                    });
                });

                describe('the commit transaction error object', () => {
                    test('is of type CommitFailedTransactionError', () => {
                        expect(error).toBeInstanceOf(CommitFailedTransactionError);
                    });

                    test('has an appropriate error message', () => {
                        expect(error).toHaveProperty('message', 'Operation failed to commit.');
                    });

                    test('includes the causing error', () => {
                        expect(error).toHaveProperty('error', new Error('Something went wrong'));
                    });

                    test('includes a list of transactions and their status', () => {
                        expect(error).toHaveProperty('transactions', expect.arrayContaining([
                            expect.objectContaining({
                                args: [model.linked.constructor, {[model.linked.id]: model.linked.toIndexData()}],
                                committed: false,
                                error: new Error('Something went wrong'),
                                method: 'putIndex',
                                original: {},
                            }),
                        ]));
                    });
                });

                test('.putModel() is called four times', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(4);
                });

                test('.putModel() is called with the new main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(1, model.toData());
                });

                test('.putModel() is called with the old main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(4, {
                        ...model.toData(),
                        string: 'old',
                    });
                });

                test('.putModel() is called with the old linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(2, model.linked.toData());
                });

                test('.putModel() is called with the linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(3, {
                        ...model.linked.toData(),
                        string: 'old',
                    });
                });

                test('.putIndex() is called thrice', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(3);
                });

                test('.putIndex() is called with the updated index for main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('.putIndex() is called with the updated index for linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });

                test('.putIndex() is called with the old index for main model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex, {});
                });
            });
        });

        describe('and the second putSearchIndex operation in the transaction fails', () => {
            const model = LinkedModelWithSearchIndexFactory();
            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
            const transaction = connection.transaction();

            const updatedModel = LinkedModelWithSearchIndex.fromData(model.toData());
            updatedModel.string = 'updated';
            const updatedLinkedModel = SimpleModelWithSearchIndex.fromData(model.linked.toData());
            updatedModel.linked = updatedLinkedModel;
            updatedModel.linked.string = 'updated';

            beforeAll(() => transaction.put(updatedModel));

            test('.getModel() is called thrice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(3);
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

            test('.getIndex() is called with the main model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
            });

            test('.getIndex() is called with the linked model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putIndex() is not called', () => {
                expect(engine.putIndex).not.toHaveBeenCalled();
            });

            test('.getSearchIndex() is called twice', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledTimes(2);
            });

            test('.getSearchIndex() is called with the main model', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
            });

            test('.getSearchIndex() is called with the linked model', () => {
                expect(engine.getSearchIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex);
            });

            test('.putSearchIndex() is not called', () => {
                expect(engine.putSearchIndex).not.toHaveBeenCalled();
            });

            describe('and committing the transaction', () => {
                let error = null;

                beforeAll(async () => {
                    engine.putSearchIndex.mockImplementation(modelConstructor => {
                        if (modelConstructor === SimpleModelWithSearchIndex)
                            throw new Error('Something went wrong');
                    });

                    await transaction.commit().catch(e => {
                        error = e;
                    });
                });

                describe('the commit transaction error object', () => {
                    test('is of type CommitFailedTransactionError', () => {
                        expect(error).toBeInstanceOf(CommitFailedTransactionError);
                    });

                    test('has an appropriate error message', () => {
                        expect(error).toHaveProperty('message', 'Operation failed to commit.');
                    });

                    test('includes the causing error', () => {
                        expect(error).toHaveProperty('error', new Error('Something went wrong'));
                    });

                    test('includes a list of transactions and their status', () => {
                        expect(error).toHaveProperty('transactions', expect.arrayContaining([
                            expect.objectContaining({
                                args: [updatedModel.linked.constructor, {[updatedModel.linked.id]: updatedModel.linked.toSearchData()}],
                                committed: false,
                                error: new Error('Something went wrong'),
                                method: 'putSearchIndex',
                                original: {[model.linked.id]: model.linked.toSearchData()},
                            }),
                        ]));
                    });
                });

                test('.putModel() is called four times', () => {
                    expect(engine.putModel).toHaveBeenCalledTimes(4);
                });

                test('.putModel() is called with the new main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(1, updatedModel.toData());
                });

                test('.putModel() is called with the new linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(2, updatedModel.linked.toData());
                });

                test('.putModel() is called with the old main model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(4, model.toData());
                });

                test('.putModel() is called with the old linked model\'s data', () => {
                    expect(engine.putModel).toHaveBeenNthCalledWith(3, model.linked.toData());
                });

                test('.putIndex() is called four times', () => {
                    expect(engine.putIndex).toHaveBeenCalledTimes(4);
                });

                test('.putIndex() is called with the new main model\'s data', () => {
                    expect(engine.putIndex).toHaveBeenNthCalledWith(1, LinkedModelWithSearchIndex, {
                        [updatedModel.id]: updatedModel.toIndexData(),
                    });
                });

                test('.putIndex() is called with the new linked model\'s data', () => {
                    expect(engine.putIndex).toHaveBeenNthCalledWith(2, SimpleModelWithSearchIndex, {
                        [updatedModel.linked.id]: updatedModel.linked.toIndexData(),
                    });
                });

                test('.putIndex() is called with the old main model\'s data', () => {
                    expect(engine.putIndex).toHaveBeenNthCalledWith(4, LinkedModelWithSearchIndex, {
                        [model.id]: model.toIndexData(),
                    });
                });

                test('.putIndex() is called with the old linked model\'s data', () => {
                    expect(engine.putIndex).toHaveBeenNthCalledWith(3, SimpleModelWithSearchIndex, {
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });

                test('.putIndex() is called with the updated index for linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [updatedModel.linked.id]: updatedModel.linked.toIndexData(),
                    });
                });

                test('.putIndex() is called with the old index for linked model', () => {
                    expect(engine.putIndex).toHaveBeenCalledWith(SimpleModelWithSearchIndex, {
                        [model.linked.id]: model.linked.toIndexData(),
                    });
                });

                test('.putSearchIndex() is called thrice', () => {
                    expect(engine.putSearchIndex).toHaveBeenCalledTimes(3);
                });

                test('.putSearchIndex() is called with the updated index for main model', () => {
                    expect(engine.putSearchIndex).toHaveBeenNthCalledWith(1, LinkedModelWithSearchIndex, {
                        [updatedModel.id]: updatedModel.toSearchData(),
                    });
                });

                test('.putSearchIndex() is called with the updated index for linked model', () => {
                    expect(engine.putSearchIndex).toHaveBeenNthCalledWith(2, SimpleModelWithSearchIndex, {
                        [updatedModel.linked.id]: updatedModel.linked.toSearchData(),
                    });
                });

                test('.putSearchIndex() is called with the old index for main model', () => {
                    expect(engine.putSearchIndex).toHaveBeenNthCalledWith(3, LinkedModelWithSearchIndex, {
                        [model.id]: model.toSearchData(),
                    });
                });
            });
        });
    });

    describe('when calling delete', () => {
        describe('and the transaction succeeds', () => {
            const model = LinkedModelWithSearchIndexFactory();
            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
            const transaction = connection.transaction();

            beforeAll(() => transaction.delete(model));

            test('.getModel() is called twice', () => {
                expect(engine.getModel).toHaveBeenCalledTimes(2);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.id);
            });

            test('.getModel() is called with the main model id', () => {
                expect(engine.getModel).toHaveBeenCalledWith(model.linked.id);
            });

            test('.deleteModel() is not called', () => {
                expect(engine.deleteModel).not.toHaveBeenCalled();
            });

            describe('and committing the transaction', () => {
                beforeAll(() => transaction.commit());

                test('.getModel() is called thrice', () => {
                    expect(engine.getModel).toHaveBeenCalledTimes(3);
                });

                test('.getModel() is called first with the main model id', () => {
                    expect(engine.getModel).toHaveBeenNthCalledWith(1, model.id);
                });

                test('.getModel() is called second with a linked model id', () => {
                    expect(engine.getModel).toHaveBeenNthCalledWith(2, model.linked.id);
                });

                test('.getModel() is called third with a linked model id', () => {
                    expect(engine.getModel).toHaveBeenNthCalledWith(3, model.id);
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
            const model = LinkedModelWithSearchIndexFactory();
            const engine = TestStorageEngineFactory([model]);
            const connection = new Connection(engine, [LinkedModelWithSearchIndex, SimpleModelWithSearchIndex]);
            const transaction = connection.transaction();

            beforeAll(() => transaction.delete(model.toData()));

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

            test('.deleteModel() is not called', () => {
                expect(engine.deleteModel).not.toHaveBeenCalled();
            });

            test('.getIndex() is called once', () => {
                expect(engine.getIndex).toHaveBeenCalledTimes(1);
            });

            test('.getIndex() is called for the main model', () => {
                expect(engine.getIndex).toHaveBeenCalledWith(LinkedModelWithSearchIndex);
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

            test('.putSearchIndex() is not called', () => {
                expect(engine.putSearchIndex).not.toHaveBeenCalled();
            });

            describe('and committing the transaction', () => {
                let error = null;

                beforeAll(async () => {
                    engine.deleteModel.mockRejectedValue(new Error('Something went wrong'));

                    await transaction.commit().catch(e => {
                        error = e;
                    });
                });

                describe('the commit transaction error object', () => {
                    test('is of type CommitFailedTransactionError', () => {
                        expect(error).toBeInstanceOf(CommitFailedTransactionError);
                    });

                    test('has an appropriate error message', () => {
                        expect(error).toHaveProperty('message', 'Operation failed to commit.');
                    });

                    test('includes the causing error', () => {
                        expect(error).toHaveProperty('error', new Error('Something went wrong'));
                    });

                    test('includes a list of transactions and their status', () => {
                        expect(error).toHaveProperty('transactions', expect.arrayContaining([
                            expect.objectContaining({
                                args: [model.id],
                                committed: false,
                                error: new Error('Something went wrong'),
                                method: 'deleteModel',
                                original: model.toData(),
                            }),
                        ]));
                    });
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
