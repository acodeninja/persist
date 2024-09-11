/**
 * persist query language features:
 * - value match {title: 'test'} or {title: {$is: 'test'}}
 * - contains match {list: {$contains: 'test'}} or {string: {$contains: 'es'}}
 * - nested query {list: {$contains: {slug: 'test'}}}
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
        const matchesQuery = (subject, inputQuery = undefined) => {
            for (const [name, query] of Object.entries(inputQuery || this.query)) {
                if (subject[name] === query) return true;
                if (query.$is && matchesQuery(subject, {[name]: query.$is})) return true;
                if (query.$contains)
                    if (subject[name].includes(query.$contains)) return true;
            }
        };

        return Object.values(index)
            .filter(m => matchesQuery(m))
            .map(m => model.fromData(m));
    }
}

export default Query;
