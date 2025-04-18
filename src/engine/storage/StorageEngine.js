import {Transaction} from '../../Connection.js';

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
     * @param {object} consequences
     */
    constructor(modelId, consequences) {
        super(`Deleting ${modelId} has unintended consequences`);
        this.consequences = consequences;
    }
}

/**
 *
 * @param {Array<Transaction>} transactions
 * @param {StorageEngine} engine
 * @return {StorageEngine}
 */
export function CreateTransactionalStorageEngine(transactions, engine) {
    const transactionalEngine = Object.create(engine);

    transactionalEngine.putModel = (...args) => {
        transactions.push(new Transaction('putModel', ...args));
        return Promise.resolve();
    };

    transactionalEngine.deleteModel = (...args) => {
        transactions.push(new Transaction('deleteModel', ...args));
        return Promise.resolve();
    };

    transactionalEngine.putIndex = (...args) => {
        transactions.push(new Transaction('putIndex', ...args));
        return Promise.resolve();
    };

    transactionalEngine.putSearchIndex = (...args) => {
        transactions.push(new Transaction('putSearchIndex', ...args));
        return Promise.resolve();
    };

    return transactionalEngine;
}
