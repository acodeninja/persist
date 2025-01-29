/**
 * The `Query` class is responsible for executing searches on an indexed dataset
 * based on a structured query. It supports various query types including value matches,
 * contains matches, and nested queries.
 *
 * @example
 * // The object has the property `title` witch exactly equals `test`.
 * const query = new Query({title: 'test'});
 * const query = new Query({title: {$is: 'test'}});
 *
 * // The object has the property `list` witch contains the string `test`.
 * const query = new Query({list: {$contains: 'test'}});
 *
 * // The object has the property `string` witch contains the string `es`.
 * const query = new Query({string: {$contains: 'es'}});
 *
 * // The object has the property `list` contains an object
 * // with a property `string` that contains the string `test`.
 * const query = new Query({
 *   list: {
 *     $contains: {
 *       string: {
 *         $contains: 'test'
 *       }
 *     }
 *   }
 * });
 */
class Query {
    /**
     * The query object that defines the search criteria.
     * @type {Object}
     */
    query;

    /**
     * Constructs a new `Query` instance with the provided query object.
     *
     * @param {Object} query - The structured query object defining the search criteria.
     */
    constructor(query) {
        this.query = query;
    }

    /**
     * Executes the query against a model's index and returns the matching results.
     *
     * @param {Model.constructor} model - The model class that contains the `fromData` method for constructing models from data.
     * @param {Object<string, Model>} index - The index dataset to search through.
     * @returns {Array<Model>} The models that match the query.
     */
    execute(model, index) {
        return Object.values(index)
            .filter(m =>
                this._splitQuery(this.query)
                    .map(query => Boolean(this._matchesQuery(m, query)))
                    .every(c => c),
            )
            .map(m => model.fromData(m));
    }

    /**
     * Recursively checks if a subject matches a given query.
     *
     * This function supports matching:
     * - Primitive values directly (`string`, `number`, `boolean`)
     * - The `$is` property for exact matches
     * - The `$contains` property for substring or array element matches
     *
     * @private
     * @param {*} subject - The subject to be matched.
     * @param {Object} inputQuery - The query to match against.
     * @returns {boolean} True if the subject matches the query, otherwise false.
     */
    _matchesQuery(subject, inputQuery) {
        if (['string', 'number', 'boolean'].includes(typeof inputQuery)) return subject === inputQuery;

        if (inputQuery?.$is !== undefined && subject === inputQuery.$is) return true;

        if (inputQuery?.$contains !== undefined) {
            if (subject.includes?.(inputQuery.$contains)) return true;

            for (const value of subject) {
                if (this._matchesQuery(value, inputQuery.$contains)) return true;
            }
        }

        for (const key of Object.keys(inputQuery)) {
            if (!['$is', '$contains'].includes(key))
                if (this._matchesQuery(subject[key], inputQuery[key])) return true;
        }

        return false;
    };

    /**
     * Recursively splits an object into an array of objects,
     * where each key-value pair from the input query becomes a separate object.
     *
     * If the value of a key is a nested object (and not an array),
     * the function recursively splits it, preserving the parent key.
     *
     * @private
     * @param {Object} query - The input object to be split into individual key-value pairs.
     * @returns {Array<Object>} An array of objects, where each object contains a single key-value pair
     *                         from the original query or its nested objects.
     */
    _splitQuery(query) {
        return Object.entries(query)
            .flatMap(([key, value]) =>
                typeof value === 'object' && value !== null && !Array.isArray(value)
                    ? this._splitQuery(value).map(nestedObj => ({[key]: nestedObj}))
                    : {[key]: value},
            );
    }
}

export default Query;
