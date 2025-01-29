import Type from '../Type.js';

/**
 * Class representing a date type with ISO date-time format.
 *
 * This class is used to define and handle data of the date type.
 * It extends the {@link Type} class to represent string-specific behavior.
 *
 * @class DateType
 * @extends Type
 */
class DateType extends Type {
    static {
        /**
         * @static
         * @property {string} _type - The type identifier for DateType, set to `'string'`.
         */
        this._type = 'string';

        /**
         * @static
         * @property {string} _format - The format for DateType, set to `'iso-date-time'`.
         */
        this._format = 'iso-date-time';

        Object.defineProperty(this, 'name', {value: 'Date'});
    }

    /**
     * Checks if the given value is a valid date.
     *
     * @static
     * @param {*} possibleDate - The value to check for a valid date.
     * @returns {boolean} Returns `true` if the value is a valid date or a date string, otherwise `false`.
     */
    static isDate(possibleDate) {
        return possibleDate instanceof Date || !isNaN(new Date(possibleDate));
    }
}

export default DateType;
