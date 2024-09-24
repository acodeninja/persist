import Type from '../Type.js';
import ajv from 'ajv';

/**
 * Represents a custom type definition, allowing the specification of a type based on a given schema.
 * This class uses AJV (Another JSON Schema Validator) to validate schemas and create type definitions.
 *
 * @class CustomType
 */
class CustomType {
    /**
     * Creates a new custom type definition based on the provided JSON schema.
     *
     * The `of` method allows defining a custom object type using a JSON schema. It validates the schema
     * using AJV to ensure correctness and returns a class representing the custom type.
     *
     * @param {Object} schema - The JSON schema that defines the structure and validation rules for the custom type.
     * @returns {Type} A new class representing the custom type based on the provided schema.
     *
     * @example
     * const customSchema = {
     *   type: 'object',
     *   properties: { name: { type: 'string' }, age: { type: 'number' } },
     *   required: ['name'],
     * };
     * const CustomModel = CustomType.of(customSchema);
     */
    static of(schema) {
        // Compiles and validates the schema using AJV
        new ajv().compile(schema);

        /**
         * @class Custom
         * @extends Type
         * Represents a custom type defined by a JSON schema.
         */
        class Custom extends Type {
            /** @type {string} The data type, which is 'object' */
            static _type = 'object';

            /** @type {Object} The JSON schema that defines the structure and validation rules */
            static _schema = schema;
        }

        return Custom;
    }
}

export default CustomType;
