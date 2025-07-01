/**
 * Base class for all data types.
 *
 * The `Type` class is a foundational class used to define various data types.
 * It contains common properties and methods that are inherited by more specific types like strings, numbers, and booleans.
 *
 * @class Type
 */
class Type {
    /**
     * @static
     * @property {boolean} _required - Indicates if the type is required. Default is `false`.
     */
    static _required = false;

    /**
     * @static
     * @property {boolean} _resolved - Indicates if the type has been resolved. Default is `false`.
     */
    static _resolved = false;

    /**
     * @static
     * @property {*} _properties - Properties for defining schemas. Default is `undefined`.
     */
    static _properties = undefined;

    /**
     * @static
     * @property {*} _items - Represents items in array types or collections. Default is `undefined`.
     */
    static _items = undefined;

    /**
     * @static
     * @property {*} _schema - The schema definition for the type. Default is `undefined`.
     */
    static _schema = undefined;

    /**
     * Converts the class name to a string
     *
     * @returns {string} The name of the type.
     */
    static toString() {
        return this.name;
    }

    /**
     * Returns a version of the type marked as required.
     *
     * @type {Type}
     * @returns {Type} A subclass of the current type with `_required` set to `true`.
     */
    static get required() {
        const ThisType = this;

        /**
         * A subclass of the current type with the `_required` flag set to `true`.
         * Used to indicate that the property is required during validation or schema generation.
         *
         * @class
         * @extends {Type}
         * @private
         */
        class Required extends ThisType {
            static _required = true;
        }

        // Define the class name as "Required<OriginalTypeName>"
        Object.defineProperty(Required, 'name', {value: `Required${ThisType.name}`});

        return Required;
    }

    /**
     * Returns a version of the type with a default value set.
     *
     * @param {*} defaultValue
     * @return {Type} A subclass of the current type with `_default` set to `defaultValue`.
     */
    static default(defaultValue) {
        const ThisType = this;

        /**
         * A subclass of the current type with the `_defaults` flag set to the default value.
         * Used to indicate that the property will default to the value given if none is provided.
         *
         * @class
         * @extends {Type}
         * @private
         */
        class WithDefault extends ThisType {
            static _default = defaultValue;
        }

        // Define the class name as "OriginalTypeName"
        Object.defineProperty(WithDefault, 'name', {value: ThisType.name});

        return WithDefault;
    }

    static {
        Object.defineProperty(Type, 'name', {value: 'Type'});
    }
}

export default Type;
