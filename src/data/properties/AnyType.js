import Type from './Type.js';

/**
 * Represents a union type definition, allowing the specification of a value that can be one of several types.
 * This class is used to create type definitions for union types that can be validated and used in schemas.
 *
 * @class AnyType
 */
class AnyType {
    /**
     * Creates a new type definition for a union of the specified types.
     *
     * The `of` method defines a union type where the value can be any one of the specified types. It returns a
     * class representing this union type, which can further be marked as required using the `required` getter.
     *
     * @param {...(Type|Model)} types - The types or models that the union can contain. A value must match at least one of these types.
     * @returns {Type} A new class representing a union of the specified types.
     *
     * @example
     * const stringOrNumber = AnyType.of(StringType, NumberType);
     * const requiredStringOrBoolean = AnyType.of(StringType, BooleanType).required;
     */
    static of(...types) {
        /**
         * @class AnyOf
         * @extends Type
         * Represents a union of specific types.
         */
        class AnyOf extends Type {
            /** @type {string} The data type, which is 'anyOf' */
            static _type = 'anyOf';

            /** @type {Type[]} The array of types that are allowed in the union */
            static _items = types;

            /**
             * Returns the string representation of the union type.
             *
             * @returns {string} The string representation of the union type.
             */
            static toString() {
                return `AnyOf(${types.map(t => t.toString()).join('|')})`;
            }

            /**
             * Marks the union type as required.
             *
             * @returns {Type} A new class representing a required union of the specified types.
             *
             * @example
             * const requiredStringOrNumber = AnyType.of(StringType, NumberType).required;
             */
            static get required() {
                const ThisType = this;

                /**
                 * @class RequiredAnyOf
                 * @extends AnyOf
                 * Represents a required union of specific types.
                 */
                class Required extends ThisType {
                    /** @type {boolean} Indicates that the union type is required */
                    static _required = true;

                    /**
                     * Returns the string representation of the required union type.
                     *
                     * @returns {string} The string representation of the required union type.
                     */
                    static toString() {
                        return `RequiredAnyOf(${types.map(t => t.toString()).join('|')})`;
                    }
                }

                Object.defineProperty(Required, 'name', {value: `Required${ThisType.name}`});

                return Required;
            }
        }

        Object.defineProperty(AnyOf, 'name', {value: AnyOf.toString()});

        return AnyOf;
    }
}

export default AnyType;
