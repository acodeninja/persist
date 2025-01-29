import StorageEngine from '../../src/engine/storage/StorageEngine.js';
import _ from 'lodash';
import {jest} from '@jest/globals';

/**
 * @param models
 * @return {TestEngine}
 */
export function getTestEngine(models = []) {
    const _models = {};
    const _index = {};
    const _searchIndexRaw = {};
    const _searchIndexCompiled = {};

    for (const model of models) {
        _models[model.id] = _.cloneDeep(model);
    }

    /**
     * @class TestEngine
     * @extends StorageEngine
     */
    class TestEngine extends StorageEngine {
    }

    TestEngine.getById = jest.fn().mockImplementation((id) => {
        if (_models[id]) return Promise.resolve(_.cloneDeep(_models[id]));

        return Promise.reject(new Error(`Model ${id} not found.`));
    });

    TestEngine.putModel = jest.fn().mockImplementation((model) => {
        _models[model.id] = _.cloneDeep(model.toData());
        return Promise.resolve();
    });

    TestEngine.putIndex = jest.fn().mockImplementation((index) => {
        for (const [key, value] of Object.entries(index)) {
            _index[key] = _.cloneDeep(value);
        }
        return Promise.resolve();
    });

    TestEngine.getSearchIndexCompiled = jest.fn().mockImplementation((model) => {
        if (_searchIndexCompiled[model.toString()])
            return Promise.resolve(_.cloneDeep(_searchIndexCompiled[model.toString()]));

        return Promise.reject(new Error(`Search index does not exist for ${model.name}`));
    });

    TestEngine.getSearchIndexRaw = jest.fn().mockImplementation((model) => {
        if (_searchIndexRaw[model.toString()])
            return Promise.resolve(_.cloneDeep(_searchIndexRaw[model.toString()]));

        return Promise.resolve({});
    });

    TestEngine.putSearchIndexCompiled = jest.fn().mockImplementation((model, compiledIndex) => {
        _searchIndexCompiled[model.toString()] = _.cloneDeep(compiledIndex);
        return Promise.resolve();
    });

    TestEngine.putSearchIndexRaw = jest.fn().mockImplementation((model, rawIndex) => {
        _searchIndexCompiled[model.toString()] = _.cloneDeep(rawIndex);
        return Promise.resolve();
    });

    TestEngine.findByValue = jest.fn().mockImplementation((model, parameters) => {
        const found = [];
        for (const [id, data] of Object.entries(_models)) {
            if (id.startsWith(model.toString())) {
                for (const [key, value] of Object.entries(parameters)) {
                    if (data[key] === value) {
                        found.push(data);
                        break;
                    }
                }
            }
        }
        return Promise.resolve(found);
    });

    return TestEngine;
}
