import Type from '../Type.js';

export default class ArrayType {
    static of(type) {
        class ArrayOf extends Type {
            static _type = 'array'
            static _items = type;

            static toString() {
                return `ArrayOf(${type})`;
            }

            static get required() {
                class Required extends this {
                    static _required = true;

                    static toString() {
                        return `RequiredArrayOf(${type})`;
                    }
                }

                Object.defineProperty(Required, 'name', {value: `Required${this.toString()}Type`})

                return Required;
            }
        }

        return ArrayOf;
    }
}
