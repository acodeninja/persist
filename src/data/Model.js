import Schema from '../Schema.js';
import StringType from './properties/StringType.js';
import _ from 'lodash';
import {monotonicFactory} from 'ulid';

const createID = monotonicFactory();

/**
 * @class Model
 */
class Model {
    /**
     * Represents the model's ID field, defined as a required string.
     *
     * @type {StringType.required.constructor}
     * @static
     */
    static id = StringType.required;

    /**
     * Tracks whether the model is required in a schema.
     *
     * @type {boolean}
     * @static
     * @private
     */
    static _required = false;

    /**
     * Creates a new instance of the model, initializing properties based on the provided data.
     *
     * @param {Object} [data={}] - The initial data to populate the model instance.
     */
    constructor(data = {}) {
        this.id = `${this.constructor.name}/${createID()}`;

        for (const [key, value] of Object.entries(this.constructor)) {
            if (data?.[key] !== undefined) {
                this[key] = data[key];
            }
            if (value?._resolved) {
                Object.defineProperty(this, key, {
                    get() {
                        return value.resolve(this);
                    },
                });
            }
        }
    }

    /**
     * Serializes the model instance into an object, optionally retaining complex types.
     *
     * @returns {Object} - A serialized representation of the model.
     */
    toData() {
        const model = {...this};

        for (const [name, property] of Object.entries(this.constructor)) {
            if (property._resolved) {
                model[name] = property.resolve(this);
            }
            if (model[name] === undefined && property._default !== undefined) {
                model[name] = property._default;
            }
        }

        return JSON.parse(
            JSON.stringify(model, (key, value) => {
                if (key && this.constructor.isModel(value)) {
                    return {id: value.id};
                }
                return value;
            }),
        );
    }

    /**
     * Validates the current model instance against the defined schema.
     *
     * @returns {boolean} - Returns `true` if validation succeeds.
     * @throws {ValidationError} - Throws this error if validation fails.
     */
    validate() {
        return Schema.compile(this.constructor).validate(this);
    }

    /**
     * Extracts data from the model based on the indexed properties defined in the class.
     * Includes the ID of any linked models.
     * @returns {Object} - A representation of the model's indexed data.
     */
    toIndexData() {
        return this.#extractData(this.constructor.indexedPropertiesResolved());
    }

    /**
     * Extracts data from the model based on the search properties defined in the class.
     *
     * @returns {Object} - A representation of the model's search data.
     */
    toSearchData() {
        return this.#extractData(this.constructor.searchProperties());
    }

    /**
     * Extracts specific data fields from the model based on a set of keys.
     *
     * @param {Array<string>} keys - The keys to extract from the model.
     * @returns {Object} - The extracted data.
     * @private
     */
    #extractData(keys) {
        const output = {id: this.id};

        for (const key of keys) {
            if (_.get(this, key)) {
                _.set(output, key, _.get(this, key));
            }

            if (key.includes('[*]')) {
                const segments = key.split('.');

                const preWildcard = segments.slice(0, segments.indexOf('[*]'));
                const postWildcard = segments.slice(segments.indexOf('[*]') + 1);

                _.set(
                    output,
                    preWildcard,
                    _.get(this, preWildcard, [])
                        .map((e, i) =>
                            _.set(_.get(output, preWildcard, [])[i] ?? {}, postWildcard, _.get(e, postWildcard))),
                );
            }
        }

