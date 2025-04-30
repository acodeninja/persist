import {
    CreateTransactionalStorageEngine,
    DeleteHasUnintendedConsequencesStorageEngineError,
} from './engine/storage/StorageEngine.js';
import FindIndex from './data/FindIndex.js';
import Model from './data/Model.js';
import SearchIndex from './data/SearchIndex.js';
import _ from 'lodash';

/**
 * @class State
 */
class State {
    /**
     * @private
     * @property {StorageEngine}
     */
    #storage;

    constructor(storage) {
        this.modelCache = new Map();
        this.indexCache = new Map();
        this.searchIndexCache = new Map();
        this.#storage = storage;
    }

    /**
     * Get a given index
     * @param {Model.constructor} modelConstructor
     * @return {Object}
     */
    async getIndex(modelConstructor) {
        const modelConstructorName = modelConstructor.name;

        if (!this.indexCache.has(modelConstructorName)) {
            this.indexCache.set(modelConstructorName, {
                changed: false,
                index: await this.#storage.getIndex(modelConstructor),
            });
        }

        return this.indexCache.get(modelConstructorName)?.index;
    }

    /**
     * Get a Map of indexes that have been tainted
     * @return {Map<String, Object>}
     */
    getTaintedIndexes() {
        return new Map(
            this.indexCache
                .entries()
                .filter(([_name, cache]) => cache.changed)
                .map(([name, {index}]) => [name, index]),
        );
    }

    /**
     * Update a given index
     * @param {string} modelConstructorName
     * @return {Object}
     */
    updateIndex(modelConstructorName, index) {
        this.indexCache.set(modelConstructorName, {index, changed: true});
    }

    /**
     * Get a given search index
     * @param {Model.constructor} modelConstructor
     * @return {Object}
     */
    async getSearchIndex(modelConstructor) {
        const modelConstructorName = modelConstructor.name;

        if (!this.searchIndexCache.has(modelConstructorName)) {
            this.searchIndexCache.set(modelConstructorName, {
                changed: false,
                index: await this.#storage.getSearchIndex(modelConstructor),
            });
        }

        return this.searchIndexCache.get(modelConstructorName)?.index;
    }

    /**
     * Get a Map of search indexes that have been tainted
     * @return {Map<String, Object>}
     */
    getTaintedSearchIndexes() {
        return new Map(
            this.searchIndexCache
                .entries()
                .filter(([_name, cache]) => cache.changed)
                .map(([name, {index}]) => [name, index]),
        );
    }

    /**
     * Update a given search index
     * @param {string} modelConstructorName
     * @return {Object}
     */
    updateSearchIndex(modelConstructorName, index) {
        this.searchIndexCache.set(modelConstructorName, {index, changed: true});
    }
}

/**
 * @class Connection
 */
export default class Connection {
    /**
     * @private
     * @property {StorageEngine}
     */
    #storage;

    /**
     * @private
     * @property {Record<String, Model.constructor>}
     */
    #models;

