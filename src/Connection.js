import {
    CreateTransactionalStorageEngine,
    DeleteHasUnintendedConsequencesStorageEngineError,
} from './engine/storage/StorageEngine.js';
import FindIndex from './data/FindIndex.js';
import Model from './data/Model.js';
import SearchIndex from './data/SearchIndex.js';
import _ from 'lodash';

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
        this.#models = Object.fromEntries((models ?? []).map(model => [model.name, model]));

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
     * @return {Promise<Model>}
     */
    async hydrate(dryModel) {
        const hydratedModels = {};

        /**
         * Recursively hydrates a single model and its nested properties.
         *
         * @param {Object|Model} modelToProcess - The model instance to hydrate.
         * @returns {Promise<Model>} The hydrated model instance.
         */
        const hydrateModel = async (modelToProcess) => {
            hydratedModels[modelToProcess.id] = modelToProcess;

            for (const [name, property] of Object.entries(modelToProcess)) {
                if (Model.isDryModel(property)) {
                    // skipcq: JS-0129
                    modelToProcess[name] = await hydrateSubModel(property);
                } else if (Array.isArray(property) && Model.isDryModel(property[0])) {
                    // skipcq: JS-0129
                    modelToProcess[name] = await hydrateModelList(property);
                }
            }

            return modelToProcess;
        };

        /**
         * Hydrates a nested sub-model if it hasn't already been hydrated.
         *
         * @param {Object} property - The sub-model with a known ID but incomplete data.
         * @returns {Promise<Model>} The fully hydrated sub-model.
         */
        const hydrateSubModel = async (property) => {
            if (hydratedModels[property.id]) {
                return hydratedModels[property.id];
            }

            const subModel = await this.get(property.id);

            const hydratedSubModel = await hydrateModel(subModel);
            hydratedModels[property.id] = hydratedSubModel;
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
                if (hydratedModels[subModel.id]) {
                    return hydratedModels[subModel.id];
                }

                return this.get(subModel.id);
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

            if (!Object.keys(this.#models).includes(modelToProcess.constructor.name))
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
                const modelConstructor = this.#models[constructorName];
                const index = await this.#storage.getIndex(modelConstructor);

                await this.#storage.putIndex(modelConstructor, {
                    ...index,
                    ...Object.fromEntries(models.map(m => [m.id, m.toIndexData()])),
                });
            })),
            Promise.all(Object.entries(modelsToReindexSearch).map(async ([constructorName, models]) => {
                const modelConstructor = this.#models[constructorName];
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
     * @param {Model} model
     * @param {Array<string>} propagateTo - List of model ids that are expected to be deleted
     * @throws {ModelNotRegisteredConnectionError}
     * @throws {ModelNotFoundStorageEngineError}
     */
    async delete(model, propagateTo = []) {
        const processedModels = [];
        const modelsToDelete = [];
        const modelsToPut = [];
        const indexCache = {};
        const indexActions = {};
        const searchIndexCache = {};
        const searchIndexActions = {};
        const modelCache = {};

        propagateTo.push(model.id);

        /**
         * Process a model for deletion
         * @param {Model} modelToProcess
         * @return {Promise<void>}
         */
        const processModel = async (modelToProcess) => {
            if (processedModels.includes(modelToProcess.id)) return;

            processedModels.push(modelToProcess.id);

            const modelsToProcess = [];
            if (!Object.keys(this.#models).includes(modelToProcess.constructor.name))
                throw new ModelNotRegisteredConnectionError(modelToProcess, this.#storage);

            const currentModel = modelCache[modelToProcess.id] ?? await this.get(modelToProcess.id);
            modelCache[currentModel.id] = currentModel;

            if (!modelsToDelete.includes(currentModel.id)) modelsToDelete.push(currentModel.id);

            const modelToProcessConstructor = this.#getModelConstructorFromId(modelToProcess.id);

            indexActions[modelToProcessConstructor.name] = indexActions[modelToProcessConstructor.name] ?? [];
            searchIndexActions[modelToProcessConstructor.name] = searchIndexActions[modelToProcessConstructor.name] ?? [];

            indexActions[modelToProcessConstructor.name].push(['delete', modelToProcess]);

            if (currentModel.constructor.searchProperties().length) {
                searchIndexActions[modelToProcessConstructor.name].push(['delete', modelToProcess]);
            }

            const linkedModels = await this.#getInstancesLinkedTo(modelToProcess, indexCache);
            const links = this.#getLinksFor(modelToProcess.constructor);
            Object.values(Object.fromEntries(await Promise.all(
                Object.entries(linkedModels)
                    .map(async ([modelConstructor, updatableModels]) => [
                        modelConstructor,
                        await Promise.all(updatableModels.map(async m => {
                            const upToDateModel = modelCache[m.id] ?? await this.get(m.id);
                            modelCache[upToDateModel.id] = upToDateModel;
                            return upToDateModel;
                        })),
                    ]),
            ))).flat(1)
                .forEach(m =>
                    Object.entries(links[m.constructor.name])
                        .forEach(([linkName, modelConstructor]) => {
                            if ((
                                typeof modelConstructor[linkName] === 'function' &&
                                !/^class/.test(Function.prototype.toString.call(modelConstructor[linkName])) &&
                                !Model.isModel(modelConstructor[linkName]) ?
                                    modelConstructor[linkName]() : modelConstructor
                            )._required) {
                                if (!modelsToDelete.includes(m.id)) modelsToDelete.push(m.id);
                                modelsToProcess.push(m);
                            } else {
                                const foundModelConstructor = this.#getModelConstructorFromId(m.id);
                                m[linkName] = undefined;
                                modelsToPut.push(m);

                                indexActions[foundModelConstructor.name] = indexActions[foundModelConstructor.name] ?? [];
                                indexActions[foundModelConstructor.name].push(['reindex', m]);

                                if (m.constructor.searchProperties().length) {
                                    searchIndexActions[foundModelConstructor.name] = searchIndexActions[foundModelConstructor.name] ?? [];
                                    searchIndexActions[foundModelConstructor.name].push(['reindex', m]);
                                }
                            }
                        }),
                );

            for (const modelToBeProcessed of modelsToProcess) {
                await processModel(modelToBeProcessed);
            }
        };

        await processModel(model);

        const unrequestedDeletions = modelsToDelete.filter(m => !propagateTo.includes(m));

        if (unrequestedDeletions.length) {
            throw new DeleteHasUnintendedConsequencesStorageEngineError(model.id, {
                willDelete: unrequestedDeletions,
            });
        }

        await Promise.all([
            Promise.all(Object.entries(indexActions).map(async ([constructorName, actions]) => {
                const modelConstructor = this.#models[constructorName];
                indexCache[constructorName] = indexCache[constructorName] ?? await this.#storage.getIndex(modelConstructor);

                actions.forEach(([action, actionModel]) => {
                    if (action === 'delete') {
                        indexCache[constructorName] = _.omit(indexCache[constructorName], [actionModel.id]);
                    }
                    if (action === 'reindex') {
                        indexCache[constructorName] = {
                            ...indexCache[constructorName],
                            [actionModel.id]: actionModel.toIndexData(),
                        };
                    }
                });
            })),
            Promise.all(Object.entries(searchIndexActions).map(async ([constructorName, actions]) => {
                const modelConstructor = this.#models[constructorName];
                searchIndexCache[constructorName] = searchIndexCache[constructorName] ?? await this.#storage.getSearchIndex(modelConstructor);

                actions.forEach(([action, actionModel]) => {
                    if (action === 'delete') {
                        searchIndexCache[constructorName] = _.omit(searchIndexCache[constructorName], [actionModel.id]);
                    }
                    if (action === 'reindex') {
                        searchIndexCache[constructorName] = {
                            ...searchIndexCache[constructorName],
                            [actionModel.id]: actionModel.toSearchData(),
                        };
                    }
                });
            })),
        ]);

        await Promise.all([
            Promise.all(modelsToPut.map(m => this.#storage.putModel(m.toData()))),
            Promise.all(modelsToDelete.map(m => this.#storage.deleteModel(m))),
            Promise.all(
                Object.entries(indexCache)
                    .map(([constructorName, index]) => this.#storage.putIndex(this.#models[constructorName], index)),
            ),
            Promise.all(
                Object.entries(searchIndexCache)
                    .map(([constructorName, index]) =>
                        this.#models[constructorName].searchProperties().length > 0 ?
                            this.#storage.putSearchIndex(this.#models[constructorName], index) :
                            Promise.resolve(),
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

        const transaction = new this.constructor(engine, Object.values(this.#models));

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
        const modelConstructor = this.#models[modelName];

        if (!modelConstructor) throw new ModelNotRegisteredConnectionError(modelName, this.#storage);

        return modelConstructor;
    }

    /**
     * Get model classes that are directly linked to the given model in either direction
     * @param {Model.constructor} model
     * @return {Record<string, Record<string, Model.constructor>>}
     */
    #getLinksFor(model) {
        return Object.fromEntries(
            Object.entries(this.#getAllModelLinks())
                .filter(([modelName, links]) =>
                    model.name === modelName ||
                    Object.values(links).some((link) => link.name === model.name),
                ),
        );
    }

    /**
     * Get all model links
     * @return {Record<string, Record<string, Model.constructor>>}
     */
    #getAllModelLinks() {
        return Object.entries(this.#models)
            .map(([registeredModelName, registeredModelClass]) =>
                Object.entries(registeredModelClass)
                    .map(([propertyName, propertyProperty]) => [
                        registeredModelName,
                        propertyName,
                        typeof propertyProperty === 'function' &&
                        !/^class/.test(Function.prototype.toString.call(propertyProperty)) &&
                        !Model.isModel(propertyProperty) ?
                            propertyProperty() : propertyProperty,
                    ])
                    .filter(([_m, _p, type]) => Model.isModel(type))
                    .map(([containingModel, propertyName, propertyProperty]) => ({
                        containingModel,
                        propertyName,
                        propertyProperty,
                    })),
            )
            .flat()
            .reduce((accumulator, {containingModel, propertyName, propertyProperty}) => {
                accumulator[containingModel] = accumulator[containingModel] ?? {};
                accumulator[containingModel][propertyName] = propertyProperty;
                return accumulator;
            }, {});
    }

    /**
     * Get model instance that are directly linked to the given model in either direction
     * @param {Model} model
     * @param {object} cache
     * @return {Record<string, Record<string, Model>>}
     */
    async #getInstancesLinkedTo(model, cache) {
        return Object.fromEntries(
            Object.entries(
                await Promise.all(
                    Object.entries(this.#getLinksFor(model.constructor))
                        .map(([name, _index]) =>
                            cache[name] ? Promise.resolve([name, Object.values(cache[name])]) :
                                this.#storage.getIndex(this.#models[name])
                                    .then(i => {
                                        cache[name] = i;
                                        return [name, Object.values(i)];
                                    }),
                        ),
                ).then(Object.fromEntries),
            ).map(([name, index]) => [
                name,
                index.map(item => Object.fromEntries(
                    Object.entries(item)
                        .filter(([propertyName, property]) => propertyName === 'id' || property?.id === model.id),
                )).filter(item => Object.keys(item).length > 1),
            ]),
        );
    }
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
