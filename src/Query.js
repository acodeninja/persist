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
     * @param {Model} model
     * @param {object} index
     */
    execute(model, index) {
        return Object.values(index)
            .filter((model) =>
                Object.entries(this.query)
                    .some(([name, value]) => model[name] === value),
            ).map(m => model.fromData(m));
    }
}

export default Query;
