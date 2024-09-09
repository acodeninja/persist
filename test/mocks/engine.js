import Engine from '../../src/engine/Engine.js';
import sinon from 'sinon';

export function getTestEngine(models = []) {
    const _models = {};
    const _index = {};
    const _searchIndexRaw = {};
    const _searchIndexCompiled = {};

    for (const model of models) {
        _models[model.id] = model;
    }

    class TestEngine extends Engine {
    }

    TestEngine.getById = sinon.stub().callsFake(async (id) => {
        if (_models[id]) return _models[id];

        throw new Error(`Model ${id} not found.`);
    });

    TestEngine.putModel = sinon.stub().callsFake(async (model) => {
        _models[model.id] = model.toData();
    });

    TestEngine.putIndex = sinon.stub().callsFake(async (index) => {
        for (const [key, value] of Object.entries(index)) {
            _index[key] = value;
        }
    });

    TestEngine.getSearchIndexCompiled = sinon.stub().callsFake(async (model) => {
        if (_searchIndexCompiled[model.toString()]) return _searchIndexCompiled[model.toString()];

        throw new Error(`Search index does not exist for ${model.name}`);
    });

    TestEngine.getSearchIndexRaw = sinon.stub().callsFake(async (model) => {
        if (_searchIndexRaw[model.toString()]) return _searchIndexRaw[model.toString()];

        return {};
    });

    TestEngine.putSearchIndexCompiled = sinon.stub().callsFake(async (model, compiledIndex) => {
        _searchIndexCompiled[model.toString()] = compiledIndex;
    });

    TestEngine.putSearchIndexRaw = sinon.stub().callsFake(async (model, rawIndex) => {
        _searchIndexCompiled[model.toString()] = rawIndex;
    });

    TestEngine.findByValue = sinon.stub().callsFake(async (model, parameters) => {
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
        return found;
    });

    return TestEngine;
}
