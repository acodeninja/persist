import lunr from 'lunr';

export class SearchResult {
    constructor(model, score) {
        this.model = model;
        this.score = score;
    }
}

export default class SearchIndex {
    #index;
    #model;
    #compiledIndex;

    constructor(model, index) {
        this.#index = index;
        this.#model = model;
        if (model.searchProperties().length === 0) {
            throw new NoIndexAvailableSearchIndexError(this.#model);
        }
    }

    /**
     *
     * @param {string} query
     * @return {Array<SearchResult>}
     */
    search(query) {
        return this.searchIndex
            .search(query)
            .map(doc => new SearchResult(this.#model.fromData(this.#index[doc.ref]), doc.score));
    }

    get searchIndex() {
        return this.#compiledIndex ?? this.#compileIndex();
    }

    #compileIndex() {
        const model = this.#model;
        const index = this.#index;
        this.#compiledIndex = lunr(function () {
            this.ref('id');

            for (const field of model.searchProperties()) {
                this.field(field);
            }

            Object.values(index).forEach(function (doc) {
                this.add(doc);
            }, this);
        });

        return this.#compiledIndex;
    }
}

export class SearchIndexError extends Error {
}

export class NoIndexAvailableSearchIndexError extends SearchIndexError {
    constructor(model) {
        super(`The model ${model.name} has no search properties`);
    }
}