        return output;
    }

    /**
     * Returns the name of the model as a string.
     *
     * @returns {string} - The name of the model class.
     * @static
     */
    static toString() {
        return this.name;
    }

    /**
     * Returns a new required version of the current model class.
     *
     * @returns {this} - A required model subclass.
     * @static
     */
    static get required() {
        const ModelClass = this;

        /**
         * A subclass of the current model with the `_required` flag set to `true`.
         * Used to indicate that the property is required during validation or schema generation.
         *
         * @class
         * @extends {Model}
         * @private
         */
        class Required extends ModelClass {
            static _required = true;
        }

        Object.defineProperty(Required, 'name', {value: ModelClass.name});

        return Required;
    }

    /**
     * Returns a list of properties that are indexed.
     *
     * - To link to properties of a model use `<name>`
     * - To link to properties of linked models use `<model>.<name>`
     * - To link to properties of many linked models use `<model>.[*].<name>`
     *
     * @returns {Array<string>} - The indexed properties.
     * @abstract
     * @static
     */
    static indexedProperties() {
        return [];
    }

    /**
     * Returns a list of properties that are indexed including links to other models.
     *
     * @returns {Array<string>} - The indexed properties.
     * @abstract
     * @static
     */
    static indexedPropertiesResolved() {
        const ModelClass = this;
        return [
            ...Object.entries(ModelClass.properties)
                .filter(([name, type]) => {
                    if (['indexedProperties', 'searchProperties'].includes(name)) return false;

                    /**
                     * Detect a one-to-one linked model
                     * @param maybeIncludesSingleModel
                     * @return {boolean}
                     */
                    const includesSingleModel = (maybeIncludesSingleModel) => {
                        if (maybeIncludesSingleModel._type === 'array') return false;

                        if (Model.isModel(maybeIncludesSingleModel)) return true;

                        return Boolean(maybeIncludesSingleModel._items?.some?.(i => ModelClass.isModel(i)));
                    };

                    if (includesSingleModel(type)) return true;

                    if (
                        typeof type === 'function' &&
                        // This differentiates between a function and a class.
                        // A class prototype is non-writable.
                        !Object.getOwnPropertyDescriptor(type, 'prototype')
                    ) {
                        if (includesSingleModel(type())) return true;
                    }

                    return false;
                })
                .map(([name, _type]) => `${name}.id`),
            ...Object.entries(ModelClass.properties)
                .filter(([_name, type]) => {
                    return !Model.isModel(type) && (
                        (type._type === 'array' && ModelClass.isModel(type._items))
                        ||
                        (!type._type && typeof type === 'function' && ModelClass.isModel(type()._items))
                    );
                })
                .map(([name, _type]) => `${name}.[*].id`),
            ...ModelClass.indexedProperties(),
            'id',
        ];
    }

    /**
     * Returns a list of properties used for search.
     *
     * @returns {Array<string>} - The search properties.
     * @abstract
     * @static
     */
    static searchProperties() {
        return [];
    }

    /**
     * Creates a model instance from raw data.
     *
     * @param {Object} data - The data to populate the model instance with.
     * @returns {Model} - The populated model instance.
     * @static
     */
    static fromData(data) {
        const ModelClass = this;
        const model = new ModelClass();

        for (const [name, value] of Object.entries(data)) {
            if (ModelClass[name]?._resolved) continue;

            if (ModelClass[name]?.name.endsWith('Date')) {
                model[name] = new Date(value);
                continue;
            }

            if (ModelClass[name]?.name.endsWith('ArrayOf(Date)')) {
                model[name] = data[name].map(d => new Date(d));
                continue;
            }

            model[name] = value;
        }

        return model;
    }

    /**
     * Determines if a given object is a model instance.
     *
     * @param {Object} possibleModel - The object to check.
     * @returns {boolean} - Returns `true` if the object is a model instance.
     * @static
     */
    static isModel(possibleModel) {
        return (
            possibleModel?.prototype instanceof Model ||
            possibleModel?.constructor?.prototype instanceof Model
        );
    }

    /**
     * Determines if a given object is a dry model (a simplified object with an ID).
     *
     * @param {Object} possibleDryModel - The object to check.
     * @returns {boolean} - Returns `true` if the object is a valid dry model.
     * @static
     */
    static isDryModel(possibleDryModel) {
        try {
            return (
                !Model.isModel(possibleDryModel) &&
                Object.keys(possibleDryModel).includes('id') &&
                new RegExp(/[A-Za-z]+\/[A-Z0-9]+/).test(possibleDryModel.id)
            );
        } catch (_error) {
            return false;
        }
    }

    /**
     * Set the name of the Model class
     *
     * Use this when your model might be minified to retain consistent class names.
     *
     * @param {string} name
     * @static
     *
     * @example
     * export default class TestModel extends Model {
     *     static {
     *         TestModel.withName('TestModel');
     *         TestModel.string = Persist.Property.String;
     *     }
     * }
     */
    static withName(name) {
        const ModelClass = this;
        Object.defineProperty(ModelClass, 'name', {value: name});
    }

    /**
     * Discover model properties all the way up the prototype chain.
     *
     * @return {Model}
     */
    static get properties() {
        const ModelClass = this;
        const props = {};
        const chain = [];

        let current = ModelClass;
        while (current !== Function.prototype) {
            chain.push(current);
            current = Object.getPrototypeOf(current);
        }

        for (const item of chain) {
            for (const property of Object.getOwnPropertyNames(item)) {
                if (
                    [
                        '_required',
                        'fromData',
                        'indexedProperties',
                        'indexedPropertiesResolved',
                        'isDryModel',
                        'isModel',
                        'length',
                        'name',
                        'properties',
                        'prototype',
                        'required',
                        'searchProperties',
                        'toString',
                        'withName',
                    ].includes(property)
                ) continue;

                if (Object.keys(props).includes(property)) continue;

                props[property] = item[property];
            }
        }

        return Object.assign(ModelClass, props);
    }
}

export default Model;
