import {CircularManyModel, CircularModel, LinkedManyModel, LinkedModel, MainModel} from './Models.js';
import lunr from 'lunr';

/**
 * Class representing a collection of models with methods to manipulate and retrieve model data.
 *
 * @class Models
 */
export class Models {
    /**
     * Creates an instance of Models.
     *
     * @constructor
     */
    constructor() {
        /**
         * @property {Object} models - A dictionary of models indexed by their ID.
         */
        this.models = {};
    }

    /**
     * Adds a model to the collection.
     *
     * @param {Object} model - The model instance to add. Must have an `id` property.
     */
    addModel(model) {
        this.models[model.id] = model;
    }

    /**
     * Retrieves an index of models, optionally filtered by a specific model type and including additional index data.
     *
     * @param {Object} [model] - The model class to filter the index by (optional).
     * @param {Object} [additionalIndexData={}] - Additional index data to include in the result.
     * @returns {Object} An index of models, with model IDs as keys and index data as values.
     */
    getIndex(model = undefined, additionalIndexData = {}) {
        if (model) {
            return Object.fromEntries(
                Object.entries(additionalIndexData)
                    .concat(
                        Object.entries(this.models)
                            .filter(([id, _]) => id.startsWith(`${model.name}/`))
                            .map(([id, m]) => [id, m.toIndexData()])
                            .concat(Object.entries(additionalIndexData)),
                    ),
            );
        }

        return Object.fromEntries(
            Object.entries(additionalIndexData)
                .concat(
                    Object.entries(this.models)
                        .map(([id, m]) => [id, m.toIndexData()])
                        .concat(Object.entries(additionalIndexData)),
                ),
        );
    }

    /**
     * Retrieves the raw search index for models filtered by a specific model type and additional search data.
     *
     * @param {Object} model - The model class to filter the index by.
     * @param {Object} [additionalSearchData={}] - Additional search data to include in the result.
     * @returns {Object} The raw search index with model IDs as keys and search data as values.
     */
    getRawSearchIndex(model, additionalSearchData = {}) {
        return Object.fromEntries(
            Object.entries(additionalSearchData)
                .concat(
                    Object.entries(this.models)
                        .filter(([id, _]) => id.startsWith(`${model.name}/`))
                        .map(([id, m]) => [id, m.toSearchData()]),
                ),
        );
    }

    /**
     * Generates a Lunr search index for a specific model class, including additional search data.
     *
     * @param {Object} model - The model class to generate the search index for.
     * @param {Object} [additionalSearchData={}] - Additional search data to include in the index.
     * @returns {lunr.Index} A compiled Lunr search index.
     */
    getSearchIndex(model, additionalSearchData = {}) {
        const rawSearchIndex = this.getRawSearchIndex(model);
        return lunr(function () {
            this.ref('id');

            for (const field of model.searchProperties()) {
                this.field(field);
            }

            Object.values({
                ...additionalSearchData,
                ...rawSearchIndex,
            }).forEach(function (doc) {
                this.add(doc);
            }, this);
        });
    }

    /**
     * Extracts the numeric portion of a model's ID.
     *
     * @param {Object} modelInstance - The model instance whose ID to extract.
     * @returns {number} The numeric ID.
     */
    static getNumericId(modelInstance) {
        return parseInt(modelInstance.id.replace(`${modelInstance.constructor.name}/`, ''));
    }

    /**
     * Generates the next model ID based on the existing models of the same type.
     *
     * @param {Object} modelInstance - The model instance to generate an ID for.
     * @returns {string} The next available model ID in the form `${ModelName}/<numeric_id>`.
     */
    getNextModelId(modelInstance) {
        const lastId = Object.values(this.models)
            .filter(m => m.id.startsWith(`${modelInstance.constructor.name}/`))
            .map(m => Models.getNumericId(m))
            .toSorted((a, b) => a - b)
            .pop();

        return `${modelInstance.constructor.name}/${(lastId + 1 || 0).toString(10).padStart(12, '0')}`;
    }

    /**
     * Creates and adds a new instance of `MainModel` with pre-defined properties, optionally overriding the default values.
     *
     * @param {Object} [override={}] - An object containing properties to override the defaults.
     * @returns {MainModel} A new `MainModel` instance with linked, circular, and linkedMany models.
     */
    createFullTestModel(override = {}) {
        const defaults = {
            string: 'test',
            requiredString: 'required test',
            number: 24.3,
            requiredNumber: 12.2,
            boolean: false,
            requiredBoolean: true,
            date: new Date(),
            requiredDate: new Date(),
            emptyArrayOfStrings: [],
            emptyArrayOfNumbers: [],
            emptyArrayOfBooleans: [],
            emptyArrayOfDates: [],
            arrayOfString: ['test'],
            arrayOfNumber: [24.5],
            arrayOfBoolean: [false],
            arrayOfDate: [new Date()],
            requiredArrayOfString: ['test'],
            requiredArrayOfNumber: [24.5],
            requiredArrayOfBoolean: [false],
            requiredArrayOfDate: [new Date()],
        };

        const model = new MainModel({...defaults, ...override});
        model.id = this.getNextModelId(model);
        this.addModel(model);

        const linked = new LinkedModel({string: 'test', boolean: true});
        linked.id = this.getNextModelId(linked);
        model.linked = linked;
        this.addModel(linked);

        const requiredLinked = new LinkedModel({string: 'test'});
        requiredLinked.id = this.getNextModelId(requiredLinked);
        model.requiredLinked = requiredLinked;
        this.addModel(requiredLinked);

        const circular = new CircularModel({linked: model});
        circular.id = this.getNextModelId(circular);
        model.circular = circular;
        this.addModel(circular);

        const circularMany = new CircularManyModel({linked: [model]});
        circularMany.id = this.getNextModelId(circularMany);
        model.circularMany = [circularMany];
        this.addModel(circularMany);

        const linkedMany = new LinkedManyModel({string: 'many'});
        linkedMany.id = this.getNextModelId(linkedMany);
        model.linkedMany = [linkedMany];
        this.addModel(linkedMany);

        return model;
    }
}
