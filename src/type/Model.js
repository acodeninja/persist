import SchemaCompiler from '../SchemaCompiler.js';
import StringType from './simple/StringType.js';
import {monotonicFactory} from 'ulid';

const createID = monotonicFactory();

export default class Model {
    static id = StringType.required;
    static _required = false;

    constructor(data = {}) {
        this.id = `${this.constructor.name}/${createID()}`;

        for (const [key, value] of Object.entries(this.constructor)) {
            if (data?.[key] !== undefined) {
                this[key] = data[key];
            }
            if (value?._resolved) {
                Object.defineProperty(this, key, {
                    get: function () {
                        return value.resolve(this);
                    },
                });
            }
        }
    }

    toData() {
        const model = {...this};

        for (const [name, property] of Object.entries(this.constructor)) {
            if (property._resolved) {
                model[name] = property.resolve(this);
            }
        }

        return JSON.parse(JSON.stringify(model, (key, value) => {
            if (key && this.constructor.isModel(value)) {
                return {id: value.id};
            }
            return value;
        }));
    }

    validate() {
        return SchemaCompiler.compile(this.constructor).validate(this);
    }

    toIndexData() {
        const indexData = {id: this.id};

        for (const name of this.constructor.indexedProperties()) {
            indexData[name] = this[name];
        }

        return indexData;
    }

    toSearchData() {
        const indexData = {id: this.id};

        for (const name of this.constructor.searchProperties()) {
            indexData[name] = this[name];
        }

        return indexData;
    }

    static toString() {
        return this['name'];
    }

    static get required() {
        class Required extends this {
            static _required = true;
        }

        Object.defineProperty(Required, 'name', {value: `${this.toString()}`})

        return Required;
    }

    static indexedProperties() {
        return [];
    }

    static searchProperties() {
        return [];
    }

    static fromData(data) {
        const model = new this();

        for (const [name, value] of Object.entries(data)) {
            if (this[name]?._resolved) continue;
            model[name] = value;
        }

        return model;
    }

    static isModel(possibleModel) {
        return (
            possibleModel?.prototype instanceof Model ||
            possibleModel?.constructor?.prototype instanceof Model
        );
    }

    static isDryModel(possibleDryModel) {
        return (
            Object.keys(possibleDryModel).includes('id') &&
            !!possibleDryModel.id.match(/[A-Za-z]+\/[A-Z0-9]+/)
        );
    }
}
