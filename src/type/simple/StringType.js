import SimpleType from './SimpleType.js';

/**
 * Class representing a string type.
 *
 * This class is used to define and handle data of the string type.
 * It extends the {@link SimpleType} class to represent string-specific behavior.
 *
 * @class StringType
 * @extends SimpleType
 */
class StringType extends SimpleType {
    /**
     * @static
     * @property {string} _type - The type identifier for the string type.
     */
    static _type = 'string';
}

export default StringType;
