import Query from '../Query.js';
import Type from '../type/index.js';
import lunr from 'lunr';

/**
 * The `Engine` class provides a base interface for implementing data storage and retrieval engines.
 * It includes methods for handling models, indexes, and search functionality.
 *
 * @class Engine
 */
class Engine {
    static configuration = undefined;
    static _searchCache = undefined;

    /**
     * Retrieves a model by its ID. This method must be implemented by subclasses.
     *
     * @param {string} _id - The ID of the model to retrieve.
     * @throws {NotImplementedError} Throws if the method is not implemented.
     * @returns {Promise<Object>} - Returns a promise resolving to the raw data of the requested model.
     * @abstract
     */
    static getById(_id) {
        return Promise.reject(new NotImplementedError(`${this.name} must implement .getById()`));
    }

    /**
     * Saves a model to the data store. This method must be implemented by subclasses.
     *
     * @param {Model} _data - The model data to save.
     * @throws {NotImplementedError} Throws if the method is not implemented.
     * @returns {Promise<void>}
     * @abstract
     */
    static putModel(_data) {
        return Promise.reject(new NotImplementedError(`${this.name} must implement .putModel()`));
    }

    /**
     * Retrieves the index for a given model. This method must be implemented by subclasses.
     *
     * @param {Model.constructor} _model - The model to retrieve the index for.
     * @throws {NotImplementedError} Throws if the method is not implemented.
     * @returns {Promise<Object>} - Returns a promise resolving to the model index.
     * @abstract
     */
    static getIndex(_model) {
        return Promise.reject(new NotImplementedError(`${this.name} does not implement .getIndex()`));
    }

    /**
     * Saves the index for a given model. This method must be implemented by subclasses.
     *
     * @param {Object} _index - The index data to save.
     * @throws {NotImplementedError} Throws if the method is not implemented.
     * @returns {Promise<void>}
     * @abstract
     */
    static putIndex(_index) {
        return Promise.reject(new NotImplementedError(`${this.name} does not implement .putIndex()`));
    }

    /**
     * Retrieves the compiled search index for a model. This method must be implemented by subclasses.
     *
     * @param {Model.constructor} _model - The model to retrieve the compiled search index for.
     * @throws {NotImplementedError} Throws if the method is not implemented.
     * @returns {Promise<Object>} - Returns a promise resolving to the compiled search index.
     * @abstract
     */
    static getSearchIndexCompiled(_model) {
        return Promise.reject(new NotImplementedError(`${this.name} does not implement .getSearchIndexCompiled()`));
    }

    /**
     * Retrieves the raw search index for a model. This method must be implemented by subclasses.
     *
     * @param {Model.constructor} _model - The model to retrieve the raw search index for.
     * @throws {NotImplementedError} Throws if the method is not implemented.
     * @returns {Promise<Object>} - Returns a promise resolving to the raw search index.
     * @abstract
     */
    static getSearchIndexRaw(_model) {
        return Promise.reject(new NotImplementedError(`${this.name} does not implement .getSearchIndexRaw()`));
    }

    /**
     * Saves the compiled search index for a model. This method must be implemented by subclasses.
     *
     * @param {Model.constructor} _model - The model for which the compiled search index is saved.
     * @param {Object} _compiledIndex - The compiled search index data.
     * @throws {NotImplementedError} Throws if the method is not implemented.
     * @returns {Promise<void>}
     * @abstract
     */
    static putSearchIndexCompiled(_model, _compiledIndex) {
        return Promise.reject(new NotImplementedError(`${this.name} does not implement .putSearchIndexCompiled()`));
    }

    /**
     * Saves the raw search index for a model. This method must be implemented by subclasses.
     *
     * @param {Model.constructor} _model - The model for which the raw search index is saved.
     * @param {Object} _rawIndex - The raw search index data.
     * @throws {NotImplementedError} Throws if the method is not implemented.
     * @returns {Promise<void>}
     * @abstract
     */
    static putSearchIndexRaw(_model, _rawIndex) {
        return Promise.reject(new NotImplementedError(`${this.name} does not implement .putSearchIndexRaw()`));
    }

