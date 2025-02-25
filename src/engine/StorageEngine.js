import Type from '../type/index.js';

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
        const modelsToReindex = [];

        /**
         * @param {Type.Model} modelToProcess
         * @return {Promise<void>}
         */
        const processModel = async (modelToProcess) => {
            if (!Object.keys(this.models).includes(modelToProcess.constructor.name)) throw new ModelNotRegisteredStorageEngineError(modelToProcess, this);

            modelToProcess.validate();
            const currentModel = await this.get(modelToProcess.id).catch(() => null);

            const modelToProcessHasChanged = (JSON.stringify(currentModel?.toData() || {}) !== JSON.stringify(modelToProcess.toData()));

            if (modelToProcessHasChanged) modelsToPut.push(modelToProcess);

            if (
                modelToProcess.constructor.indexedProperties().length &&
                (
                    !currentModel ||
                    Object.keys(currentModel)
                        .filter(field => JSON.stringify(currentModel[field]) !== JSON.stringify(modelToProcess[field]))
                        .filter(field => modelToProcess.constructor.indexedProperties().includes(field))
                        .length
                )
            ) {
                modelsToReindex.push(modelToProcess);
            }

            for (const [field, value] of Object.entries(modelToProcess)) {
                if (Type.Model.isModel(value)) {
                    await processModel(modelToProcess[field]);
                }
            }

            processedModels.push(modelToProcess.id);
        };

        await processModel(model);

        await Promise.all(modelsToPut.map(m => this._putModel(m.toData())));
        await Promise.all(modelsToReindex.map(async m => {
            const index = await this._getIndex(this.getModelConstructorFromId(m.id));

            await this._putIndex(m.constructor, {
                ...index || {},
                [m.id]: m.toIndexData(),
            });
        }));
    }

    /**
     * Get a model by its id
     * @param {string} modelId
     * @return {Promise<void>}
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
                        typeof propertyType === 'function' && !Type.Model.isModel(propertyType) ? propertyType() : propertyType,
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
     * @return Promise<void>
     */
    _getModel(_id) {
        return Promise.reject(new MethodNotImplementedStorageEngineError('_getModel', this));
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
