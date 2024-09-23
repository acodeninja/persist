import SimpleType from './SimpleType.js';

/**
 * Class representing a number type.
 *
 * This class is used to define and handle data of the number type.
 * It extends the {@link SimpleType} class to represent string-specific behavior.
 *
 * @class NumberType
 * @extends SimpleType
 */
class NumberType extends SimpleType {
    /**
     * @static
     * @property {string} _type - The type identifier for NumberType, set to `'number'`.
     */
    static _type = 'number';
}

export default NumberType;