    /**
     * Performs a search query on a model's index and returns the matching models.
     *
     * @param {Model.constructor} model - The model class.
     * @param {string} query - The search query string.
     * @returns {Promise<Array<Model>>} An array of models matching the search query.
     * @throws {EngineError} Throws if the search index is not available for the model.
     */
    static async search(model, query) {
        this.checkConfiguration();

        const index =
            (this._searchCache && this.configuration?.cache?.search && Date.now() - this._searchCache[0] < this.configuration.cache.search) ?
                this._searchCache[1] :
                await this.getSearchIndexCompiled(model)
                    .then(i => {
                        this._searchCache = [Date.now(), i];
                        return i;
                    })
                    .catch(error => {
                        throw new EngineError(`The model ${model.toString()} does not have a search index available.`, error);
                    });

        const searchIndex = lunr.Index.load(index);

        const results = searchIndex.search(`*${query}*`);

        const output = [];
        for (const result of results) {
            output.push({
                ...result,
                score: Number(result.score.toFixed(4)),
                model: await this.get(model, result.ref),
            });
        }

        return output;
    }

    /**
     * Finds models that match a query in the model's index.
     *
     * @param {Model.constructor} model - The model class to search.
     * @param {object} query - The query object containing search criteria.
     * @returns {Array<Model>} An array of models matching the query.
     */
    static async find(model, query) {
        this.checkConfiguration();
        const index = await this.getIndex(model);

        return new Query(query).execute(model, index);
    }

    /**
     * Stores a model and its associated index data into the system.
     *
     * @param {Model} model - The model to store.
     * @throws {EngineError} Throws if the model fails to validate or index fails to save.
     */
    static async put(model) {
        this.checkConfiguration();
        const uploadedModels = [];
        const indexUpdates = {};

        const processModel = async (m) => {
            if (!uploadedModels.includes(m.id)) {
                m.validate();

                await this.putModel(m);

                uploadedModels.push(m.id);
                indexUpdates[m.constructor.name] = (indexUpdates[m.constructor.name] ?? []).concat([m]);

                if (m.constructor.searchProperties().length > 0) {
                    const rawSearchIndex = {
                        ...await this.getSearchIndexRaw(m.constructor),
                        [m.id]: m.toSearchData(),
                    };

                    await this.putSearchIndexRaw(m.constructor, rawSearchIndex);

                    const compiledIndex = lunr(function () {
                        this.ref('id');

                        for (const field of m.constructor.searchProperties()) {
                            this.field(field);
                        }

                        Object.values(rawSearchIndex).forEach(function (doc) {
                            this.add(doc);
                        }, this);
                    });

                    await this.putSearchIndexCompiled(m.constructor, compiledIndex);
                }

                for (const [_, property] of Object.entries(m)) {
                    if (Type.Model.isModel(property)) {
                        await processModel(property);
                    }
                    if (Array.isArray(property) && Type.Model.isModel(property[0])) {
                        for (const subModel of property) {
                            await processModel(subModel);
                        }
                    }
                }
            }
        };

        await processModel(model);
        await this.putIndex(indexUpdates);
    }

    /**
     * Retrieves a model by its ID and converts it to its data representation.
     *
     * @param {Model.constructor} model - The model class to retrieve.
     * @param {string} id - The ID of the model to retrieve.
     * @returns {Model} The found model.
     * @throws {NotFoundEngineError} Throws if the model is not found.
     */
    static async get(model, id) {
        this.checkConfiguration();

        try {
            const found = await this.getById(id);
            return model.fromData(found);
        } catch (error) {
            if (error.constructor === NotImplementedError) throw error;
            throw new NotFoundEngineError(`${this.name}.get(${id}) model not found`, error);
        }
    }

