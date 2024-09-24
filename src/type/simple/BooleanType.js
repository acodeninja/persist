import SimpleType from './SimpleType.js';

/**
 * Class representing a boolean type.
 *
 * This class is used to define and handle data of the boolean type.
 * It extends the {@link SimpleType} class to represent string-specific behavior.
 *
 * @class BooleanType
 * @extends SimpleType
 */
class BooleanType extends SimpleType {
    /**
     * @static
     * @property {string} _type - The type identifier for BooleanType, set to `'boolean'`.
     */
    static _type = 'boolean';
}

export default BooleanType;
