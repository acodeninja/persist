import ResolvedType from './ResolvedType.js';
import slugify from 'slugify';

export default class SlugType extends ResolvedType {
    static of(property) {
        class SlugOf extends ResolvedType {
            static _type = 'string'

            static toString() {
                return `SlugOf(${property})`;
            }

            static resolve(model) {
                if (typeof model?.[property] !== 'string') return '';

                return slugify(model?.[property], {
                    lower: true,
                });
            }
        }

        return SlugOf;
    }
}
