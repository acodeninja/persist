/**
 * @class Type
 */
class Type {
    static _required = false;
    static _resolved = false;
    static _properties = undefined;
    static _items = undefined;
    static _schema = undefined;

    static toString() {
        return this['name']?.replace(/Type$/, '');
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

export default Type;
