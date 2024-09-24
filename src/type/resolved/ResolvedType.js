import Type from '../Type.js';

/**
 * Class representing a resolved type.
 *
 * The `ResolvedType` class extends the base `Type` class and marks the type as resolved.
 * It provides additional functionality for resolving types and allows creating resolved types based on properties.
 *
 * @class ResolvedType
 * @extends Type
 */
class ResolvedType extends Type {
    /**
     * @static
     * @property {boolean} _resolved - Indicates if the type is resolved. Always set to `true` for this class.
     */
    static _resolved = true;

    /**
     * Resolves the type based on the provided model.
     *
     * This method should be overridden in subclasses to provide specific resolution logic.
     * Throws an error if not implemented.
     *
     * @param {*} _model - The model used to resolve the type.
     * @throws {Error} If the method is not implemented in a subclass.
     */
    static resolve(_model) {
        throw new Error(`${this.name} does not implement resolve(model)`);
    }

    /**
     * Creates a subclass of `ResolvedType` that is based on the provided property.
     *
     * The returned class inherits from `ResolvedType` and customizes its `toString` method
     * to reflect the resolved property.
     *
     * @param {*} property - The property to base the resolved type on.
     * @returns {ResolvedType} A subclass of `ResolvedType` customized for the provided property.
     */
    static of(property) {
        class ResolvedTypeOf extends ResolvedType {
            /**
             * Converts the resolved type to a string, displaying the resolved property.
             *
             * @returns {string} A string representing the resolved type, including the property.
             */
            static toString() {
                return `ResolvedTypeOf(${property})`;
            }
        }

        return ResolvedTypeOf;
    }
}

export default ResolvedType;
