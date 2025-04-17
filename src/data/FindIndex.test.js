import {
    LinkedManyModelWithIndex,
    LinkedManyModelWithIndexFactory,
    LinkedModelWithIndex,
    LinkedModelWithIndexFactory,
    SimpleModelWithFullIndex,
    SimpleModelWithFullIndexFactory,
    SimpleModelWithIndex,
    SimpleModelWithIndexFactory,
} from '../../test/fixtures/Model.js';
import {describe, expect, test} from '@jest/globals';
import FindIndex from './FindIndex.js';

describe('FindIndex', () => {
    describe('exact matches', () => {
        test('FindIndex.query(query) finds exact string matches with primitive type', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({string: 'string'});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds exact string matches with $is', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({string: {$is: 'string'}});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds exact boolean matches with primitive type', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({boolean: true});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds exact boolean matches with $is', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({boolean: {$is: true}});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds exact number matches with primitive type', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({number: 1.4});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds exact number matches with $is', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({number: {$is: 1.4}});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds exact string matches with slug type', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({stringSlug: 'string'});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) only returns models that match with primitive type', () => {
            const model1 = SimpleModelWithIndexFactory();
            const model2 = SimpleModelWithIndexFactory();

            model2.string = 'not-the-same';

            const index = new FindIndex(SimpleModelWithIndex, {
                [model1.id]: model1.toIndexData(),
                [model2.id]: model2.toIndexData(),
            });

            const results = index.query({string: 'string'});

            expect(results).toStrictEqual([expect.objectContaining(model1.toIndexData())]);
        });

        test('FindIndex.query(query) only returns models that match with $is', () => {
            const model1 = SimpleModelWithIndexFactory();
            const model2 = SimpleModelWithIndexFactory();

            model2.string = 'not-the-same';

            const index = new FindIndex(SimpleModelWithIndex, {
                [model1.id]: model1.toIndexData(),
                [model2.id]: model2.toIndexData(),
            });

            const results = index.query({string: {$is: 'string'}});

            expect(results).toStrictEqual([expect.objectContaining(model1.toIndexData())]);
        });
    });

    describe('containing matches', () => {
        test('FindIndex.query(query) finds matches containing for strings', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({string: {$contains: 'str'}});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds matches containing for arrays', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({arrayOfString: {$contains: 'string'}});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds exact matches for elements in arrays', () => {
            const model = LinkedManyModelWithIndexFactory();

            const index = new FindIndex(LinkedManyModelWithIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({linked: {$contains: {string: 'string'}}});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds partial matches for elements in arrays', () => {
            const model = LinkedManyModelWithIndexFactory();

            const index = new FindIndex(LinkedManyModelWithIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({linked: {$contains: {string: {$contains: 'ring'}}}});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds only matches containing for strings', () => {
            const model1 = SimpleModelWithFullIndexFactory();
            const model2 = SimpleModelWithFullIndexFactory();

            model2.string = 'not-the-same';

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model1.id]: model1.toIndexData(),
                [model2.id]: model2.toIndexData(),
            });

            const results = index.query({string: {$contains: 'str'}});

            expect(results).toStrictEqual([expect.objectContaining(model1.toIndexData())]);
        });
    });

    describe('multiple match types', () => {
        test('FindIndex.query(query) finds matches for multiple inclusive conditions', () => {
            const model = SimpleModelWithFullIndexFactory();

            const index = new FindIndex(SimpleModelWithFullIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({string: 'string', boolean: true});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds matches for multiple inclusive nested conditions', () => {
            const model = LinkedModelWithIndexFactory();

            const index = new FindIndex(LinkedModelWithIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({linked: {string: 'string', boolean: true}});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });

        test('FindIndex.query(query) finds matches for multiple inclusive nested and non-nested conditions', () => {
            const model = LinkedModelWithIndexFactory();

            const index = new FindIndex(LinkedModelWithIndex, {
                [model.id]: model.toIndexData(),
            });

            const results = index.query({string: 'string', linked: {string: 'string'}});

            expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
        });
    });
});
