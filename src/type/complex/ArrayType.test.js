import ArrayType from './ArrayType.js';
import BooleanType from '../simple/BooleanType.js';
import DateType from '../simple/DateType.js';
import NumberType from '../simple/NumberType.js';
import StringType from '../simple/StringType.js';
import test from 'ava';

const typesToTest = [StringType, NumberType, BooleanType, DateType];

for (const type of typesToTest) {
    test(`ArrayType.of(${type}) is ArrayOf(${type})`, t => {
        t.is(ArrayType.of(type).toString(), `ArrayOf(${type})`);
    });

    test(`ArrayType.of(${type}) is not required`, t => {
        t.is(ArrayType.of(type)._required, false);
    });

    test(`ArrayType.of(${type}) does not have properties`, t => {
        t.assert(ArrayType.of(type)._properties === undefined);
    });

    test(`ArrayType.of(${type}) has items of type String`, t => {
        t.is(ArrayType.of(type)._items, type);
    });

    test(`ArrayType.of(${type}) is not a resolved type`, t => {
        t.is(ArrayType.of(type)._resolved, false);
    });

    test(`RequiredArrayType.of(${type}) is RequiredArrayOf(${type})`, t => {
        t.is(ArrayType.of(type).required.toString(), `RequiredArrayOf(${type})`);
    });

    test(`RequiredArrayType.of(${type}) is required`, t => {
        t.is(ArrayType.of(type).required._required, true);
    });

    test(`RequiredArrayType.of(${type}) does not have properties`, t => {
        t.assert(ArrayType.of(type).required._properties === undefined);
    });

    test(`RequiredArrayType.of(${type}) has items of type String`, t => {
        t.is(ArrayType.of(type).required._items, type);
    });

    test(`RequiredArrayType.of(${type}) is not a resolved type`, t => {
        t.is(ArrayType.of(type).required._resolved, false);
    });
}
