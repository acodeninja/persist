import lunr from 'lunr';

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

        this.#compiledIndex = lunr(function () {
            this.ref('id');

            for (const field of model.searchProperties()) {
                this.field(field);
            }

            Object.values(index).forEach(function (doc) {
                this.add(doc);
            }, this);
        });
    }

    search(query) {
        return this.#compiledIndex.search(query).map(doc => ({
            score: doc.score,
            model: this.#model.fromData(this.#index[doc.ref]),
        }));
    }
}

export class SearchIndexError extends Error {
}

export class NoIndexAvailableSearchIndexError extends SearchIndexError {
    constructor(model) {
        super(`The model ${model.name} has no search properties`);
    }
}
