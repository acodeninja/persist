import Query from '../Query.js';
import Type from '../type/index.js';
import lunr from 'lunr';

/**
 * @class Engine
 */
export default class Engine {
    static _configuration = undefined;

    static async getById(_id) {
        throw new NotImplementedError(`${this.name} must implement .getById()`);
    }

    static async putModel(_data) {
        throw new NotImplementedError(`${this.name} must implement .putModel()`);
    }

    static async getIndex(_model) {
        throw new NotImplementedError(`${this.name} does not implement .getIndex()`);
    }

    static async putIndex(_index) {
        throw new NotImplementedError(`${this.name} does not implement .putIndex()`);
    }

    static async getSearchIndexCompiled(_model) {
        throw new NotImplementedError(`${this.name} does not implement .getSearchIndexCompiled()`);
    }

    static async getSearchIndexRaw(_model) {
        throw new NotImplementedError(`${this.name} does not implement .getSearchIndexRaw()`);
    }

    static async putSearchIndexCompiled(_model, _compiledIndex) {
        throw new NotImplementedError(`${this.name} does not implement .putSearchIndexCompiled()`);
    }

    static async putSearchIndexRaw(_model, _rawIndex) {
        throw new NotImplementedError(`${this.name} does not implement .putSearchIndexRaw()`);
    }

    static async search(model, query) {
        this.checkConfiguration();

        const index = await this.getSearchIndexCompiled(model).catch(() => {
            throw new EngineError(`The model ${model.toString()} does not have a search index available.`);
        });

        const searchIndex = lunr.Index.load(index);

        const results = searchIndex.search(`*${query}*`);

        const output = [];
        for (const result of results) {
            output.push({
                ...result,
                model: await this.get(model, result.ref),
            });
        }

        return output;
    }

    static async find(model, query) {
        this.checkConfiguration();
        const index = await this.getIndex(model);

        return new Query(query).execute(model, index);
    }

    static async put(model) {
        this.checkConfiguration();
        const uploadedModels = [];
        const indexUpdates = {};

        const processModel = async (model) => {
            if (uploadedModels.includes(model.id)) return false;
            model.validate();

            await this.putModel(model);

            uploadedModels.push(model.id);
            indexUpdates[model.constructor.name] = (indexUpdates[model.constructor.name] ?? []).concat([model]);

            if (model.constructor.searchProperties().length > 0) {
                const rawSearchIndex = {
                    ...await this.getSearchIndexRaw(model.constructor),
                    [model.id]: model.toSearchData(),
                };

                await this.putSearchIndexRaw(model.constructor, rawSearchIndex);

                const compiledIndex = lunr(function () {
                    this.ref('id');

                    for (const field of model.constructor.searchProperties()) {
                        this.field(field);
                    }

                    Object.values(rawSearchIndex).forEach(function (doc) {
                        this.add(doc);
                    }, this);
                });

                await this.putSearchIndexCompiled(model.constructor, compiledIndex);
            }

            for (const [_, property] of Object.entries(model)) {
                if (Type.Model.isModel(property)) {
                    await processModel(property);
                }
                if (Array.isArray(property) && Type.Model.isModel(property[0])) {
                    for (const subModel of property) {
                        await processModel(subModel);
                    }
                }
            }
        };

        await processModel(model);
        await this.putIndex(indexUpdates);
    }

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

            const newModelList = await Promise.all(property.map(async subModel => {
                if (hydratedModels[subModel.id]) {
                    return hydratedModels[subModel.id];
                }

                return await this.get(subModelClass, subModel.id);
            }));

            return await Promise.all(newModelList.map(async subModel => {
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

        return await hydrateModel(await this.get(model.constructor, model.id));
    }

    static configure(configuration) {
        class ConfiguredStore extends this {
            static _configuration = configuration;
        }

        Object.defineProperty(ConfiguredStore, 'name', {value: `${this.toString()}`});

        return ConfiguredStore;
    }

    static checkConfiguration() {

    }

    static toString() {
        return this.name;
    }
};

export class EngineError extends Error {
    underlyingError;
    constructor(message, error = undefined) {
        super(message);
        this.underlyingError = error;
    }
}

export class NotFoundEngineError extends EngineError {
}

export class NotImplementedError extends EngineError {
}

export class MissConfiguredError extends EngineError {
    configuration;

    constructor(configuration) {
        super('Engine is miss-configured');
        this.configuration = configuration;
    }
}
