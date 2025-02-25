import StorageEngine, {
    MethodNotImplementedStorageEngineError,
    ModelNotFoundStorageEngineError,
    ModelNotRegisteredStorageEngineError,
} from './StorageEngine.js';
import {beforeAll, describe, expect, jest, test} from '@jest/globals';
import Type from '../type/index.js';

/**
 * @class EmptyModel
 * @extends Type.Model
 */
class EmptyModel extends Type.Model {
}

/**
 * @class SimpleModel
 * @extends Type.Model
 */
class SimpleModel extends EmptyModel {
    static {
        this.string = Type.String;
        this.number = Type.Number;
        this.boolean = Type.Boolean;
        this.date = Type.Date;
    }
}

/**
 * Factory for an SimpleModel
 * @return {SimpleModel}
 * @constructor
 */
function SimpleModelFactory() {
    return new SimpleModel({
        string: 'string',
        number: 1.4,
        boolean: true,
        date: new Date(),
    });
}

class SimpleModelWithIndex extends SimpleModel {
    static {
        this.string = Type.String;
        this.number = Type.Number;
        this.boolean = Type.Boolean;
        this.date = Type.Date;
        this.indexedProperties = () => ['string', 'number'];
    }
}

/**
 * Factory for an SimpleModelWithIndex
 * @return {SimpleModelWithIndex}
 * @constructor
 */
function SimpleModelWithIndexFactory() {
    return new SimpleModelWithIndex({
        string: 'string',
        number: 1.4,
        boolean: true,
        date: new Date(),
    });
}

class LinkedModel extends EmptyModel {
    static {
        this.string = Type.String;
        this.linked = () => SimpleModel;
    }
}

function LinkedModelFactory() {
    const linked = SimpleModelFactory();
    return new LinkedModel({
        string: 'string',
        linked,
    });
}

class LinkedModelWithIndex extends LinkedModel {
    static {
        this.string = Type.String;
        this.linked = () => SimpleModelWithIndex;
        this.indexedProperties = () => ['string'];
    }
}

function LinkedModelWithIndexFactory() {
    const linked = SimpleModelWithIndexFactory();
    return new LinkedModelWithIndex({
        string: 'string',
        linked,
    });
}

