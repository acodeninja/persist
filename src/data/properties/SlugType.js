import ResolvedType from './ResolvedType.js';
import slugify from 'slugify';

/**
 * Class representing a slug type.
 *
 * The `SlugType` class extends the `ResolvedType` and provides functionality for generating
 * slugified strings based on a specified property of a model. It allows for the creation of
 * types that resolve into slugs from specific properties.
 *
 * @class SlugType
 * @extends ResolvedType
 */
class SlugType extends ResolvedType {
    /**
     * Creates a subclass of `ResolvedType` that generates slugs based on the provided property.
     *
     * The returned class inherits from `ResolvedType` and resolves the property into a slugified
     * string using the `slugify` function. It also customizes the `toString` method to reflect
     * the resolved property.
     *
     * @param {string} property - The property to base the slug on.
     * @returns {ResolvedType} A subclass of `ResolvedType` that generates slugs from the provided property.
     */
    static of(property) {
        class SlugOf extends ResolvedType {
            /**
             * @static
             * @property {string} _type - The type of the resolved value, always set to 'string' for slug types.
             */
            static _type = 'string';

            /**
             * Converts the slug type to a string, displaying the resolved property.
             *
             * @returns {string} A string representing the slug type, including the property.
             */
            static toString() {
                return `SlugOf(${property})`;
            }

            /**
             * Resolves the slug from the given model by extracting the specified property and slugifying it.
             *
             * If the specified property in the model is not a string, an empty string is returned.
             * Uses the `slugify` function to convert the property value into a slug (lowercase, hyphen-separated).
             *
             * @param {Object} model - The model from which to extract and slugify the property.
             * @returns {string} The slugified version of the model's property, or an empty string if not valid.
             */
            static resolve(model) {
                if (typeof model?.[property] !== 'string') return '';

                return slugify(model?.[property], {
                    lower: true,
                    strict: true,
                    trim: true,
                });
            }
        }

        Object.defineProperty(SlugOf, 'name', {value: `SlugOf(${property})`});

        return SlugOf;
    }

    static {
        Object.defineProperty(SlugType, 'name', {value: 'Slug'});
    }
}

export default SlugType;
