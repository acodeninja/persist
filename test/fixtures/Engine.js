import StorageEngine, {ModelNotFoundStorageEngineError} from '../../src/engine/StorageEngine.js';
import {jest} from '@jest/globals';

/**
 * @class TestStorageEngine
 * @extends StorageEngine
 */
export class TestStorageEngine extends StorageEngine {
    constructor(configuration = {}, models = null) {
        super(configuration, models);
        this._deleteModel = jest.fn();
        this._putSearchIndex = jest.fn();
        this._getSearchIndex = jest.fn();
        this._getSearchIndexCompiled = jest.fn();
        this._putIndex = jest.fn();
        this._getIndex = jest.fn();
        this._putModel = jest.fn();
        this._getModel = jest.fn().mockImplementation((id) => Promise.reject(new ModelNotFoundStorageEngineError(id)));
    }
}
