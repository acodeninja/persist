import Type from '../Type.js';

/**
 * Class representing a number type.
 *
 * This class is used to define and handle data of the number type.
 * It extends the {@link Type} class to represent string-specific behavior.
 *
 * @class NumberType
 * @extends Type
 */
class NumberType extends Type {
    static {
        /**
         * @static
         * @property {string} _type - The type identifier for NumberType, set to `'number'`.
         */
        this._type = 'number';

        Object.defineProperty(this, 'name', {value: 'Number'});
    }
}

export default NumberType;
