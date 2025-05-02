import SearchIndex, {SearchResult} from './SearchIndex.js';
import {
    SimpleModel,
    SimpleModelWithSearchIndex,
    SimpleModelWithSearchIndexFactory,
} from '../../test/fixtures/Model.js';
import {describe, expect, test} from '@jest/globals';

describe('new SearchIndex', () => {
    describe('when a model has not search properties', () => {
        const model = new SimpleModel();
        const index = {[model.id]: model.toSearchData()};

        test('throws NoIndexAvailableSearchIndexError', () => {
            expect(() => new SearchIndex(SimpleModel, index)).toThrow();
        });
    });

    describe('when a model has search properties', () => {
        const model = SimpleModelWithSearchIndexFactory();
        const index = {[model.id]: model.toSearchData()};

        test('does not throw an error', () => {
           expect(() => new SearchIndex(SimpleModelWithSearchIndex, index)).not.toThrow();
        });
    });

    test('allows access to the underlying index', () => {
        const model = SimpleModelWithSearchIndexFactory();
        const index = {[model.id]: model.toSearchData()};
        expect(() => new SearchIndex(SimpleModelWithSearchIndex, index)).not.toThrow();
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
            expect(result).toStrictEqual([
                new SearchResult(SimpleModelWithSearchIndex.fromData(model1.toSearchData()), 0.007568328950209746),
            ]);
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
            expect(result).toStrictEqual([
                new SearchResult(SimpleModelWithSearchIndex.fromData(model1.toSearchData()), 0.007568328950209746),
                new SearchResult(SimpleModelWithSearchIndex.fromData(model2.toSearchData()), 0.007568328950209746),
            ]);
        });
    });
});
