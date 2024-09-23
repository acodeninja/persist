import Type from '../Type.js';

class ArrayType {
    static of(type) {
        class ArrayOf extends Type {
            static _type = 'array';
            static _items = type;

            static toString() {
                return `ArrayOf(${type.toString()})`;
            }

            static get required() {
                class Required extends this {
                    static _required = true;

                    static toString() {
                        return `RequiredArrayOf(${type})`;
                    }
                }

                Object.defineProperty(Required, 'name', {value: `Required${this.toString()}Type`});

                return Required;
            }
        }

        Object.defineProperty(ArrayOf, 'name', {value: `${ArrayOf.toString()}Type`});

        return ArrayOf;
    }
}

export default ArrayType;
