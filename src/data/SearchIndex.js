import Fuse from 'fuse.js';

/**
 * Represents a single search result with the associated model instance and its relevance score.
 *
 * @class SearchResult
 */
export class SearchResult {
    constructor(model, score) {
        this.model = model;
        this.score = score;
    }
}

/**
 * A full-text search index wrapper using Lunr.js for a given model.
 * Supports indexing and querying model data.
 *
 * @class SearchIndex
 */
export default class SearchIndex {
    #index;
    #model;
    #compiledIndex;

    /**
     * Initializes the search index for the provided model.
     *
     * @param {Model} model - The model definition to use for indexing.
     * @param {Object.<string, Object>} index - A dictionary of model data, keyed by ID.
     * @throws {NoIndexAvailableSearchIndexError} If the model has no searchable properties.
     */
    constructor(model, index) {
        this.#index = index;
        this.#model = model;
        if (model.searchProperties().length === 0) {
            throw new NoIndexAvailableSearchIndexError(this.#model);
        }
    }

    /**
     * Performs a search query on the compiled Lunr index.
     *
     * @param {string} query - The search string.
     * @return {Array<SearchResult>} An array of search results with model instances and scores.
     */
    search(query) {
        return this.searchIndex
            .search(query)
            .map(doc => new SearchResult(this.#model.fromData(this.#index[doc.item.id]), doc.score));
    }

    /**
     * Lazily compiles and returns the Lunr index instance.
     *
     * @return {Fuse} The compiled Lunr index.
     */
    get searchIndex() {
        return this.#compiledIndex ?? this.#compileIndex();
    }

    /**
     * Compiles the Lunr index using the model's search properties.
     *
     * @return {Fuse} The compiled Lunr index.
     * @private
     */
    #compileIndex() {
        const index = this.#index;
        this.#compiledIndex = new Fuse(Object.values(index), {
            includeScore: true,
            ignoreDiacritics: true,
            keys: this.#model.searchProperties().map(p => p.replace(/\[\*]\./g, '')),
        });

        return this.#compiledIndex;
    }
}

/**
 * Base error class for search index-related exceptions.
 *
 * @class SearchIndexError
 * @extends {Error}
 */
export class SearchIndexError extends Error {
}

/**
 * Thrown when a model does not have any properties defined for indexing.
 *
 * @class NoIndexAvailableSearchIndexError
 * @extends {SearchIndexError}
 */
export class NoIndexAvailableSearchIndexError extends SearchIndexError {
    constructor(model) {
        super(`The model ${model.name} has no search properties`);
    }
}
