import {monotonicFactory} from 'ulid';

const createID = monotonicFactory();

export default class Model {
    static id = String.required;

    constructor(data = {}) {
        this.id = `${this.constructor.name}/${createID()}`;

        for (const [key, value] of Object.entries(this.constructor)) {
            if (data?.[key] !== undefined) {
                this[key] = data[key];
            }
            if (value._resolved) {
                Object.defineProperty(this, key, {
                    get: function() {
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

    static isModel(possibleModel) {
        return (
            possibleModel?.prototype instanceof Model ||
            possibleModel?.constructor?.prototype instanceof Model
        );
    }
}
