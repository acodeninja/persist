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
        const matchIs = (query) => query?.$is !== undefined;
        const matchPrimitive = (query) => ['string', 'number', 'boolean'].includes(typeof query);
        const matchContains = (query) => query?.$contains !== undefined;

        const matchesQuery = (subject, inputQuery = this.query) => {
            if (matchPrimitive(inputQuery)) return subject === inputQuery;

            if (matchIs(inputQuery) && subject === inputQuery.$is) return true;

            if (matchContains(inputQuery)) {
                if (subject.includes?.(inputQuery.$contains)) return true;

                for (const value of subject) {
                    if (matchesQuery(value, inputQuery.$contains)) return true;
                }
            }

            for (const key of Object.keys(inputQuery)) {
                if (!['$is', '$contains'].includes(key))
                    if (matchesQuery(subject[key], inputQuery[key])) return true;
            }
        };

        const splitQuery = (query) =>
            Object.entries(query)
                .flatMap(([key, value]) =>
                    typeof value === 'object' && value !== null && !Array.isArray(value)
                        ? splitQuery(value).map(nestedObj => ({[key]: nestedObj}))
                        : {[key]: value},
                );

        return Object.values(index)
            .filter(m =>
                splitQuery(this.query)
                    .map(query => Boolean(matchesQuery(m, query)))
                    .every(m => m),
            )
            .map(m => model.fromData(m));
    }
}

export default Query;
