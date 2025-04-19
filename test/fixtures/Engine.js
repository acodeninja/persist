import StorageEngine, {ModelNotFoundStorageEngineError} from '../../src/engine/storage/StorageEngine.js';
import Model from '../../src/data/Model.js';
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
        this.getModel = jest.fn();
    }
}

export function TestStorageEngineFactory(initialModels = []) {
    const engine  = new TestStorageEngine({});

    const modelsAddedToVirtualEngine = [];

    /**
     * Recursively create the virtual engine storage.
     *
     * @param {Object} virtualEngineStorage
     * @param {Array<Model>} inputModels
     * @return {*}
     */
    function virtualEngineStorageFromModels(virtualEngineStorage, ...inputModels) {
        for (const model of inputModels) {
            const modelIndexPath = model.id.replace(/[A-Z0-9]+$/, 'index');
            const searchIndexRawPath = model.id.replace(/[A-Z0-9]+$/, 'search');

            virtualEngineStorage[model.id] = model.toData();

            virtualEngineStorage[modelIndexPath] = virtualEngineStorage[modelIndexPath] ?? {};
            virtualEngineStorage[modelIndexPath][model.id] = model.toIndexData();

            if (model.constructor.searchProperties().length > 0) {
                virtualEngineStorage[searchIndexRawPath] = virtualEngineStorage[searchIndexRawPath] ?? {};
                virtualEngineStorage[searchIndexRawPath][model.id] = model.toSearchData();
            }

            modelsAddedToVirtualEngine.push(model.id);

            for (const [_property, value] of Object.entries(model)) {
                if (Model.isModel(value) && !modelsAddedToVirtualEngine.includes(value.id)) {
                    virtualEngineStorage = virtualEngineStorageFromModels(virtualEngineStorage, value);
                }

                if (Array.isArray(value)) {
                    for (const [_subProperty, subModel] of Object.entries(value)) {
                        if (Model.isModel(subModel) && !modelsAddedToVirtualEngine.includes(subModel.id)) {
                            virtualEngineStorage = virtualEngineStorageFromModels(virtualEngineStorage, subModel);
                        }
                    }
                }
            }
        }

        return virtualEngineStorage;
    }

    const engineVirtualStorage = virtualEngineStorageFromModels({}, ...initialModels);

    engine.getModel.mockImplementation((id) => {
        if (engineVirtualStorage[id])
            return Promise.resolve(engineVirtualStorage[id]);

        return Promise.reject(new ModelNotFoundStorageEngineError(id));
    });

    engine.putModel.mockImplementation((modelData) => {
        engineVirtualStorage[modelData.id] = modelData;
        return Promise.resolve();
    });

    engine.deleteModel.mockImplementation((id) => {
        delete engineVirtualStorage[id];
        return Promise.resolve();
    });

    engine.getIndex.mockImplementation((modelConstructor) =>
        Promise.resolve(engineVirtualStorage[`${modelConstructor.name}/index`] ?? {}),
    );

    engine.putIndex.mockImplementation((modelConstructor, index) => {
        engineVirtualStorage[`${modelConstructor.name}/index`] = index;

        return Promise.resolve();
    });

    engine.getSearchIndex.mockImplementation((modelConstructor) =>
        Promise.resolve(engineVirtualStorage[`${modelConstructor.name}/search`] ?? {}),
    );

    engine.putSearchIndex.mockImplementation((modelConstructor, searchIndex) => {
        engineVirtualStorage[`${modelConstructor.name}/search`] = searchIndex;

        return Promise.resolve();
    });

    engine.virtualStorage = engineVirtualStorage;

    return engine;
}
