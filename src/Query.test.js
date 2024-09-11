import {MainModel} from '../test/fixtures/TestModel.js';
import Query from './Query.js';
import {TestIndex} from '../test/fixtures/TestIndex.js';
import test from 'ava';

test('new Query(query) stores ', t => {
    const query = new Query({string: 'test'});

    t.deepEqual(query.query, {string: 'test'});
});

test('Query.execute(index) finds exact matches', t => {
    const query = new Query({string: 'test'});
    const results = query.execute(MainModel, TestIndex);

    t.deepEqual(results, [
        MainModel.fromData({
            id: 'MainModel/000000000000',
            string: 'test',
        }),
    ]);
});
