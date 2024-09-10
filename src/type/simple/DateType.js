import SimpleType from './SimpleType.js';

export default class DateType extends SimpleType {
    static _type = 'string';
    static _format = 'iso-date-time';

    static isDate(possibleDate) {
        return possibleDate instanceof Date || !isNaN(new Date(possibleDate));
    }
}
