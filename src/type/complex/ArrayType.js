import Type from '../Type.js';

/**
 * Represents an array type definition, allowing the specification of an array of a certain type.
 * This class is used to create type definitions for arrays that can be validated and used in schemas.
 *
 * @class ArrayType
 */
class ArrayType {
    /**
     * Creates a new type definition for an array of the specified type.
     *
     * The `of` method defines an array where the items must be of the specified type. It returns a
     * class representing this array type, which can further be marked as required using the `required` getter.
     *
     * @param {Type} type - The type of the items that the array will contain.
     * @returns {Type} A new class representing an array of the specified type.
     *
     * @example
     * const arrayOfStrings = ArrayType.of(StringType);
     * const requiredArrayOfNumbers = ArrayType.of(NumberType).required;
     */
    static of(type) {
        /**
         * @class ArrayOf
         * @extends Type
         * Represents an array of a specific type.
         */
        class ArrayOf extends Type {
            /** @type {string} The data type, which is 'array' */
            static _type = 'array';

            /** @type {Type} The type of items contained in the array */
            static _items = type;

            /**
             * Returns the string representation of the array type.
             *
             * @returns {string} The string representation of the array type.
             */
            static toString() {
                return `ArrayOf(${type.toString()})`;
            }

            /**
             * Marks the array type as required.
             *
             * @returns {Type} A new class representing a required array of the specified type.
             *
             * @example
             * const requiredArrayOfStrings = ArrayType.of(StringType).required;
             */
            static get required() {
                /**
                 * @class RequiredArrayOf
                 * @extends ArrayOf
                 * Represents a required array of a specific type.
                 */
                class Required extends this {
                    /** @type {boolean} Indicates that the array is required */
                    static _required = true;

                    /**
                     * Returns the string representation of the required array type.
                     *
                     * @returns {string} The string representation of the required array type.
                     */
                    static toString() {
                        return `RequiredArrayOf(${type.toString()})`;
                    }
                }

                Object.defineProperty(Required, 'name', {value: `Required${this.toString()}`});

                return Required;
            }
        }

        Object.defineProperty(ArrayOf, 'name', {value: ArrayOf.toString()});

        return ArrayOf;
    }
}

export default ArrayType;
