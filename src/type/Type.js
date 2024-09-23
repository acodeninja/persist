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
     * Converts the class name to a string, removing the "Type" suffix.
     *
     * @returns {string} The name of the type without the "Type" suffix.
     */
    static toString() {
        return this.name?.replace(/Type$/, '');
    }

    /**
     * Returns a version of the type marked as required.
     *
     * @type {Type}
     * @returns {Type} A subclass of the current type with `_required` set to `true`.
     */
    static get required() {
        class Required extends this {
            static _required = true;
        }

        // Define the class name as "Required<OriginalTypeName>"
        Object.defineProperty(Required, 'name', {value: `Required${this.toString()}Type`});

        return Required;
    }
}

export default Type;
