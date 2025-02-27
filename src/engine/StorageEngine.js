import Type from '../type/index.js';
import _ from 'lodash';

export default class StorageEngine {
    /**
     * @param {Object} configuration
     * @param {Array<Type.Model.constructor>?} models
     */
    constructor(configuration = {}, models = null) {
        this.configuration = configuration;
        this.models = Object.fromEntries((models ?? []).map(model => [model.name, model]));
    }

    /**
     * Persists a model if it has changed, and updates all related models and their indexes
     * @param {Type.Model} model
     * @return {Promise<void>}
     */
    async put(model) {
        const processedModels = [];
        const modelsToPut = [];
        const modelsToReindex = {};
        const modelsToReindexSearch = {};

        /**
         * @param {Type.Model} modelToProcess
         * @return {Promise<void>}
         */
        const processModel = async (modelToProcess) => {
            if (processedModels.includes(modelToProcess.id))
                return;

            processedModels.push(modelToProcess.id);

            if (!Object.keys(this.models).includes(modelToProcess.constructor.name))
                throw new ModelNotRegisteredStorageEngineError(modelToProcess, this);

            modelToProcess.validate();
            const currentModel = await this.get(modelToProcess.id).catch(() => null);

            const modelToProcessHasChanged = JSON.stringify(currentModel?.toData() || {}) !== JSON.stringify(modelToProcess.toData());

            if (modelToProcessHasChanged) modelsToPut.push(modelToProcess);

            if (
                Boolean(modelToProcess.constructor.indexedProperties().length) &&
                indexedFieldsHaveChanged(currentModel, modelToProcess)
            ) {
                const modelToProcessConstructor = this.getModelConstructorFromId(modelToProcess.id);
                modelsToReindex[modelToProcessConstructor] = modelsToReindex[modelToProcessConstructor] || [];
                modelsToReindex[modelToProcessConstructor].push(modelToProcess);
            }

            if (
                Boolean(modelToProcess.constructor.searchProperties().length) &&
                searchableFieldsHaveChanged(currentModel, modelToProcess)
            ) {
                const modelToProcessConstructor = this.getModelConstructorFromId(modelToProcess.id);
                modelsToReindexSearch[modelToProcessConstructor] = modelsToReindexSearch[modelToProcessConstructor] || [];
                modelsToReindexSearch[modelToProcessConstructor].push(modelToProcess);
            }

            for (const [field, value] of Object.entries(modelToProcess)) {
                if (Type.Model.isModel(value)) {
                    await processModel(modelToProcess[field]);
                }
            }
        };

        await processModel(model);

        await Promise.all([
            Promise.all(modelsToPut.map(m => this._putModel(m.toData()))),
            Promise.all(Object.entries(modelsToReindex).map(async ([constructorName, models]) => {
                const modelConstructor = this.models[constructorName];
                const index = await this._getIndex(modelConstructor);

                await this._putIndex(modelConstructor, {
                    ...index || {},
                    ...Object.fromEntries(models.map(m => [m.id, m.toIndexData()])),
                });
            })),
            Promise.all(Object.entries(modelsToReindexSearch).map(async ([constructorName, models]) => {
                const modelConstructor = this.models[constructorName];
                const index = await this._getSearchIndex(modelConstructor);

                await this._putSearchIndex(modelConstructor, {
                    ...index || {},
                    ...Object.fromEntries(models.map(m => [m.id, m.toIndexData()])),
                });
            })),
        ]);
    }

    /**
     * Get a model by its id
     * @param {string} modelId
     * @throws {ModelNotFoundStorageEngineError}
     * @return {Promise<Type.Model>}
     */
    get(modelId) {
        try {
            this.getModelConstructorFromId(modelId);
        } catch (e) {
            return Promise.reject(e);
        }
        return this._getModel(modelId);
    }

    /**
     *
     * @param {Type.Model} model
     * @throws {ModelNotRegisteredStorageEngineError}
     * @throws {ModelNotFoundStorageEngineError}
     */
    async delete(model) {
        if (!Object.keys(this.models).includes(model.constructor.name))
            throw new ModelNotRegisteredStorageEngineError(model, this);

        const currentModel = await this.get(model.id);

        await this._deleteModel(currentModel.id);

        const currentIndex = this._getIndex(currentModel.constructor);

        await this._putIndex(currentModel.constructor, _.omit(currentIndex, [currentModel.id]));

        const currentSearchIndex = this._getSearchIndex(currentModel.constructor);

        await this._putSearchIndex(currentModel.constructor, _.omit(currentSearchIndex, [currentModel.id]));
    }

    /**
     * Get the model constructor from a model id
     * @param {string} modelId
     * @return {Model.constructor}
     */
    getModelConstructorFromId(modelId) {
        const modelName = modelId.split('/')[0];
        const constructor = this.models[modelName];

        if (!constructor) throw new ModelNotRegisteredStorageEngineError(modelName, this);

        return constructor;
    }

