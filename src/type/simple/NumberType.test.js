import NumberType from './NumberType.js';
import test from 'ava';

test('NumberType is Number', t => {
    t.is(NumberType.toString(), 'Number');
});

test('NumberType is not required', t => {
    t.is(NumberType._required, false);
});

test('NumberType does not have properties', t => {
    t.assert(NumberType._properties === undefined);
});

test('NumberType does not have items', t => {
    t.assert(NumberType._items === undefined);
});

test('NumberType is not a resolved type', t => {
    t.is(NumberType._resolved, false);
});

test('RequiredNumberType is Number', t => {
    t.is(NumberType.required.toString(), 'RequiredNumber');
});

test('RequiredNumberType is required', t => {
    t.is(NumberType.required._required, true);
});

test('RequiredNumberType does not have properties', t => {
    t.assert(NumberType.required._properties === undefined);
});

test('RequiredNumberType does not have items', t => {
    t.assert(NumberType.required._items === undefined);
});

test('RequiredNumberType is not a resolved type', t => {
    t.is(NumberType.required._resolved, false);
});