    /**
     * Hydrates a model by populating its related properties (e.g., submodels) from stored data.
     *
     * @param {Model} model - The model to hydrate.
     * @returns {Model} The hydrated model.
     */
    static async hydrate(model) {
        this.checkConfiguration();
        const hydratedModels = {};

        const hydrateModel = async (modelToProcess) => {
            hydratedModels[modelToProcess.id] = modelToProcess;

            for (const [name, property] of Object.entries(modelToProcess)) {
                if (Type.Model.isDryModel(property)) {
                    modelToProcess[name] = await hydrateSubModel(property, modelToProcess, name);
                } else if (Array.isArray(property) && Type.Model.isDryModel(property[0])) {
                    modelToProcess[name] = await hydrateModelList(property, modelToProcess, name);
                }
            }

            return modelToProcess;
        };

        const hydrateSubModel = async (property, modelToProcess, name) => {
            if (hydratedModels[property.id]) {
                return hydratedModels[property.id];
            }

            const subModelClass = getSubModelClass(modelToProcess, name);
            const subModel = await this.get(subModelClass, property.id);

            const hydratedSubModel = await hydrateModel(subModel);
            hydratedModels[property.id] = hydratedSubModel;
            return hydratedSubModel;
        };

        const hydrateModelList = async (property, modelToProcess, name) => {
            const subModelClass = getSubModelClass(modelToProcess, name, true);

            const newModelList = await Promise.all(property.map(subModel => {
                if (hydratedModels[subModel.id]) {
                    return hydratedModels[subModel.id];
                }

                return this.get(subModelClass, subModel.id);
            }));

            return Promise.all(newModelList.map(async subModel => {
                if (hydratedModels[subModel.id]) {
                    return hydratedModels[subModel.id];
                }

                const hydratedSubModel = await hydrateModel(subModel);
                hydratedModels[hydratedSubModel.id] = hydratedSubModel;
                return hydratedSubModel;
            }));
        };

        function getSubModelClass(modelToProcess, name, isArray = false) {
            const constructorField = modelToProcess.constructor[name];

            if (constructorField instanceof Function && !constructorField.prototype) {
                return isArray ? constructorField()._items : constructorField();
            }

            return isArray ? constructorField._items : constructorField;
        }

        return hydrateModel(await this.get(model.constructor, model.id));
    }

    /**
     * Configures the engine with specific settings.
     *
     * @param {Object} configuration - The configuration settings for the engine.
     * @returns {Engine} A new engine instance with the applied configuration.
     */
    static configure(configuration) {
        class ConfiguredStore extends this {
            static configuration = configuration;
        }

        Object.defineProperty(ConfiguredStore, 'name', {value: `${this.toString()}`});

        return ConfiguredStore;
    }

    /**
     * Checks if the engine is properly configured.
     *
     * @throws {MissConfiguredError} Throws if the engine is misconfigured.
     * @abstract
     */
    static checkConfiguration() {
        // Implemented in extending Engine class
    }

    /**
     * Returns the name of the engine class.
     *
     * @returns {string} The name of the engine class.
     */
    static toString() {
        return this.name;
    }
}

/**
 * Represents a general error that occurs within the engine.
 * Extends the built-in `Error` class.
 */
export class EngineError extends Error {
    /**
     * The underlying error that caused this engine error, if available.
     * @type {Error|undefined}
     */
    underlyingError;

    /**
     * Creates an instance of `EngineError`.
     *
     * @param {string} message - The error message.
     * @param {Error} [error] - An optional underlying error that caused this error.
     */
    constructor(message, error = undefined) {
        super(message);
        this.underlyingError = error;
    }
}

/**
 * Represents an error that occurs when a requested resource or item is not found in the engine.
 * Extends the `EngineError` class.
 */
export class NotFoundEngineError extends EngineError {
    /**
     * Creates an instance of `NotFoundEngineError`.
     *
     * @param {string} message - The error message.
     * @param {Error} [error] - An optional underlying error that caused this error.
     */
}

/**
 * Represents an error indicating that a certain method or functionality is not implemented in the engine.
 * Extends the `EngineError` class.
 */
export class NotImplementedError extends EngineError {
    /**
     * Creates an instance of `NotImplementedError`.
     *
     * @param {string} message - The error message.
     * @param {Error} [error] - An optional underlying error that caused this error.
     */
}

/**
 * Represents an error indicating that the engine is misconfigured.
 * Extends the `EngineError` class.
 */
export class MissConfiguredError extends EngineError {
    /**
     * The configuration that led to the misconfiguration error.
     * @type {Object}
     */
    configuration;

    /**
     * Creates an instance of `MissConfiguredError`.
     *
     * @param {Object} configuration - The configuration object that caused the misconfiguration.
     */
    constructor(configuration) {
        super('Engine is miss-configured');
        this.configuration = configuration;
    }
}

export default Engine;