    /**
     * Get model classes that are directly linked to the given model in either direction
     * @param {Type.Model.constructor} model
     * @return {Record<string, Record<string, Type.Model.constructor>>}
     */
    getLinksFor(model) {
        return Object.fromEntries(
            Object.entries(this.getAllModelLinks())
                .filter(([modelName, links]) =>
                    model.name === modelName ||
                    Object.values(links).some((link) => link.name === model.name),
                ),
        );
    }

    /**
     * Get all model links
     * @return {Record<string, Record<string, Type.Model.constructor>>}
     */
    getAllModelLinks() {
        return Object.entries(this.models)
            .map(([registeredModelName, registeredModelClass]) =>
                Object.entries(registeredModelClass)
                    .map(([propertyName, propertyType]) => [
                        registeredModelName,
                        propertyName,
                        typeof propertyType === 'function' &&
                            !/^class/.test(Function.prototype.toString.call(propertyType)) &&
                            !Type.Model.isModel(propertyType) ?
                                propertyType() : propertyType,
                    ])
                    .filter(([_m, _p, type]) => Type.Model.isModel(type))
                    .map(([containingModel, propertyName, propertyType]) => ({
                        containingModel,
                        propertyName,
                        propertyType,
                    })),
            )
            .flat()
            .reduce((accumulator, {containingModel, propertyName, propertyType}) => ({
                ...accumulator,
                [containingModel]: {
                    ...accumulator[containingModel] || {},
                    [propertyName]: propertyType,
                },
            }), {});
    }

    /**
     * Update a model
     * @param {Model} _model
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    _putModel(_model) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('_putModel', this));
    }

    /**
     * Get a model
     * @param {string} _id
     * @throws MethodNotImplementedStorageEngineError
     * @throws ModelNotFoundStorageEngineError
     * @return Promise<Model>
     */
    _getModel(_id) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('_getModel', this));
    }

    /**
     * Delete a model
     * @param {string} _id
     * @throws MethodNotImplementedStorageEngineError
     * @throws ModelNotFoundStorageEngineError
     * @return Promise<void>
     */
    _deleteModel(_id) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('_deleteModel', this));
    }

    /**
     * Get a model's index data
     * @param {Model.constructor} _modelConstructor
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    _getIndex(_modelConstructor) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('_getIndex', this));
    }

    /**
     * Put a model's index data
     * @param {Model.constructor} _modelConstructor
     * @param {object} _data
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    _putIndex(_modelConstructor, _data) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('_putIndex', this));
    }

    /**
     * Get a model's raw search index data
     * @param {Model.constructor} _modelConstructor
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    _getSearchIndex(_modelConstructor) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('_getSearchIndex', this));
    }

    /**
     * Get a model's raw search index data
     * @param {Model.constructor} _modelConstructor
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    _getSearchIndexCompiled(_modelConstructor) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('_getSearchIndexCompiled', this));
    }

    /**
     * Put a model's raw and compiled search index data
     * @param {Model.constructor} _modelConstructor
     * @param {object} _data
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    _putSearchIndex(_modelConstructor, _data) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('_putSearchIndex', this));
    }
}


/**
 * Decide if two models indexable fields have changed
 * @param {Type.Model} currentModel
 * @param {Type.Model} modelToProcess
 * @return {boolean}
 * @private
 */
function indexedFieldsHaveChanged(currentModel, modelToProcess) {
    return !currentModel || Boolean(
        modelToProcess.constructor.indexedProperties()
            .filter(field => JSON.stringify(_.get(currentModel, field)) !== JSON.stringify(_.get(modelToProcess, field)))
            .length,
    );
}

/**
 * Decide if two models searchable fields have changed
 * @param {Type.Model} currentModel
 * @param {Type.Model} modelToProcess
 * @return {boolean}
 * @private
 */
function searchableFieldsHaveChanged(currentModel, modelToProcess) {
    return !currentModel || Boolean(
        modelToProcess.constructor.searchProperties()
            .filter(field => JSON.stringify(_.get(currentModel, field)) !== JSON.stringify(_.get(modelToProcess, field)))
            .length,
    );
}

/**
 * @class StorageEngineError
 * @extends Error
 */
export class StorageEngineError extends Error {
}

/**
 * @class ModelNotRegisteredStorageEngineError
 * @extends StorageEngineError
 */
export class ModelNotRegisteredStorageEngineError extends StorageEngineError {
    /**
     * @param {Type.Model} model
     * @param {StorageEngine} storageEngine
     */
    constructor(model, storageEngine) {
        const modelName = typeof model === 'string' ? model : model.constructor.name;
        super(`The model ${modelName} is not registered in the storage engine ${storageEngine.constructor.name}`);
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
