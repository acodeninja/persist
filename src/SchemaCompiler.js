import Type from './type/index.js';
import ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

/**
 * @class SchemaCompiler
 */
export default class SchemaCompiler {
    /**
     * @method compile
     * @param {Model|object} rawSchema
     * @return {CompiledSchema}
     */
    static compile(rawSchema) {
        const validation = new ajv({allErrors: true});

        ajvErrors(validation);
        ajvFormats(validation);

        const schema = {
            type: 'object',
            additionalProperties: false,
            properties: {},
            required: [],
        };

        if (Type.Model.isModel(rawSchema)) {
            schema.required.push('id');
            schema.properties['id'] = {type: 'string'};
        }

        for (const [name, type] of Object.entries(rawSchema)) {
            if (['indexedProperties', 'searchProperties'].includes(name)) continue;

            const property = type instanceof Function && !type.prototype ? type() : type;

            if (property?._required || property?._items?._type?._required)
                schema.required.push(name);

            if (Type.Model.isModel(property)) {
                schema.properties[name] = {
                    type: 'object',
                    additionalProperties: false,
                    required: ['id'],
                    properties: {
                        id: {
                            type: 'string',
                            pattern: `^${property.toString()}/[A-Z0-9]+$`,
                        },
                    },
                };
                continue;
            }

            if (property?._schema) {
                schema.properties[name] = property._schema;
                continue;
            }

            schema.properties[name] = {type: property?._type};

            if (property?._format) {
                schema.properties[name].format = property._format;
            }

            if (property?._type === 'array') {
                schema.properties[name].items = {type: property?._items._type};

                if (Type.Model.isModel(property?._items)) {
                    schema.properties[name].items = {
                        type: 'object',
                        additionalProperties: false,
                        required: ['id'],
                        properties: {
                            id: {
                                type: 'string',
                                pattern: `^${property?._items.toString()}/[A-Z0-9]+$`,
                            },
                        },
                    };
                }
            }
        }

        class Schema extends CompiledSchema {
            static _schema = schema;
            static _validator = validation.compile(schema);
        }

        return Schema;
    }
}

/**
 * @class CompiledSchema
 * @property {object} _schema
 * @property {Function} _validator
 */
export class CompiledSchema {
    static _schema = null;
    static _validator = null;

    /**
     * @method validate
     * @param data
     * @return {boolean}
     * @throws {ValidationError}
     */
    static validate(data) {
        let inputData = data;
        if (Type.Model.isModel(data)) {
            inputData = data.toData();
        }
        const valid = this._validator?.(inputData);
        if (valid) return valid;

        throw new ValidationError(inputData, this._validator.errors);
    }
}

/**
 * @class ValidationError
 * @extends Error
 * @property {object[]} errors
 * @property {object} data
 */
export class ValidationError extends Error {
    constructor(data, errors) {
        super('Validation failed');
        this.errors = errors;
        this.data = data;
    }
}
