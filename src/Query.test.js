import {MainModel} from '../test/fixtures/Models.js';
import {Models} from '../test/fixtures/ModelCollection.js';
import Query from './Query.js';
import test from 'ava';

test('new Query(query) stores the query', t => {
    const query = new Query({string: 'test'});

    t.deepEqual(query.query, {string: 'test'});
});

test('Query.execute(index) finds exact string matches with primitive type', t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const query = new Query({string: 'test'});

    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [model.toIndexData()]);
});

test('Query.execute(index) finds exact string matches with $is', t => {
    const models = new Models();
    const model = models.createFullTestModel();
    models.createFullTestModel({string: 'another test'});

    const query = new Query({string: {$is: 'test'}});
    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [model.toIndexData()]);
});

test('Query.execute(index) finds exact boolean matches with primitive type', t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const query = new Query({boolean: false});
    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [model.toIndexData()]);
});

test('Query.execute(index) finds exact boolean matches with $is', t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const query = new Query({boolean: {$is: false}});
    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [model.toIndexData()]);
});

test('Query.execute(index) finds exact number matches with $is', t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const query = new Query({number: {$is: 24.3}});
    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [model.toIndexData()]);
});

test('Query.execute(index) finds exact number matches with primitive type', t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const query = new Query({number: 24.3});
    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [model.toIndexData()]);
});

test('Query.execute(index) finds matches containing for strings', t => {
    const models = new Models();
    const model1 = models.createFullTestModel();
    const model2 = models.createFullTestModel();
    models.createFullTestModel({string: 'not matching'});

    model2.string = 'testing';

    const query = new Query({string: {$contains: 'test'}});
    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [
        model1.toIndexData(),
        model2.toIndexData(),
    ]);
});

test('Query.execute(index) finds matches containing for arrays', t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const query = new Query({arrayOfString: {$contains: 'test'}});
    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [model.toIndexData()]);
});

test('Query.execute(index) finds exact matches for elements in arrays', t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const query = new Query({linkedMany: {$contains: {string: 'many'}}});
    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [model.toIndexData()]);
});

test('Query.execute(index) finds partial matches for elements in arrays', t => {
    const models = new Models();
    const model1 = models.createFullTestModel();
    const model2 = models.createFullTestModel();

    model2.linkedMany[0].string = 'many tests';

    const query = new Query({linkedMany: {$contains: {string: {$contains: 'many'}}}});
    const results = query.execute(MainModel, models.getIndex(MainModel));

    t.like(results, [
        model1.toIndexData(),
        model2.toIndexData(),
    ]);
});
