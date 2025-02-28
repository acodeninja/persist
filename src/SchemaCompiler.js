import Type from './type/index.js';
import ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

/**
 * A class responsible for compiling raw schema definitions into a format that can be validated using the AJV (Another JSON Validator) library.
 */
class SchemaCompiler {
    /**
     * Compiles a raw schema into a validation-ready schema, and returns a class that extends `CompiledSchema`.
     *
     * This method converts a given schema into a JSON schema-like format, setting up properties, types, formats, and validation rules.
     * It uses AJV for the validation process and integrates with model types and their specific validation rules.
     *
     * @param {Object|Model} rawSchema - The raw schema or model definition to be compiled.
     * @returns {CompiledSchema} - A class that extends `CompiledSchema`, with the compiled schema and validator attached.
     *
     * @example
     * const schemaClass = SchemaCompiler.compile(MyModelSchema);
     * const isValid = schemaClass.validate(data); // Throws ValidationError if data is invalid.
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
            schema.properties.id = {type: 'string'};
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

                if (property?._items?._format) {
                    schema.properties[name].items.format = property?._items._format;
                }

                const prop = typeof property?._items === 'function' &&
                !/^class/.test(Function.prototype.toString.call(property?._items)) ?
                    property?._items() : property?._items;

                if (Type.Model.isModel(prop)) {
                    schema.properties[name].items = {
                        type: 'object',
                        additionalProperties: false,
                        required: ['id'],
                        properties: {
                            id: {
                                type: 'string',
                                pattern: `^${prop.toString()}/[A-Z0-9]+$`,
                            },
                        },
                    };
                }
            }
        }

        class Schema extends CompiledSchema {
            /**
             * The compiled schema definition.
             * @type {Object}
             * @static
             * @private
             */
            static _schema = schema;

            /**
             * The AJV validator function compiled from the schema.
             * @type {Function}
             * @static
             * @private
             */
            static _validator = validation.compile(schema);
        }

        return Schema;
    }
}


/**
 * Represents a compiled schema used for validating data models.
 * This class provides a mechanism to validate data using a precompiled schema and a validator function.
 */
export class CompiledSchema {
    /**
     * The schema definition for validation, typically a precompiled JSON schema or similar.
     * @type {?Object}
     * @static
     * @private
     */
    static _schema = null;

    /**
     * The validator function used to validate data against the schema.
     * @type {?Function}
     * @static
     * @private
     */
    static _validator = null;

    /**
     * Validates the given data against the compiled schema.
     *
     * If the data is an instance of a model, it will be converted to a plain object via `toData()` before validation.
     *
     * @param {Object|Model} data - The data or model instance to be validated.
     * @returns {boolean} - Returns `true` if the data is valid according to the schema.
     * @throws {ValidationError} - Throws a `ValidationError` if the data is invalid.
     */
    static validate(data) {
        let inputData = Object.assign({}, data);

        if (Type.Model.isModel(data)) {
            inputData = data.toData();
        }

        const valid = this._validator?.(inputData);

        if (valid) return valid;

        throw new ValidationError(inputData, this._validator.errors);
    }
}

/**
 * Represents a validation error that occurs when a model or data fails validation.
 * Extends the built-in JavaScript `Error` class.
 */
export class ValidationError extends Error {
    /**
     * Creates an instance of `ValidationError`.
     *
     * @param {Object} data - The data that failed validation.
     * @param {Array<Object>} errors - A list of validation errors, each typically containing details about what failed.
     */
    constructor(data, errors) {
        super('Validation failed');
        /**
         * An array of validation errors, containing details about each failed validation.
         * @type {Array<Object>}
         */
        this.errors = errors;
        /**
         * The data that caused the validation error.
         * @type {Object}
         */
        this.data = data;
    }
}

export default SchemaCompiler;
