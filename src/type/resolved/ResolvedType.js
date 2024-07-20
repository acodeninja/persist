import Type from '../Type.js';

export default class ResolvedType extends Type {
    static _resolved = true;

    static resolve(_model) {
        throw new Error(`${this.name} does not implement resolve(model)`);
    }

    static of(property) {
        class ResolvedTypeOf extends ResolvedType {
            static toString() {
                return `ResolvedTypeOf(${property})`;
            }
        }

        return ResolvedTypeOf;
    }
}
