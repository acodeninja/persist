import Type from '../type/index.js';

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

    static async putIndex(_index) {
        throw new NotImplementedError(`${this.name} does not implement .putIndex()`);
    }

    static async findByValue(_model, _parameters) {
        throw new NotImplementedError(`${this.name} does not implement .findByValue()`);
    }

    static async find(model, parameters) {
        const response = await this.findByValue(model, parameters);

        return response.map(m => model.fromData(m));
    }

    static async put(model) {
        const uploadedModels = [];
        const indexUpdates = {};

        const processModel = async (model) => {
            if (uploadedModels.includes(model.id)) return false;
            model.validate();

            uploadedModels.push(model.id);

            await this.putModel(model);
            indexUpdates[model.constructor.name] = (indexUpdates[model.constructor.name] ?? []).concat([model]);

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
        const found = await this.getById(id);

        try {
            return model.fromData(found);
        } catch (_error) {
            throw new NotFoundEngineError(`${this.name}.get(${id}) model not found`);
        }
    }

    static async hydrate(model) {
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
        }

        const hydrateSubModel = async (property, modelToProcess, name) => {
            if (hydratedModels[property.id]) {
                return hydratedModels[property.id];
            }

            const subModelClass = getSubModelClass(modelToProcess, name);
            const subModel = await this.get(subModelClass, property.id);

            const hydratedSubModel = await hydrateModel(subModel);
            hydratedModels[property.id] = hydratedSubModel;
            return hydratedSubModel;
        }

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
        }

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

        Object.defineProperty(ConfiguredStore, 'name', {value: `${this.toString()}`})

        return ConfiguredStore;
    }

    static toString() {
        return this.name;
    }
};

export class EngineError extends Error {
}

export class NotFoundEngineError extends EngineError {
}

export class NotImplementedError extends EngineError {
}