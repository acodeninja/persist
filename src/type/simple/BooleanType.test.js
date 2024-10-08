import BooleanType from './BooleanType.js';
import test from 'ava';

test('BooleanType is Boolean', t => {
    t.is(BooleanType.toString(), 'Boolean');
});

test('BooleanType is not required', t => {
    t.is(BooleanType._required, false);
});

test('BooleanType does not have properties', t => {
    t.assert(BooleanType._properties === undefined);
});

test('BooleanType does not have items', t => {
    t.assert(BooleanType._items === undefined);
});

test('BooleanType is not a resolved type', t => {
    t.is(BooleanType._resolved, false);
});

test('RequiredBooleanType is Boolean', t => {
    t.is(BooleanType.required.toString(), 'RequiredBoolean');
});

test('RequiredBooleanType is required', t => {
    t.is(BooleanType.required._required, true);
});

test('RequiredBooleanType does not have properties', t => {
    t.assert(BooleanType.required._properties === undefined);
});

test('RequiredBooleanType does not have items', t => {
    t.assert(BooleanType.required._items === undefined);
});

test('RequiredBooleanType is not a resolved type', t => {
    t.is(BooleanType.required._resolved, false);
});
