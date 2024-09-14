import {MainModel} from '../test/fixtures/TestModel.js';
import Query from './Query.js';
import {TestIndex} from '../test/fixtures/TestIndex.js';
import test from 'ava';

test('new Query(query) stores the query', t => {
    const query = new Query({string: 'test'});

    t.deepEqual(query.query, {string: 'test'});
});

test('Query.execute(index) finds exact matches with primitive types', t => {
    const query = new Query({string: 'test'});
    const results = query.execute(MainModel, TestIndex);

    t.deepEqual(results, [
        MainModel.fromData({
            id: 'MainModel/000000000000',
            string: 'test',
            arrayOfString: ['test'],
            linkedMany: [{
                id: 'LinkedManyModel/000000000000000',
                string: 'test',
            }],
        }),
    ]);
});

test('Query.execute(index) finds exact matches with $is', t => {
    const query = new Query({string: {$is: 'test'}});
    const results = query.execute(MainModel, TestIndex);

    t.deepEqual(results, [
        MainModel.fromData({
            id: 'MainModel/000000000000',
            string: 'test',
            arrayOfString: ['test'],
            linkedMany: [{
                id: 'LinkedManyModel/000000000000000',
                string: 'test',
            }],
        }),
    ]);
});

test('Query.execute(index) finds matches containing for strings', t => {
    const query = new Query({string: {$contains: 'test'}});
    const results = query.execute(MainModel, TestIndex);

    t.deepEqual(results, [
        MainModel.fromData({
            id: 'MainModel/000000000000',
            string: 'test',
            arrayOfString: ['test'],
            linkedMany: [{
                id: 'LinkedManyModel/000000000000000',
                string: 'test',
            }],
        }),
        MainModel.fromData({
            id: 'MainModel/111111111111',
            string: 'testing',
            arrayOfString: ['testing'],
            linkedMany: [{
                id: 'LinkedManyModel/111111111111',
                string: 'testing',
            }],
        }),
    ]);
});

test('Query.execute(index) finds matches containing for arrays', t => {
    const query = new Query({arrayOfString: {$contains: 'test'}});
    const results = query.execute(MainModel, TestIndex);

    t.deepEqual(results, [
        MainModel.fromData({
            id: 'MainModel/000000000000',
            string: 'test',
            arrayOfString: ['test'],
            linkedMany: [{
                id: 'LinkedManyModel/000000000000000',
                string: 'test',
            }],
        }),
    ]);
});

test('Query.execute(index) finds exact matches for elements in arrays', t => {
    const query = new Query({linkedMany: {$contains: {string: 'test'}}});
    const results = query.execute(MainModel, TestIndex);

    t.deepEqual(results, [
        MainModel.fromData({
            id: 'MainModel/000000000000',
            string: 'test',
            arrayOfString: ['test'],
            linkedMany: [{
                id: 'LinkedManyModel/000000000000000',
                string: 'test',
            }],
        }),
    ]);
});

test('Query.execute(index) finds partial matches for elements in arrays', t => {
    const query = new Query({linkedMany: {$contains: {string: {$contains: 'test'}}}});
    const results = query.execute(MainModel, TestIndex);

    t.deepEqual(results, [
        MainModel.fromData({
            id: 'MainModel/000000000000',
            string: 'test',
            arrayOfString: ['test'],
            linkedMany: [{
                id: 'LinkedManyModel/000000000000000',
                string: 'test',
            }],
        }),
        MainModel.fromData({
            id: 'MainModel/111111111111',
            string: 'testing',
            arrayOfString: ['testing'],
            linkedMany: [{
                id: 'LinkedManyModel/111111111111',
                string: 'testing',
            }],
        }),
    ]);
});
