import ArrayType from './ArrayType.js';
import BooleanType from '../simple/BooleanType.js';
import NumberType from '../simple/NumberType.js';
import StringType from '../simple/StringType.js';
import test from 'ava';

test('ArrayType.of(StringType) is ArrayOf(String)', t => {
    t.is(ArrayType.of(StringType).toString(), 'ArrayOf(String)');
});

test('ArrayType.of(StringType) is not required', t => {
    t.is(ArrayType.of(StringType)._required, false);
});

test('ArrayType.of(StringType) does not have properties', t => {
    t.is(ArrayType.of(StringType)._properties, undefined);
});

test('ArrayType.of(StringType) has items of type String', t => {
    t.is(ArrayType.of(StringType)._items, StringType);
});

test('ArrayType.of(StringType) is not a resolved type', t => {
    t.is(ArrayType.of(StringType)._resolved, false);
});

test('RequiredArrayType.of(StringType) is RequiredArrayOf(String)', t => {
    t.is(ArrayType.of(StringType).required.toString(), 'RequiredArrayOf(String)');
});

test('RequiredArrayType.of(StringType) is required', t => {
    t.is(ArrayType.of(StringType).required._required, true);
});

test('RequiredArrayType.of(StringType) does not have properties', t => {
    t.is(ArrayType.of(StringType).required._properties, undefined);
});

test('RequiredArrayType.of(StringType) has items of type String', t => {
    t.is(ArrayType.of(StringType).required._items, StringType);
});

test('RequiredArrayType.of(StringType) is not a resolved type', t => {
    t.is(ArrayType.of(StringType).required._resolved, false);
});

test('ArrayType.of(NumberType) is ArrayOf(Number)', t => {
    t.is(ArrayType.of(NumberType).toString(), 'ArrayOf(Number)');
});

test('ArrayType.of(NumberType) is not required', t => {
    t.is(ArrayType.of(NumberType)._required, false);
});

test('ArrayType.of(NumberType) does not have properties', t => {
    t.is(ArrayType.of(NumberType)._properties, undefined);
});

test('ArrayType.of(NumberType) has items of type Number', t => {
    t.is(ArrayType.of(NumberType)._items, NumberType);
});

test('ArrayType.of(NumberType) is not a resolved type', t => {
    t.is(ArrayType.of(NumberType)._resolved, false);
});

test('RequiredArrayType.of(NumberType) is RequiredArrayOf(Number)', t => {
    t.is(ArrayType.of(NumberType).required.toString(), 'RequiredArrayOf(Number)');
});

test('RequiredArrayType.of(NumberType) is required', t => {
    t.is(ArrayType.of(NumberType).required._required, true);
});

test('RequiredArrayType.of(NumberType) does not have properties', t => {
    t.is(ArrayType.of(NumberType).required._properties, undefined);
});

test('RequiredArrayType.of(NumberType) has items of type Number', t => {
    t.is(ArrayType.of(NumberType).required._items, NumberType);
});

test('RequiredArrayType.of(NumberType) is not a resolved type', t => {
    t.is(ArrayType.of(NumberType).required._resolved, false);
});

test('ArrayType.of(BooleanType) is ArrayOf(Boolean)', t => {
    t.is(ArrayType.of(BooleanType).toString(), 'ArrayOf(Boolean)');
});

test('ArrayType.of(BooleanType) is not required', t => {
    t.is(ArrayType.of(BooleanType)._required, false);
});

test('ArrayType.of(BooleanType) does not have properties', t => {
    t.is(ArrayType.of(BooleanType)._properties, undefined);
});

test('ArrayType.of(BooleanType) has items of type Boolean', t => {
    t.is(ArrayType.of(BooleanType)._items, BooleanType);
});

test('ArrayType.of(BooleanType) is not a resolved type', t => {
    t.is(ArrayType.of(BooleanType)._resolved, false);
});

test('RequiredArrayType.of(BooleanType) is RequiredArrayOf(Boolean)', t => {
    t.is(ArrayType.of(BooleanType).required.toString(), 'RequiredArrayOf(Boolean)');
});

test('RequiredArrayType.of(BooleanType) is required', t => {
    t.is(ArrayType.of(BooleanType).required._required, true);
});

test('RequiredArrayType.of(BooleanType) does not have properties', t => {
    t.is(ArrayType.of(BooleanType).required._properties, undefined);
});

test('RequiredArrayType.of(BooleanType) has items of type Boolean', t => {
    t.is(ArrayType.of(BooleanType).required._items, BooleanType);
});

test('RequiredArrayType.of(BooleanType) is not a resolved type', t => {
    t.is(ArrayType.of(BooleanType).required._resolved, false);
});
