import Type from '../Type.js';

/**
 * Class representing a boolean type.
 *
 * This class is used to define and handle data of the boolean type.
 * It extends the {@link Type} class to represent string-specific behavior.
 *
 * @class BooleanType
 * @extends Type
 */
class BooleanType extends Type {
    static {
        /**
         * @static
         * @property {string} _type - The type identifier for BooleanType, set to `'boolean'`.
         */
        this._type = 'boolean';

        Object.defineProperty(this, 'name', {value: 'Boolean'});
    }
}

export default BooleanType;
