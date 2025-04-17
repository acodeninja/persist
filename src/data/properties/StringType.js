import Type from './Type.js';

/**
 * Class representing a string type.
 *
 * This class is used to define and handle data of the string type.
 * It extends the {@link Type} class to represent string-specific behavior.
 *
 * @class StringType
 * @extends Type
 */
class StringType extends Type {
    static {
        /**
         * @static
         * @property {string} _type - The type identifier for the string type.
         */
        this._type = 'string';

        Object.defineProperty(this, 'name', {value: 'String'});
    }
}

export default StringType;
