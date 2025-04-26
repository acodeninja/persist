import Model from './data/Model.js';
import ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

/**
 * A class responsible for compiling raw schema definitions into a format that can be validated using the AJV (Another JSON Validator) library.
 */
class Schema {
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
     * const schemaClass = Schema.compile(MyModelSchema);
     * const isValid = schemaClass.validate(data); // Throws ValidationError if data is invalid.
     */
    static compile(rawSchema) {
        const validation = new ajv({allErrors: true});

        ajvErrors(validation);
        ajvFormats(validation);

        /**
         * Recursively builds a JSON-schema-like object from a model or schema segment.
         *
         * Handles both `Model` instances and schema property definitions,
         * including nested models and required property rules.
         *
         * @param {Object|Model|Type} schemaSegment - A model or a property descriptor.
         * @returns {Object} A JSON schema representation of the input segment.
         */
        function BuildSchema(schemaSegment) {
            const thisSchema = {};

            if (Model.isModel(schemaSegment)) {
                thisSchema.required = [];
                thisSchema.type = 'object';
                thisSchema.additionalProperties = false;
                thisSchema.properties = {
                    id: {
                        type: 'string',
                        pattern: `^${schemaSegment.toString()}/[A-Z0-9]+$`,
                    },
                };

                for (const [name, type] of Object.entries(schemaSegment)) {
                    if (['indexedProperties', 'searchProperties'].includes(name)) continue;

                    const property = type instanceof Function && !type.prototype ? type() : type;

                    if (property?._required || property?._items?._type?._required) {
                        thisSchema.required.push(name);
                    }

                    if (Model.isModel(property)) {
                        thisSchema.properties[name] = {
                            type: 'object',
                            additionalProperties: false,
                            required: [],
                            properties: {
                                id: {
                                    type: 'string',
                                    pattern: `^${property.toString()}/[A-Z0-9]+$`,
                                },
                            },
                        };
                        continue;
                    }

                    thisSchema.properties[name] = BuildSchema(property);
                }

                return thisSchema;
            }

            if (schemaSegment._schema) {
                return schemaSegment._schema;
            }

            thisSchema.type = schemaSegment?._type;

            if (schemaSegment?._format) {
                thisSchema.format = schemaSegment._format;
            }

            if (schemaSegment?._items) {
                thisSchema.items = {};
                thisSchema.items.type = schemaSegment._items._type;
                if (schemaSegment._items._format)
                    thisSchema.items.format = schemaSegment._items._format;
            }

            return thisSchema;
        }

        const builtSchema = BuildSchema(rawSchema);

        return new CompiledSchema(validation.compile(builtSchema));
    }
}


/**
 * Represents a compiled schema used for validating data models.
 * This class provides a mechanism to validate data using a precompiled schema and a validator function.
 */
export class CompiledSchema {
    /**
     * The validator function used to validate data against the schema.
     * @type {?Function}
     * @private
     */
    #validator = null;

    constructor(validator) {
        this.#validator = validator;
    }

    /**
     * Validates the given data against the compiled schema.
     *
     * If the data is an instance of a model, it will be converted to a plain object via `toData()` before validation.
     *
     * @param {Object|Model} data - The data or model instance to be validated.
     * @returns {boolean} - Returns `true` if the data is valid according to the schema.
     * @throws {ValidationError} - Throws a `ValidationError` if the data is invalid.
     */
    validate(data) {
        let inputData = structuredClone(data);

        if (Model.isModel(data)) {
            inputData = data.toData();
        }

        const valid = this.#validator?.(inputData);

        if (valid) return valid;

        throw new ValidationError(inputData, this.#validator.errors);
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

export default Schema;
