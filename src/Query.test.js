import {describe, expect, test} from '@jest/globals';
import {MainModel} from '../test/fixtures/Models.js';
import {Models} from '../test/fixtures/ModelCollection.js';
import Query from './Query.js';

test('new Query(query) stores the query', () => {
    const query = new Query({string: 'test'});

    expect(query.query).toEqual({string: 'test'});
});

describe('exact matches', () => {
    test('Query.execute(index) finds exact string matches with primitive type', () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const query = new Query({string: 'test'});

        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('Query.execute(index) finds exact string matches with $is', () => {
        const models = new Models();
        const model = models.createFullTestModel();
        models.createFullTestModel({string: 'another test'});

        const query = new Query({string: {$is: 'test'}});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('Query.execute(index) finds exact boolean matches with primitive type', () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const query = new Query({boolean: false});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('Query.execute(index) finds exact boolean matches with $is', () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const query = new Query({boolean: {$is: false}});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('Query.execute(index) finds exact number matches with $is', () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const query = new Query({number: {$is: 24.3}});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('Query.execute(index) finds exact number matches with primitive type', () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const query = new Query({number: 24.3});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('Query.execute(index) finds exact string matches with slug type', () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const query = new Query({stringSlug: 'test'});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });
});

describe('containing matches', () => {

    test('Query.execute(index) finds matches containing for strings', () => {
        const models = new Models();
        const model1 = models.createFullTestModel();
        const model2 = models.createFullTestModel();
        models.createFullTestModel({string: 'not matching'});

        model2.string = 'testing';

        const query = new Query({string: {$contains: 'test'}});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([
            expect.objectContaining(model1.toIndexData()),
            expect.objectContaining(model2.toIndexData()),
        ]);
    });

    test('Query.execute(index) finds matches containing for arrays', () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const query = new Query({arrayOfString: {$contains: 'test'}});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('Query.execute(index) finds exact matches for elements in arrays', () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const query = new Query({linkedMany: {$contains: {string: 'many'}}});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('Query.execute(index) finds partial matches for elements in arrays', () => {
        const models = new Models();
        const model1 = models.createFullTestModel();
        const model2 = models.createFullTestModel();

        model2.linkedMany[0].string = 'many tests';

        const query = new Query({linkedMany: {$contains: {string: {$contains: 'many'}}}});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toStrictEqual([
            expect.objectContaining(model1.toIndexData()),
            expect.objectContaining(model2.toIndexData()),
        ]);
    });
});


describe('multiple match types', () => {
    test('Query.execute(index) finds matches for multiple inclusive conditions', () => {
        const models = new Models();
        const model1 = models.createFullTestModel();
        models.createFullTestModel();

        model1.boolean = true;

        const query = new Query({string: {$is: 'test'}, boolean: true});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toEqual([MainModel.fromData(model1.toIndexData())]);
    });

    test('Query.execute(index) finds matches for multiple inclusive nested conditions', () => {
        const models = new Models();
        const model1 = models.createFullTestModel();
        models.createFullTestModel();
        model1.linked.boolean = false;

        const query = new Query({linked: {string: 'test', boolean: false}});
        const results = query.execute(MainModel, models.getIndex(MainModel));

        expect(results).toEqual([MainModel.fromData(model1.toIndexData())]);
    });
});
