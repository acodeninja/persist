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
    }

    search(query) {
        return (this.#compiledIndex ?? this.#compileIndex()).search(query).map(doc => ({
            score: doc.score,
            model: this.#model.fromData(this.#index[doc.ref]),
        }));
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
