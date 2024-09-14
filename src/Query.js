/**
 * persist query language features:
 * - value match {title: 'test'} or {title: {$is: 'test'}}
 * - contains match {list: {$contains: 'test'}} or {string: {$contains: 'es'}}
 * - nested query {list: {$contains: {slug: 'test'}}}
 * - deep nesting queries {list: {$contains: {string: {$contains: 'test'}}}}
 */

/**
 * @class Query
 */
class Query {
    query;

    /**
     *
     * @param {object} query
     */
    constructor(query) {
        this.query = query;
    }

    /**
     * Using the input query, find records in an index that match
     *
     * @param {typeof Model} model
     * @param {object} index
     */
    execute(model, index) {
        const matchIs = (query) => !!query?.$is;
        const matchPrimitive = (query) => ['string', 'number', 'boolean'].includes(typeof query);
        const matchContains = (query) => !!query?.$contains;

        const matchesQuery = (subject, inputQuery = this.query) => {
            if (!subject || !inputQuery) return false;

            if (matchPrimitive(inputQuery)) return subject === inputQuery;

            if (matchIs(inputQuery))
                if (subject === inputQuery.$is) return true;

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

        return Object.values(index)
            .filter(m => matchesQuery(m))
            .map(m => model.fromData(m));
    }
}

export default Query;
