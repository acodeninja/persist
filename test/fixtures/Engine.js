import StorageEngine, {ModelNotFoundStorageEngineError} from '../../src/engine/storage/StorageEngine.js';
import {jest} from '@jest/globals';

/**
 * @class TestStorageEngine
 * @extends StorageEngine
 */
export class TestStorageEngine extends StorageEngine {
    constructor(configuration = {}) {
        super(configuration);
        this.deleteModel = jest.fn();
        this.putSearchIndex = jest.fn();
        this.getSearchIndex = jest.fn().mockResolvedValue({});
        this.putIndex = jest.fn();
        this.getIndex = jest.fn().mockResolvedValue({});
        this.putModel = jest.fn();
        this.getModel = jest.fn().mockImplementation((id) => Promise.reject(new ModelNotFoundStorageEngineError(id)));
    }
}
