import StorageEngine, {ModelNotFoundStorageEngineError} from '../../src/engine/storage/StorageEngine.js';
import {jest} from '@jest/globals';

/**
 * @class TestStorageEngine
 * @extends StorageEngine
 */
export class TestStorageEngine extends StorageEngine {
    constructor(configuration = {}, models = null) {
        super(configuration, models);
        this.deleteModel = jest.fn();
        this.putSearchIndex = jest.fn();
        this.getSearchIndex = jest.fn();
        this.putIndex = jest.fn();
        this.getIndex = jest.fn();
        this.putModel = jest.fn();
        this.getModel = jest.fn().mockImplementation((id) => Promise.reject(new ModelNotFoundStorageEngineError(id)));
    }
}