class TestStorageEngine extends StorageEngine {
    constructor(configuration = {}, models = null) {
        super(configuration, models);
        this._deleteModel = jest.fn();
        this._putIndex = jest.fn();
        this._getIndex = jest.fn();
        this._putModel = jest.fn();
        this._getModel = jest.fn().mockImplementation((id) => Promise.reject(new ModelNotFoundStorageEngineError(id)));
    }
}

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

    describe('when the model is a simple model without an index', () => {
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

    describe('when the model is a simple model with an index', () => {
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

    describe('when the model is a model with links without an index', () => {
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

    describe('when the model is a model with links and an index', () => {
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
});

describe('UnimplementedStorageEngine', () => {
    class UnimplementedStorageEngine extends StorageEngine {
    }

    const storageEngine = new UnimplementedStorageEngine({}, [EmptyModel]);

    describe.each([
        '_putModel',
        '_getModel',
        '_getIndex',
        '_putIndex',
    ])('when the storage engine does not implement %s', (method) => {
        test(`a ${method} is not implemented error is thrown`, async () => {
            await expect(() => storageEngine[method](new EmptyModel()))
                .rejects.toThrowError({
                    instanceOf: MethodNotImplementedStorageEngineError,
                    message: `The method ${method} is not implemented in the storage engine UnimplementedStorageEngine`,
                });
        });
    });
});

describe('new StorageEngine', () => {
    describe('when no arguments are given', () => {
        const engine = new StorageEngine();

        test('no models are registered', () => {
            expect(engine.models).toStrictEqual({});
        });

        test('no configuration is set', () => {
            expect(engine.configuration).toStrictEqual({});
        });
    });

    describe('when only a configuration is given', () => {
        const engine = new StorageEngine({test: true});

        test('no models are registered', () => {
            expect(engine.models).toStrictEqual({});
        });

        test('the given configuration is set', () => {
            expect(engine.configuration).toStrictEqual({test: true});
        });
    });

    describe('when both models and configuration are given', () => {
        const engine = new StorageEngine({test: true}, [EmptyModel]);

        test('the model is registered', () => {
            expect(engine.models).toStrictEqual({
                EmptyModel,
            });
        });

        test('the given configuration is set', () => {
            expect(engine.configuration).toStrictEqual({test: true});
        });
    });
});

describe('storageEngine.getLinksFor(model)', () => {
    describe('when there are no linked models', () => {
        const engine = new StorageEngine({}, [EmptyModel]);

        test('no models are returned', () => {
            expect(engine.getLinksFor(EmptyModel)).toStrictEqual({});
        });
    });

    describe('when the given model has a single directional link to another model', () => {
        /**
         * @class MainModel
         * @extends Type.Model
         */
        class MainModel extends Type.Model {
            static linked = () => LinkedModel;
        }

        /**
         * @class LinkedModel
         * @extends Type.Model
         */
        class LinkedModel extends Type.Model {
        }

        const engine = new StorageEngine({}, [MainModel, LinkedModel]);

        test('the linked model is returned', () => {
            expect(engine.getLinksFor(MainModel)).toStrictEqual({MainModel: {linked: LinkedModel}});
        });

        describe('and the link is not defined using an arrow function', () => {
            /**
             * @class LinkedModel
             * @extends Type.Model
             */
            class LinkedModel extends Type.Model {
            }

            /**
             * @class MainModel
             * @extends Type.Model
             */
            class MainModel extends Type.Model {
                static linked = LinkedModel;
            }

            const engine = new StorageEngine({}, [MainModel, LinkedModel]);

            test('the linked model is returned', () => {
                expect(engine.getLinksFor(MainModel)).toStrictEqual({MainModel: {linked: LinkedModel}});
            });
        });
    });

    describe('when the given model has a bi-directional link to another model', () => {
        /**
         * @class MainModel
         * @extends Type.Model
         */
        class MainModel extends Type.Model {
            static linked = () => LinkedModel;
        }

        /**
         * @class LinkedModel
         * @extends Type.Model
         */
        class LinkedModel extends Type.Model {
            static linked = () => MainModel;
        }

        const engine = new StorageEngine({}, [MainModel, LinkedModel]);

        test('both linked models are returned', () => {
            expect(engine.getLinksFor(MainModel)).toStrictEqual({
                MainModel: {linked: LinkedModel},
                LinkedModel: {linked: MainModel},
            });
        });
    });

    describe('when there are registered models that are linked but not related', () => {
        /**
         * @class MainModel
         * @extends Type.Model
         */
        class MainModel extends Type.Model {
            static linked = () => LinkedModel;
        }

        /**
         * @class LinkedModel
         * @extends Type.Model
         */
        class LinkedModel extends Type.Model {
            static linked = () => MainModel;
        }

        /**
         * @class SecondaryModel
         * @extends Type.Model
         */
        class SecondaryModel extends Type.Model {
            static linked = () => SecondaryLinkedModel;
        }

        /**
         * @class SecondaryLinkedModel
         * @extends Type.Model
         */
        class SecondaryLinkedModel extends Type.Model {
            static linked = () => SecondaryModel;
        }

        const engine = new StorageEngine({}, [MainModel, LinkedModel, SecondaryModel, SecondaryLinkedModel]);

        test('both linked models are returned', () => {
            expect(engine.getLinksFor(MainModel)).toStrictEqual({
                MainModel: {linked: LinkedModel},
                LinkedModel: {linked: MainModel},
            });
        });
    });
});

describe('storageEngine.getModelConstructorFromId(modelId)', () => {
    describe('when the given model is registered', () => {
        const storageEngine = new StorageEngine({}, [EmptyModel]);

        test('the model is returned', () => {
            const model = new EmptyModel();

            expect(storageEngine.getModelConstructorFromId(model.id)).toBe(EmptyModel);
        });
    });

    describe('when the given model is not registered', () => {
        const storageEngine = new StorageEngine({}, []);

        test('an error indicating the model is not registered is thrown', () => {
            const model = new EmptyModel();

            expect(() => storageEngine.getModelConstructorFromId(model.id))
                .toThrowError({
                    instanceOf: ModelNotRegisteredStorageEngineError,
                    message: 'The model EmptyModel is not registered in the storage engine StorageEngine',
                });
        });
    });
});


// describe('storageEngine.put(model)', () => {
//     class TestModel extends Type.Model {
//         static {
//             this.string = Type.String;
//             this.number = Type.Number;
//             this.boolean = Type.Boolean;
//             this.date = Type.Date;
//         }
//     }
//
//
//     describe('when a model already exists', () => {
//         describe('when the model has not changed', () => {
//             describe('when there are no linked models', () => {
//                 const storageEngine = new TestStorageEngine({}, [TestModel]);
//                 const model = new TestModel({
//                     string: 'string',
//                     number: 1.4,
//                     boolean: true,
//                     date: new Date(),
//                 });
//
//                 beforeAll(() => {
//                     storageEngine._getModel.mockResolvedValueOnce(model);
//                     storageEngine.put(model);
//                 });
//
//                 test('._getModel(model.id) is called once', () => {
//                     expect(storageEngine._getModel).toHaveBeenNthCalledWith(1, model.id);
//                 });
//
//                 test('._putModel(model) is not called', () => {
//                     expect(storageEngine._putModel).not.toHaveBeenCalled();
//                 });
//
//                 test('._getIndex(modelConstructor) is not called', () => {
//                     expect(storageEngine._getIndex).not.toHaveBeenCalled();
//                 });
//
//                 test('._putIndex(modelConstructor, data) is not called', () => {
//                     expect(storageEngine._putIndex).not.toHaveBeenCalled();
//                 });
//
//                 describe('when the model has indexed fields', () => {
//                     class TestModelWithIndex extends TestModel {
//                         static indexedProperties = () => ['string', 'number'];
//                     }
//
//                     const storageEngine = new TestStorageEngine({}, [TestModelWithIndex]);
//                     const model = new TestModelWithIndex({
//                         string: 'string',
//                         number: 1.4,
//                         boolean: true,
//                         date: new Date(),
//                     });
//
//                     beforeAll(() => {
//                         storageEngine._getModel.mockResolvedValueOnce(model);
//                         storageEngine.put(model);
//                     });
//
//                     test('._getModel(model.id) is called once', () => {
//                         expect(storageEngine._getModel).toHaveBeenNthCalledWith(1, model.id);
//                     });
//
//                     test('._putModel(model) is not called', () => {
//                         expect(storageEngine._putModel).not.toHaveBeenCalled();
//                     });
//
//                     test('._getIndex(modelConstructor) is not called', () => {
//                         expect(storageEngine._getIndex).not.toHaveBeenCalled();
//                     });
//
//                     test('._putIndex(modelConstructor, data) is not called', () => {
//                         expect(storageEngine._putIndex).not.toHaveBeenCalled();
//                     });
//                 });
//             });
//         });
//
//         describe('when the model has changed', () => {
//             describe('when there are no linked models', () => {
//                 const storageEngine = new TestStorageEngine({}, [TestModel]);
//                 const model = new TestModel({
//                     string: 'string',
//                     number: 1.4,
//                     boolean: true,
//                     date: new Date(),
//                 });
//
//                 beforeAll(() => {
//                     const updatedModel = new TestModel({
//                         ...model.toData(),
//                         string: 'updated',
//                     });
//                     updatedModel.id = model.id;
//                     storageEngine._getModel.mockResolvedValueOnce(updatedModel);
//                     storageEngine.put(model);
//                 });
//
//                 test('._getModel(model.id) is called once', () => {
//                     expect(storageEngine._getModel).toHaveBeenNthCalledWith(1, model.id);
//                 });
//
//                 test('._putModel(model) called with the update model', () => {
//                     expect(storageEngine._putModel).toHaveBeenNthCalledWith(1, model.toData());
//                 });
//
//                 test('._getIndex(modelConstructor) is not called', () => {
//                     expect(storageEngine._getIndex).not.toHaveBeenCalled();
//                 });
//
//                 test('._putIndex(modelConstructor, data) is not called', () => {
//                     expect(storageEngine._putIndex).not.toHaveBeenCalled();
//                 });
//
//                 describe('when the model has indexed fields', () => {
//                     class TestModelWithIndex extends TestModel {
//                         static indexedProperties = () => ['string', 'number'];
//                     }
//
//                     const storageEngine = new TestStorageEngine({}, [TestModelWithIndex]);
//                     const model = new TestModelWithIndex({
//                         string: 'string',
//                         number: 1.4,
//                         boolean: true,
//                         date: new Date(),
//                     });
//
//                     beforeAll(() => {
//                         storageEngine._getModel.mockResolvedValueOnce(model);
//                         storageEngine.put(model);
//                     });
//
//                     test('._getModel(model.id) is called once', () => {
//                         expect(storageEngine._getModel).toHaveBeenNthCalledWith(1, model.id);
//                     });
//
//                     test('._putModel(model) is not called', () => {
//                         expect(storageEngine._putModel).not.toHaveBeenCalled();
//                     });
//
//                     test('._getIndex(modelConstructor) is not called', () => {
//                         expect(storageEngine._getIndex).not.toHaveBeenCalled();
//                     });
//
//                     test('._putIndex(modelConstructor, data) is not called', () => {
//                         expect(storageEngine._putIndex).not.toHaveBeenCalled();
//                     });
//                 });
//             });
//         });
//     });
//
//     describe('when the model does not already exist', () => {
//         describe('when the model is not registered', () => {
//             const storageEngine = new TestStorageEngine();
//
//             test('a model not registered error is thrown', async () => {
//                 await expect(() => storageEngine.put(new TestModel()))
//                     .rejects.toThrowError({
//                         instanceOf: ModelNotRegisteredStorageEngineError,
//                         message: 'The model TestModel is not registered in the storage engine TestStorageEngine',
//                     });
//             });
//         });
//
//         describe('when the model is invalid', () => {
//             const storageEngine = new TestStorageEngine({}, [TestModel]);
//             const testModel = new TestModel({string: false});
//
//             test('a model validation error is thrown', async () => {
//                 await expect(() => storageEngine.put(testModel))
//                     .rejects.toThrowError({
//                         instanceOf: ModelNotRegisteredStorageEngineError,
//                         message: 'Validation failed',
//                     });
//             });
//         });
//
//         describe('when there are no linked models', () => {
//             const storageEngine = new TestStorageEngine({}, [TestModel]);
//             const model = new TestModel({
//                 string: 'string',
//                 number: 1.4,
//                 boolean: true,
//                 date: new Date(),
//             });
//
//             beforeAll(() => storageEngine.put(model));
//
//             test('._putModel(model) is called once with a dried out model', () => {
//                 expect(storageEngine._putModel).toHaveBeenNthCalledWith(1, model.toData());
//             });
//
//             test('._getModel(model.id) is called once', () => {
//                 expect(storageEngine._getModel).toHaveBeenNthCalledWith(1, model.id);
//             });
//
//             test('._getIndex(modelConstructor) is not called', () => {
//                 expect(storageEngine._getIndex).not.toHaveBeenCalled();
//             });
//
//             test('._putIndex(modelConstructor, data) is not called', () => {
//                 expect(storageEngine._putIndex).not.toHaveBeenCalled();
//             });
//         });
//
//         describe('when the model has indexed fields', () => {
//             class TestModelWithIndex extends TestModel {
//                 static indexedProperties = () => ['string', 'number'];
//             }
//
//             const storageEngine = new TestStorageEngine({}, [TestModelWithIndex]);
//             const model = new TestModelWithIndex({
//                 string: 'string',
//                 number: 1.4,
//                 boolean: true,
//                 date: new Date(),
//             });
//
//             beforeAll(() => storageEngine.put(model));
//
//             test('._putModel(model) is called once with a dried out model', () => {
//                 expect(storageEngine._putModel).toHaveBeenNthCalledWith(1, model.toData());
//             });
//
//             test('._getModel(model.id) is called once', () => {
//                 expect(storageEngine._getModel).toHaveBeenNthCalledWith(1, model.id);
//             });
//
//             test('._getIndex(modelConstructor) is called', () => {
//                 expect(storageEngine._getIndex).toHaveBeenCalledWith(TestModelWithIndex);
//             });
//
//             test('._putIndex(modelConstructor, data) is called', () => {
//                 expect(storageEngine._putIndex).toHaveBeenCalledWith(TestModelWithIndex, {
//                     [model.id]: model.toIndexData(),
//                 });
//             });
//         });
//     });
// });
