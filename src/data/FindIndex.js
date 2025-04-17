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
class FindIndex {
    /**
     * The query object that defines the search criteria.
     * @type {Object}
     * @private
     */
    #index;

    /**
     * @type {Model.constructor} - The model class.
     * @private
     */
    #modelConstructor;

    /**
     * Constructs a new `Query` instance with the provided query object.
     *
     * @param {Model.constructor} modelConstructor - The model class.
     * @param {Record<string, Model>} index - The index dataset to search through.
     */
    constructor(modelConstructor, index) {
        this.#index = index;
        this.#modelConstructor = modelConstructor;
    }

    /**
     * Executes the query against a model's index and returns the matching results.
     *
     * @param {Object} query The structured query.
     * @returns {Array<Model>} The models that match the query.
     */
    query(query) {
        const splitQuery = this.#splitQuery(query);

        return Object.values(this.#index)
            .filter(m =>
                splitQuery
                    .map(q => Boolean(this.#matchesQuery(m, q)))
                    .every(c => c),
            )
            .map(m => this.#modelConstructor.fromData(m));
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
    #matchesQuery(subject, inputQuery) {
        if (['string', 'number', 'boolean'].includes(typeof inputQuery))
            return subject === inputQuery;

        if (inputQuery?.$is !== undefined && subject === inputQuery.$is)
            return true;

        if (inputQuery?.$contains !== undefined) {
            if (subject.includes?.(inputQuery.$contains))
                return true;

            if (typeof subject[Symbol.iterator] === 'function')
                for (const value of subject) {
                    if (this.#matchesQuery(value, inputQuery.$contains))
                        return true;
                }
        }

        for (const key of Object.keys(inputQuery)) {
            if (!['$is', '$contains'].includes(key))
                if (this.#matchesQuery(subject[key], inputQuery[key]))
                    return true;
        }

        return false;
    }

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
    #splitQuery(query) {
        return Object.entries(query)
            .flatMap(([key, value]) =>
                typeof value === 'object' && value !== null && !Array.isArray(value)
                    ? this.#splitQuery(value).map(nestedObj => ({[key]: nestedObj}))
                    : {[key]: value},
            );
    }
}

export default FindIndex;
