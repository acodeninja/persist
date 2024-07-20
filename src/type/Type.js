/**
 * @class Type
 * @property {string} _type
 * @property {boolean} _required
 * @property {boolean} _resolved
 * @property {map?} _properties
 * @property {map?} _items
 * @property {map?} _schema
 */
export default class Type {
    static _required = false;
    static _resolved = false;
    static _properties = undefined;
    static _items = undefined;
    static _schema = undefined;

    static toString() {
        return this.name?.replace(/Type$/, '');
    }

    /**
     * @return {Type}
     */
    static get required() {
        class Required extends this {
            static _required = true;
        }

        Object.defineProperty(Required, 'name', {value: `Required${this.toString()}Type`});

        return Required;
    }
}