    /**
     * Create a new connection
     * @param {StorageEngine} storage
     * @param {Array<Model.constructor>} models
     */
    constructor(storage, models) {
        this.#storage = storage;
        this.#models = resolveModels(Object.fromEntries((models ?? []).map(model => [model.name, model])));

        if (!this.#storage) throw new MissingArgumentsConnectionError('No storage engine provided');
    }

    /**
     * Get a model by its id
     * @param {String} modelId
     * @throws {ModelNotRegisteredConnectionError}
     * @return {Promise<Model>}
     */
    async get(modelId) {
        const modelConstructor = this.#getModelConstructorFromId(modelId);

        const data = await this.#storage.getModel(modelId);

        return modelConstructor.fromData(data);
    }

    /**
     * Accepts a dry model, for example:
     *
     * - an object with only an id property
     * - a model missing linked model fields
     * - a model missing non-indexed properties
     *
     * and fetches all data for a model.
     * @param {Object} dryModel
     * @param {Map?} modelCache
     * @return {Promise<Model>}
     */
    async hydrate(dryModel, modelCache = new Map()) {
        /**
         * Recursively hydrates a single model and its nested properties.
         *
         * @param {Object|Model} modelToProcess - The model instance to hydrate.
         * @returns {Promise<Model>} The hydrated model instance.
         */
        const hydrateModel = async (modelToProcess) => {
            modelCache.set(modelToProcess.id, modelToProcess);

            for (const [name, property] of Object.entries(modelToProcess)) {
                if (Model.isDryModel(property)) {
                    // skipcq: JS-0129
                    modelToProcess[name] = await hydrateSubModel(property);
                } else if (Array.isArray(property) && Model.isDryModel(property[0])) {
                    // skipcq: JS-0129
                    modelToProcess[name] = await hydrateModelList(property);
                }
            }

            modelCache.set(modelToProcess.id, modelToProcess);

            return modelToProcess;
        };

        /**
         * Hydrates a nested sub-model if it hasn't already been hydrated.
         *
         * @param {Object} property - The sub-model with a known ID but incomplete data.
         * @returns {Promise<Model>} The fully hydrated sub-model.
         */
        const hydrateSubModel = async (property) => {
            if (modelCache.has(property.id)) return modelCache.get(property.id);

            const subModel = await this.get(property.id);

            const hydratedSubModel = await hydrateModel(subModel);
            modelCache.set(property.id, hydratedSubModel);
            return hydratedSubModel;
        };

        /**
         * Hydrates a list of related sub-models.
         *
         * @param {Array<Object>} property - Array of dry sub-models.
         * @returns {Promise<Array<Model>>} Array of hydrated sub-models.
         */
        const hydrateModelList = async (property) => {
            const newModelList = await Promise.all(property.map(subModel => {
                if (modelCache.has(subModel.id)) return modelCache.get(subModel.id);

                return this.get(subModel.id);
            }));

            return Promise.all(newModelList.map(async subModel => {
                if (modelCache.has(subModel.id)) return modelCache.get(subModel.id);

                const hydratedSubModel = await hydrateModel(subModel);

                modelCache.set(hydratedSubModel.id, hydratedSubModel);

                return hydratedSubModel;
            }));
        };

        return hydrateModel(await this.get(dryModel.id));
    }

    /**
     * Persists a model if it has changed, and updates all related models and their indexes
     * @param {Model} model
     * @return {Promise<void>}
     */
    async put(model) {
        const processedModels = [];
        const modelsToPut = [];
        const modelsToReindex = {};
        const modelsToReindexSearch = {};

        /**
         * @param {Model} modelToProcess
         * @return {Promise<void>}
         */
        const processModel = async (modelToProcess) => {
            if (processedModels.includes(modelToProcess.id))
                return;

            processedModels.push(modelToProcess.id);

            if (!this.#models.has(modelToProcess.constructor.name))
                throw new ModelNotRegisteredConnectionError(modelToProcess, this.#storage);

            modelToProcess.validate();

            const modelToProcessConstructor = this.#getModelConstructorFromId(modelToProcess.id);
            const currentModel = await this.hydrate(modelToProcess).catch(() => null);

            const modelToProcessHasChanged = !_.isEqual(currentModel?.toData() || {}, modelToProcess.toData());

            if (modelToProcessHasChanged) modelsToPut.push(modelToProcess);

            const modelToProcessConstructorName = modelToProcessConstructor.name;

            if (
                Boolean(modelToProcess.constructor.indexedProperties().length) &&
                (!currentModel || !_.isEqual(currentModel.toIndexData(), modelToProcess.toIndexData()))
            ) {
                modelsToReindex[modelToProcessConstructorName] = modelsToReindex[modelToProcessConstructorName] || [];
                modelsToReindex[modelToProcessConstructorName].push(modelToProcess);
            }

            if (
                Boolean(modelToProcess.constructor.searchProperties().length) &&
                (!currentModel || !_.isEqual(currentModel.toSearchData(), modelToProcess.toSearchData()))
            ) {
                modelsToReindexSearch[modelToProcessConstructorName] = modelsToReindexSearch[modelToProcessConstructorName] || [];
                modelsToReindexSearch[modelToProcessConstructorName].push(modelToProcess);
            }

            for (const [_name, property] of Object.entries(modelToProcess)) {
                if (Model.isModel(property)) {
                    await processModel(property);
                } else if (Array.isArray(property) && Model.isModel(property[0])) {
                    await Promise.all(property.map(processModel));
                }
            }
        };

        await processModel(model);

        await Promise.all([
            Promise.all(modelsToPut.map(m => this.#storage.putModel(m.toData()))),
            Promise.all(Object.entries(modelsToReindex).map(async ([constructorName, models]) => {
                const modelConstructor = this.#models.get(constructorName);
                const index = await this.#storage.getIndex(modelConstructor);

                await this.#storage.putIndex(modelConstructor, {
                    ...index,
                    ...Object.fromEntries(models.map(m => [m.id, m.toIndexData()])),
                });
            })),
            Promise.all(Object.entries(modelsToReindexSearch).map(async ([constructorName, models]) => {
                const modelConstructor = this.#models.get(constructorName);
                const index = await this.#storage.getSearchIndex(modelConstructor);

                await this.#storage.putSearchIndex(modelConstructor, {
                    ...index,
                    ...Object.fromEntries(models.map(m => [m.id, m.toSearchData()])),
                });
            })),
        ]);
    }

    /**
     * Delete a model and update indexes that reference it
     * @param {Model} subject
     * @param {Array<string>} propagateTo - List of model ids that are expected to be deleted or updated.
     * @throws {ModelNotRegisteredConnectionError}
     * @throws {ModelNotFoundStorageEngineError}
     */
    async delete(subject, propagateTo = []) {
        const state = new State(this.#storage);
        const modelsToCheck = this.#findLinkedModelClasses(subject);
        const modelsToDelete = new Set([subject.id]);
        const modelsToUpdate = new Set();
        const indexesToUpdate = new Set();
        const searchIndexesToUpdate = new Set();

        subject = await this.hydrate(subject, state.modelCache);

        if (!propagateTo.includes(subject.id)) {
            propagateTo.push(subject.id);
        }

        // Populate model cache
        for (const [[modelName, propertyName, type, direction], _modelConstructor] of modelsToCheck) {
            const query = {};

            if (direction === 'up') {
                if (type === 'one') {
                    query[propertyName] = {id: {$is: subject.id}};
                }

                if (type === 'many') {
                    query[propertyName] = {
                        $contains: {
                            id: {$is: subject.id},
                        },
                    };
                }
            }

            const foundModels =
                _.isEqual(query, {}) ?
                    (
                        Array.isArray(subject[propertyName]) ?
                            subject[propertyName] : [subject[propertyName]]
                    ) : new FindIndex(this.#models.get(modelName), await state.getIndex(this.#models.get(modelName))).query(query);

            for (const foundModel of foundModels) {
                if (!state.modelCache.has(foundModel.id)) {
                    state.modelCache.set(foundModel.id, await this.hydrate(foundModel, state.modelCache));
                }
            }

            // for deletes, update models that link to the subject
            if (direction === 'up') {
                if (type === 'one') {
                    for (const foundModel of foundModels) {
                        const cachedModel = state.modelCache.get(foundModel.id);

                        if (foundModel.constructor[propertyName]._required) {
                            modelsToDelete.add(foundModel.id);
                            continue;
                        }

                        cachedModel[propertyName] = undefined;
                        state.modelCache.set(foundModel.id, cachedModel);
                        modelsToUpdate.add(foundModel.id);
                    }
                }

                if (type === 'many') {
                    for (const foundModel of foundModels) {
                        const cachedModel = state.modelCache.get(foundModel.id);

                        cachedModel[propertyName] = cachedModel[propertyName].filter(m => m.id !== subject.id);
                        state.modelCache.set(foundModel.id, cachedModel);
                        modelsToUpdate.add(foundModel.id);
                    }
                }
            }
        }

        const unrequestedDeletions = [...modelsToDelete].filter(id => !propagateTo.includes(id));
        const unrequestedUpdates = [...modelsToUpdate].filter(id => !propagateTo.includes(id));

        if (unrequestedDeletions.length || unrequestedUpdates.length) {
            throw new DeleteHasUnintendedConsequencesStorageEngineError(subject.id, {
                willDelete: unrequestedDeletions.map(id => state.modelCache.get(id)),
                willUpdate: unrequestedUpdates.map(id => state.modelCache.get(id)),
            });
        }

        for (const modelId of [...modelsToDelete, ...modelsToUpdate]) {
            const modelConstructor = this.#getModelConstructorFromId(modelId);

            await state.getIndex(modelConstructor);
            indexesToUpdate.add(modelConstructor.name);

            if (modelConstructor.searchProperties().length) {
                await state.getSearchIndex(modelConstructor);
                searchIndexesToUpdate.add(modelConstructor.name);
            }
        }

        for (const indexName of searchIndexesToUpdate) {
            const index = await state.getSearchIndex(this.#models.get(indexName));

            for (const model of [...modelsToUpdate].filter(i => i.startsWith(indexName))) {
                index[model] = state.modelCache.get(model).toSearchData();
            }

            for (const model of [...modelsToDelete].filter(i => i.startsWith(indexName))) {
                delete index[model];
            }

            state.updateSearchIndex(indexName, index);
        }

        for (const indexName of indexesToUpdate) {
            const index = await state.getIndex(this.#models.get(indexName));

            for (const model of [...modelsToUpdate].filter(i => i.startsWith(indexName))) {
                index[model] = state.modelCache.get(model).toIndexData();
            }

            for (const model of [...modelsToDelete].filter(i => i.startsWith(indexName))) {
                delete index[model];
            }

            state.updateIndex(indexName, index);
        }

        await Promise.all([
            Promise.all([...modelsToUpdate].map(id => this.#storage.putModel(state.modelCache.get(id).toData()))),
            Promise.all([...modelsToDelete].map(id => this.#storage.deleteModel(id))),
            Promise.all(state
                .getTaintedIndexes()
                .entries()
                .map(([modelConstructorName, index]) =>
                    this.#storage.putIndex(this.#models.get(modelConstructorName), index),
                ),
            ),
            Promise.all(state
                .getTaintedSearchIndexes()
                .entries()
                .map(([modelConstructorName, index]) =>
                    this.#storage.putSearchIndex(this.#models.get(modelConstructorName), index),
                ),
            ),
        ]);
    }

    /**
     * Search the given model's search properties for matching results.
     *   Wildcards: character '*' can be placed at any location in a query
     *   Fields: search for a specific field's value with 'field:value'
     *   Boosting: if foo is important try 'foo^10 bar'
     *   Fuzzy: 'foo~1' will match 'boo' but not 'bao', 'foo~2' would match 'bao'
     *   Must include: '+foo bar' must include 'foo' and may include 'bar'
     *   Must not include: '-foo bar' must not include 'foo' and may include 'bar'
     *   Mixed include: '+foo -bar' must include 'foo' must not include 'bar'
     * @param {Model.constructor} modelConstructor
     * @param {string} query
     * @return {Promise<Array<SearchResult>>}
     */
    async search(modelConstructor, query) {
        const searchIndex = await this.#storage.getSearchIndex(modelConstructor)
            .then(index => new SearchIndex(modelConstructor, index));

        return searchIndex.search(query);
    }

    /**
     * Find using a structured query and indexed fields.
     *
     * @param {Model.constructor} modelConstructor
     * @param {Object} query
     * @return {Promise<Array<SearchResult>>}
     */
    async find(modelConstructor, query) {
        const findIndex = await this.#storage.getIndex(modelConstructor)
            .then(index => new FindIndex(modelConstructor, index));

        return findIndex.query(query);
    }

    /**
     * Start a transaction, allowing multiple queries to be queued up and committed in one go.
     * Should an error occur, any committed operations will be reverted.
     * @return {Connection}
     */
    transaction() {
        const operations = [];

        const engine = CreateTransactionalStorageEngine(operations, this.#storage);

        const transaction = new this.constructor(engine, this.#models.values());

        transaction.commit = async () => {
            try {
                for (const [index, operation] of operations.entries()) {
                    try {
                        if (operation.method === 'putModel')
                            operations[index].original = await this.#storage.getModel(operation.args[0].id).catch(() => undefined);

                        if (operation.method === 'deleteModel')
                            operations[index].original = await this.#storage.getModel(operation.args[0]);

                        if (operation.method === 'putIndex')
                            operations[index].original = await this.#storage.getIndex(operation.args[0]);

                        if (operation.method === 'putSearchIndex')
                            operations[index].original = await this.#storage.getSearchIndex(operation.args[0]);

                        await this.#storage[operation.method](...operation.args);

                        operations[index].committed = true;
                    } catch (error) {
                        operations[index].error = error;
                        throw error;
                    }
                }
            } catch (error) {
                for (const operation of operations) {
                    if (operation.committed && operation.original) {
                        if (['putModel', 'deleteModel'].includes(operation.method))
                            await this.#storage.putModel(operation.original);

                        if (operation.method === 'putIndex')
                            await this.#storage.putIndex(operation.args[0], operation.original);

                        if (operation.method === 'putSearchIndex')
                            await this.#storage.putSearchIndex(operation.args[0], operation.original);
                    }
                }

                throw new CommitFailedTransactionError(operations, error);
            }
        };

        return transaction;
    }

    /**
     * Get the model constructor from a model id
     * @param {String} modelId
     * @throws ModelNotRegisteredConnectionError
     * @return Model.constructor
     */
    #getModelConstructorFromId(modelId) {
        const modelName = modelId.split('/')[0];
        const modelConstructor = this.#models.get(modelName);

        if (!modelConstructor) throw new ModelNotRegisteredConnectionError(modelName, this.#storage);

        return modelConstructor;
    }

    /**
     * Finds all model classes that are linked to the specified subject model.
     *
     * @private
     * @param {Object} subject - The subject model instance to find linked model classes for.
     * @param {string} subject.id - The ID of the subject model, used to identify its constructor.
     *
     * @returns {Map<Array<string|'one'|'many'|'up'|'down'>, Function>} A map where:
     *   - Keys are arrays with the format [modelName, propertyName, cardinality, direction]
     *     - modelName: The name of the linked model class
     *     - propertyName: The property name where the link is defined
     *     - cardinality: Either 'one' (one-to-one) or 'many' (one-to-many)
     *     - direction: 'down' for links defined in the subject model pointing to other models
     *                  'up' for links defined in other models pointing to the subject
     *   - Values are the model constructor functions for the linked classes
     *
     * @description
     * This method identifies four types of relationships:
     * 1. One-to-one links from subject to other models ('one', 'down')
     * 2. One-to-many links from subject to other models ('many', 'down')
     * 3. One-to-one links from other models to subject ('one', 'up')
     * 4. One-to-many links from other models to subject ('many', 'up')
     */
    #findLinkedModelClasses(subject) {
        const subjectModelConstructor = this.#getModelConstructorFromId(subject.id);
        const modelsThatLinkToThisSubject = new Map();

        for (const [propertyName, propertyType] of Object.entries(subjectModelConstructor)) {
            // The model is a one to one link
            if (propertyType.prototype instanceof Model) {
                modelsThatLinkToThisSubject.set([propertyType.name, propertyName, 'one', 'down'], propertyType);
            }
            // The model is a one to many link

            if (propertyType._items?.prototype instanceof Model) {
                modelsThatLinkToThisSubject.set([propertyType._items.name, propertyName, 'many', 'down'], propertyType);
            }
        }

        for (const [modelName, modelConstructor] of this.#models) {
            for (const [propertyName, propertyType] of Object.entries(modelConstructor.properties)) {
                // The model is a one to one link
                if (propertyType === subjectModelConstructor || propertyType.prototype instanceof subjectModelConstructor) {
                    modelsThatLinkToThisSubject.set([modelName, propertyName, 'one', 'up'], propertyType);
                }

                // The model is a one to many link
                if (propertyType._items === subjectModelConstructor || propertyType._items?.prototype instanceof subjectModelConstructor) {
                    modelsThatLinkToThisSubject.set([modelName, propertyName, 'many', 'up'], propertyType);
                }
            }
        }

        return modelsThatLinkToThisSubject;
    }
}

/**
 * Resolves model properties that are factory functions to their class values.
 *
 * @private
 * @param {Object<string, Function>} models - An object mapping model names to model constructor functions
 * @returns {Map<string, Function>} A map of model names to model constructors with all factory
 *   function properties class to their bare model instances
 *
 * @description
 * This method processes each property of each model constructor to resolve any factory functions.
 * It skips:
 * - Special properties like 'indexedProperties', 'searchProperties', and '_required'
 * - Properties that are already bare model instances (have a prototype inheriting from Model)
 * - Properties with a defined '_type' (basic types)
 *
 * For all other properties (assumed to be factory functions), it calls the function to get
 * the class value and updates the model constructor.
 */
function resolveModels(models) {
    const resolvedToBareModels = new Map();

    for (const [modelName, modelConstructor] of Object.entries(models)) {
        for (const [propertyName, propertyType] of Object.entries(modelConstructor)) {
            // The property is a builtin
            if ([
                'indexedProperties',
                'searchProperties',
                '_required',
            ].includes(propertyName)) {
                continue;
            }

            // The property is a bare model
            if (propertyType.prototype instanceof Model) {
                continue;
            }

            // The property is a basic type
            if (propertyType._type) {
                continue;
            }

            modelConstructor[propertyName] = propertyType();
        }

        resolvedToBareModels.set(modelName, modelConstructor);
    }

    return resolvedToBareModels;
}

/**
 * Base class for errors that occur during connection operations.
 *
 * @class ConnectionError
 * @extends Error
 */
export class ConnectionError extends Error {
}

/**
 * Thrown when a connection is created with missing arguments.
 *
 * @class MissingArgumentsConnectionError
 * @extends ConnectionError
 */
export class MissingArgumentsConnectionError extends ConnectionError {
}

/**
 * Thrown when a model class is not registered.
 *
 * @class ModelNotRegisteredConnectionError
 * @extends ConnectionError
 */
export class ModelNotRegisteredConnectionError extends ConnectionError {
    /**
     * @param {Model|String} modelConstructor
     * @param {Connection} connection
     */
    constructor(modelConstructor, connection) {
        const modelName = typeof modelConstructor === 'string' ? modelConstructor : modelConstructor.constructor.name;
        super(`The model ${modelName} is not registered in the storage engine ${connection.constructor.name}`);
    }
}

/**
 * Base class for errors that occur during transactions.
 *
 * @class TransactionError
 * @extends {Error}
 */
class TransactionError extends Error {
}

/**
 * Thrown when a transaction fails to commit.
 *
 * Contains the original error and the list of transactions involved.
 *
 * @class CommitFailedTransactionError
 * @extends {TransactionError}
 */
export class CommitFailedTransactionError extends TransactionError {
    /**
     *
     * @param {Array<Operation>} transactions
     * @param {Error} error
     */
    constructor(transactions, error) {
        super('Operation failed to commit.');
        this.transactions = transactions;
        this.error = error;
    }
}
