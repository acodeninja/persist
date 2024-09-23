import SimpleType from './SimpleType.js';

class DateType extends SimpleType {
    static _type = 'string';
    static _format = 'iso-date-time';

    /**
     *
     * @param {Date|number|string} possibleDate
     * @return {boolean}
     */
    static isDate(possibleDate) {
        return possibleDate instanceof Date || !isNaN(new Date(possibleDate));
    }
}

export default DateType;
