export default class StorageEngine {
    /**
     * @param {Object} configuration
     */
    constructor(configuration = {}) {
        this.configuration = configuration;
    }

    /**
     * Get a model
     * @param {string} _id
     * @throws MethodNotImplementedStorageEngineError
     * @throws ModelNotFoundStorageEngineError
     * @return Promise<Object>
     */
    getModel(_id) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('getModel', this));
    }

    /**
     * Update a model
     * @param {Object} _model
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    putModel(_model) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('putModel', this));
    }

    /**
     * Delete a model
     * @param {string} _id
     * @throws MethodNotImplementedStorageEngineError
     * @throws ModelNotFoundStorageEngineError
     * @return Promise<void>
     */
    deleteModel(_id) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('deleteModel', this));
    }

    /**
     * Get a model's index data
     * @param {Model.constructor} _modelConstructor
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<Record<String, Object>>
     */
    getIndex(_modelConstructor) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('getIndex', this));
    }

    /**
     * Put a model's index data
     * @param {Model.constructor} _modelConstructor
     * @param {Record<String, Object>} _data
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    putIndex(_modelConstructor, _data) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('putIndex', this));
    }

    /**
     * Get a model's raw search index data
     * @param {Model.constructor} _modelConstructor
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<Record<String, Object>>
     */
    getSearchIndex(_modelConstructor) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('getSearchIndex', this));
    }

    /**
     * Put a model's raw and compiled search index data
     * @param {Model.constructor} _constructor
     * @param {Record<string, object>} _index
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<Record<String, Object>>
     */
    putSearchIndex(_constructor, _index) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('putSearchIndex', this));
    }
}

/**
 * @class StorageEngineError
 * @extends Error
 */
export class StorageEngineError extends Error {
}

/**
 * @class MisconfiguredStorageEngineError
 * @extends StorageEngineError
 */
export class MisconfiguredStorageEngineError extends StorageEngineError {
    /**
     * @param {string} message
     * @param {StorageEngine} storageEngine
     */
    constructor(message, storageEngine) {
        super(`Incorrect configuration given for storage engine ${storageEngine.constructor.name}: ${message}`);
    }
}

/**
 * @class MethodNotImplementedStorageEngineError
 * @extends StorageEngineError
 */
export class MethodNotImplementedStorageEngineError extends StorageEngineError {
    /**
     * @param {string} method
     * @param {StorageEngine} storageEngine
     */
    constructor(method, storageEngine) {
        super(`The method ${method} is not implemented in the storage engine ${storageEngine.constructor.name}`);
    }
}

/**
 * @class ModelNotFoundStorageEngineError
 * @extends StorageEngineError
 */
export class ModelNotFoundStorageEngineError extends StorageEngineError {
    /**
     * @param {string} modelId
     */
    constructor(modelId) {
        super(`The model ${modelId} was not found`);
    }
}

export class DeleteHasUnintendedConsequencesStorageEngineError extends StorageEngineError {
    /**
     * @param {string} modelId
     * @param {Object} consequences
     * @param {Array<String>?} consequences.willDelete
     * @param {Array<String>?} consequences.willUpdate
     */
    constructor(modelId, consequences) {
        super(`Deleting ${modelId} has unintended consequences`);
        this.consequences = consequences;
    }
}

/**
 * Represents a transactional operation to be executed, typically queued and later committed.
 *
 * Stores the method to invoke, the arguments to apply, and tracks the result or error state
 * of the transaction once it's processed.
 *
 * @class Operation
 */
export class Operation {
    constructor(method, ...args) {
        this.method = method;
        this.args = args;
        this.original = undefined;
        this.error = undefined;
        this.committed = false;
    }
}

const QUEUED_OPERATIONS = ['putModel', 'deleteModel', 'putIndex', 'putSearchIndex'];

/**
 * Wrap a storage engine so that writes queue as operations and reads pass through.
 *
 * @param {Array<Operation>} operations
 * @param {StorageEngine} engine
 * @return {StorageEngine}
 */
export function CreateTransactionalStorageEngine(operations, engine) {
    return new Proxy(engine, {
        get(target, property) {
            if (QUEUED_OPERATIONS.includes(property))
                return (...args) => {
                    operations.push(new Operation(property, ...args));
                    return Promise.resolve();
                };

            const value = Reflect.get(target, property, target);

            // Methods are bound to the engine rather than to the wrapper. An
            // engine holding its state in private class members cannot run its
            // own methods with anything else as the receiver, and every read
            // made through the transaction threw "Receiver must be an instance
            // of". The class itself is left alone, because binding it renames it
            // to "bound <Engine>" and the engine's errors quote that name.
            return typeof value === 'function' && property !== 'constructor'
                ? value.bind(target)
                : value;
        },
    });
}
