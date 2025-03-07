import {
    EmptyModel,
    SimpleModelWithSearchIndex,
    SimpleModelWithSearchIndexFactory,
} from '../../test/fixtures/Model.js';
import {describe, expect, test} from '@jest/globals';
import SearchIndex from './SearchIndex.js';

describe('new SearchIndex', () => {
    describe('when a model has not search properties', () => {
        const model = new EmptyModel();
        const index = {[model.id]: model.toSearchData()};

        test('throws NoIndexAvailableSearchIndexError', () => {
            expect(() => new SearchIndex(EmptyModel, index)).toThrow();
        });
    });

    describe('when a model has search properties', () => {
        const model = SimpleModelWithSearchIndexFactory();
        const index = {[model.id]: model.toSearchData()};

        test('does not throw an error', () => {
           expect(() => new SearchIndex(SimpleModelWithSearchIndex, index)).not.toThrow();
        });
    });
});

describe('SearchIndex.search()', () => {
    describe('when a matching model exists', () => {
        const model1 = SimpleModelWithSearchIndexFactory();
        model1.string = 'abc def';
        const model2 = SimpleModelWithSearchIndexFactory();
        model2.string = 'uvw xyz';
        const index = new SearchIndex(SimpleModelWithSearchIndex, {
            [model1.id]: model1.toSearchData(),
            [model2.id]: model2.toSearchData(),
        });
        const result = index.search('abc');

        test('returns the expected model', () => {
            expect(result).toStrictEqual([{
                score: 0.693,
                model: SimpleModelWithSearchIndex.fromData(model1.toSearchData()),
            }]);
        });
    });

    describe('when multiple matching models exist', () => {
        const model1 = SimpleModelWithSearchIndexFactory();
        model1.string = 'abc def';
        const model2 = SimpleModelWithSearchIndexFactory();
        model2.string = 'abc xyz';
        const index = new SearchIndex(SimpleModelWithSearchIndex, {
            [model1.id]: model1.toSearchData(),
            [model2.id]: model2.toSearchData(),
        });
        const result = index.search('abc');

        test('returns the expected model', () => {
            expect(result).toStrictEqual([{
                score: 0.182,
                model: SimpleModelWithSearchIndex.fromData(model1.toSearchData()),
            }, {
                score: 0.182,
                model: SimpleModelWithSearchIndex.fromData(model2.toSearchData()),
            }]);
        });
    });
});
